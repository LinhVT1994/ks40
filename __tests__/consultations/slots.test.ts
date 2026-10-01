import { describe, expect, it } from 'vitest';
import { generateSlots, isBookableSlot, parseWeeklySlots, zonedTimeToUtc } from '@/features/consultations/lib/slots';

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
