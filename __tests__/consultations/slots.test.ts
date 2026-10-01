import { describe, expect, it } from 'vitest';
import { dateKeyInZone, findBookableSlot, generateSlotDetails, generateSlotStates, generateSlots, isBookableSlot, parseDateOverrides, parseWeeklySlots, zonedTimeToUtc } from '@/features/consultations/lib/slots';

// Wed 2026-10-07 00:00 UTC
const NOW = new Date('2026-10-07T00:00:00Z');

describe('zonedTimeToUtc', () => {
  it('converts fixed-offset zones', () => {
    expect(zonedTimeToUtc(2026, 10, 8, 20, 0, 'Asia/Ho_Chi_Minh').toISOString()).toBe('2026-10-08T13:00:00.000Z');
    expect(zonedTimeToUtc(2026, 10, 8, 20, 0, 'Asia/Tokyo').toISOString()).toBe('2026-10-08T11:00:00.000Z');
  });
  it('handles DST on both sides of the change', () => {
    expect(zonedTimeToUtc(2026, 3, 1, 9, 0, 'America/New_York').toISOString()).toBe('2026-03-01T14:00:00.000Z'); // EST
    expect(zonedTimeToUtc(2026, 3, 15, 9, 0, 'America/New_York').toISOString()).toBe('2026-03-15T13:00:00.000Z'); // EDT
  });
});

describe('parseWeeklySlots', () => {
  it('accepts 24:00 as an end time but not as a start time', () => {
    expect(parseWeeklySlots([{ day: 1, start: '23:30', end: '24:00' }]).ok).toBe(true);
    expect(parseWeeklySlots([{ day: 1, start: '24:00', end: '24:00' }]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 1, start: '23:00', end: '24:30' }]).ok).toBe(false);
  });
  it('accepts valid windows', () => {
    expect(parseWeeklySlots([{ day: 4, start: '20:00', end: '22:00' }])).toEqual({ ok: true, slots: [{ day: 4, start: '20:00', end: '22:00' }] });
  });
  it.each([
    [null], [{}], [[{ day: 7, start: '20:00', end: '21:00' }]], [[{ day: 1, start: '8:00', end: '09:00' }]],
    [[{ day: 1, start: '10:00', end: '10:00' }]], [[{ day: 1.5, start: '10:00', end: '11:00' }]],
    [Array.from({ length: 29 }, () => ({ day: 1, start: '10:00', end: '11:00' }))],
  ])('rejects %j', input => {
    expect(parseWeeklySlots(input).ok).toBe(false);
  });
});

describe('generateSlots', () => {
  const base = { weeklySlots: [{ day: 4, start: '20:00', end: '21:00' }], timezone: 'Asia/Ho_Chi_Minh', durationMin: 30, now: NOW };

  it('expands a weekly window into UTC slots across the horizon', () => {
    // Thursdays in the next 14 days: Oct 8 and Oct 15 → 2 slots each.
    expect(generateSlots(base).map(d => d.toISOString())).toEqual([
      '2026-10-08T13:00:00.000Z', '2026-10-08T13:30:00.000Z',
      '2026-10-15T13:00:00.000Z', '2026-10-15T13:30:00.000Z',
    ]);
  });
  it('offers the last half hour of the day when the window ends at 24:00', () => {
    const late = generateSlots({ ...base, weeklySlots: [{ day: 4, start: '23:30', end: '24:00' }] });
    expect(late[0].toISOString()).toBe('2026-10-08T16:30:00.000Z'); // 23:30 in Ho Chi Minh
  });
  it('drops slots that do not fully fit the window', () => {
    expect(generateSlots({ ...base, durationMin: 45 })).toHaveLength(2);
  });
  it('skips slots inside the lead time', () => {
    const now = new Date('2026-10-08T11:15:00Z'); // 2h lead → earliest 13:15, so 13:00 is gone
    expect(generateSlots({ ...base, now })[0].toISOString()).toBe('2026-10-08T13:30:00.000Z');
  });
  it('excludes busy ranges', () => {
    const busy = [{ startAt: new Date('2026-10-08T13:00:00Z'), endAt: new Date('2026-10-08T13:30:00Z') }];
    expect(generateSlots({ ...base, busy }).map(d => d.toISOString())).not.toContain('2026-10-08T13:00:00.000Z');
  });
  it('dedupes overlapping windows and returns nothing for bad input', () => {
    expect(generateSlots({ ...base, weeklySlots: [...base.weeklySlots, ...base.weeklySlots] })).toHaveLength(4);
    expect(generateSlots({ ...base, timezone: 'Not/AZone' })).toEqual([]);
    expect(generateSlots({ ...base, weeklySlots: [] })).toEqual([]);
  });
  it('validates a requested start against the pattern', () => {
    expect(isBookableSlot(new Date('2026-10-08T13:30:00Z'), base)).toBe(true);
    expect(isBookableSlot(new Date('2026-10-08T13:10:00Z'), base)).toBe(false);
  });
});

describe('generateSlotStates', () => {
  const base = { weeklySlots: [{ day: 4, start: '20:00', end: '21:00' }], timezone: 'Asia/Ho_Chi_Minh', durationMin: 30, now: NOW };
  it('keeps busy slots but flags them as taken', () => {
    const busy = [{ startAt: new Date('2026-10-08T13:00:00Z'), endAt: new Date('2026-10-08T13:30:00Z') }];
    const states = generateSlotStates({ ...base, busy });
    expect(states).toHaveLength(4);
    expect(states.filter(s => s.taken).map(s => s.start.toISOString())).toEqual(['2026-10-08T13:00:00.000Z']);
  });
});

describe('date overrides', () => {
  const base = { weeklySlots: [{ day: 4, start: '20:00', end: '21:00' }], timezone: 'Asia/Ho_Chi_Minh', durationMin: 30, now: NOW };
  it('an empty override is a day off (host zone)', () => {
    const slots = generateSlots({ ...base, overrides: { '2026-10-08': [] } }).map(d => d.toISOString());
    expect(slots).toEqual(['2026-10-15T13:00:00.000Z', '2026-10-15T13:30:00.000Z']);
  });
  it('an override replaces the weekly hours for that date only', () => {
    const slots = generateSlots({ ...base, overrides: { '2026-10-08': [{ start: '09:00', end: '09:30' }] } }).map(d => d.toISOString());
    expect(slots).toEqual(['2026-10-08T02:00:00.000Z', '2026-10-15T13:00:00.000Z', '2026-10-15T13:30:00.000Z']);
  });
  it('adds availability on a day with no weekly hours, even with an empty weekly pattern', () => {
    const slots = generateSlots({ ...base, weeklySlots: [], overrides: { '2026-10-10': [{ start: '10:00', end: '10:30' }] } });
    expect(slots.map(d => d.toISOString())).toEqual(['2026-10-10T03:00:00.000Z']);
  });
  it('uses the host calendar date, not UTC', () => {
    // 07:00 Thu in Tokyo is still Wed 22:00 UTC; turning Thursday off must remove it.
    const tokyo = { weeklySlots: [{ day: 4, start: '07:00', end: '07:30' }], timezone: 'Asia/Tokyo', durationMin: 30, now: NOW };
    expect(generateSlots({ ...tokyo, overrides: { '2026-10-08': [] } })[0].toISOString()).toBe('2026-10-14T22:00:00.000Z');
  });
  it('validates overrides and drops past dates', () => {
    expect(parseDateOverrides({ '2026-10-20': [{ start: '09:00', end: '10:00' }], '2026-10-01': [] }, '2026-10-07'))
      .toEqual({ ok: true, overrides: { '2026-10-20': [{ start: '09:00', end: '10:00' }] } });
    expect(parseDateOverrides({ '2026-02-30': [] }, '2026-01-01').ok).toBe(false);
    expect(parseDateOverrides({ '2026-10-20': [{ start: '10:00', end: '09:00' }] }, '2026-01-01').ok).toBe(false);
    expect(parseDateOverrides([], '2026-01-01').ok).toBe(false);
  });
  it('computes the date key in a zone', () => {
    expect(dateKeyInZone(new Date('2026-10-07T22:00:00Z'), 'Asia/Tokyo')).toBe('2026-10-08');
    expect(dateKeyInZone(new Date('2026-10-07T22:00:00Z'), 'UTC')).toBe('2026-10-07');
  });
});

describe('per-window options', () => {
  const base = { timezone: 'Asia/Ho_Chi_Minh', durationMin: 30, now: NOW };
  it('uses each window\'s own duration and carries its meeting link', () => {
    const slots = generateSlotDetails({ ...base, weeklySlots: [
      { day: 4, start: '09:00', end: '11:00', durationMin: 60, meetingUrl: 'https://zoom.us/j/1' },
      { day: 4, start: '20:00', end: '21:00' },
    ], days: 2 });
    expect(slots.map(s => [s.start.toISOString(), s.durationMin, s.meetingUrl ?? null])).toEqual([
      ['2026-10-08T02:00:00.000Z', 60, 'https://zoom.us/j/1'],
      ['2026-10-08T03:00:00.000Z', 60, 'https://zoom.us/j/1'],
      ['2026-10-08T13:00:00.000Z', 30, null],
      ['2026-10-08T13:30:00.000Z', 30, null],
    ]);
    expect(findBookableSlot(new Date('2026-10-08T03:00:00Z'), { ...base, weeklySlots: [{ day: 4, start: '09:00', end: '11:00', durationMin: 60 }] })?.durationMin).toBe(60);
  });
  it('rejects overlapping windows, bad durations and non-https links', () => {
    expect(parseWeeklySlots([{ day: 1, start: '09:00', end: '11:00' }, { day: 1, start: '10:30', end: '12:00' }]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 1, start: '09:00', end: '11:00' }, { day: 2, start: '10:30', end: '12:00' }]).ok).toBe(true);
    expect(parseWeeklySlots([{ day: 1, start: '09:00', end: '11:00', durationMin: 25 }]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 1, start: '09:00', end: '11:00', meetingUrl: 'http://zoom.us/j/1' }]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 1, start: '09:00', end: '11:00', meetingUrl: '  ' }])).toEqual({ ok: true, slots: [{ day: 1, start: '09:00', end: '11:00' }] });
  });
  it('keeps window options on date overrides', () => {
    expect(parseDateOverrides({ '2026-10-20': [{ start: '09:00', end: '10:00', durationMin: 15, meetingUrl: 'https://meet.google.com/x' }] }, '2026-10-07'))
      .toEqual({ ok: true, overrides: { '2026-10-20': [{ start: '09:00', end: '10:00', durationMin: 15, meetingUrl: 'https://meet.google.com/x' }] } });
  });
});

describe('repeat period (from/until)', () => {
  const base = { timezone: 'Asia/Ho_Chi_Minh', durationMin: 30, now: NOW };
  it('only repeats inside its from/until period', () => {
    const slots = generateSlots({ ...base, weeklySlots: [{ day: 4, start: '20:00', end: '20:30', until: '2026-10-10' }] });
    expect(slots.map(d => d.toISOString())).toEqual(['2026-10-08T13:00:00.000Z']); // Oct 15 is after `until`
    const later = generateSlots({ ...base, weeklySlots: [{ day: 4, start: '20:00', end: '20:30', from: '2026-10-12' }] });
    expect(later.map(d => d.toISOString())).toEqual(['2026-10-15T13:00:00.000Z']);
  });
  it('allows the same hours in non-overlapping periods but rejects overlapping ones', () => {
    expect(parseWeeklySlots([
      { day: 2, start: '19:00', end: '21:00', until: '2026-10-31' },
      { day: 2, start: '19:00', end: '21:00', from: '2026-11-01' },
    ]).ok).toBe(true);
    expect(parseWeeklySlots([
      { day: 2, start: '19:00', end: '21:00', until: '2026-10-31' },
      { day: 2, start: '20:00', end: '22:00', from: '2026-10-15' },
    ]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 2, start: '19:00', end: '21:00', from: '2026-11-01', until: '2026-10-01' }]).ok).toBe(false);
    expect(parseWeeklySlots([{ day: 2, start: '19:00', end: '21:00', until: '2026-02-30' }]).ok).toBe(false);
  });
});

