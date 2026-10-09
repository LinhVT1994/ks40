import { describe, expect, it } from 'vitest';
import { bookingZones, cleanTimeZone, formatInZone } from '@/features/consultations/lib/when';

const at = new Date('2026-10-13T12:00:00Z'); // 19:00 in Hà Nội, 21:00 in Tokyo

describe('formatInZone', () => {
  it("words the time in the reader's zone", () => {
    expect(formatInZone(at, 'Asia/Tokyo')).toMatch(/^21:00 .*13\/10 \(Asia\/Tokyo\)$/);
  });

  it("adds the other participant's clock when it differs", () => {
    expect(formatInZone(at, 'Asia/Tokyo', 'Asia/Ho_Chi_Minh')).toMatch(/\(Asia\/Tokyo; 19:00 13\/10 giờ Asia\/Ho_Chi_Minh\)$/);
    expect(formatInZone(at, 'Asia/Ho_Chi_Minh', 'America/Los_Angeles')).toContain('05:00 13/10 giờ America/Los_Angeles');
  });

  it('skips the second clock when both read the same', () => {
    expect(formatInZone(at, 'Asia/Ho_Chi_Minh', 'Asia/Bangkok')).toMatch(/\(Asia\/Ho_Chi_Minh\)$/);
    expect(formatInZone(at, 'Asia/Ho_Chi_Minh', null)).toMatch(/\(Asia\/Ho_Chi_Minh\)$/);
  });
});

describe('cleanTimeZone', () => {
  it('keeps valid IANA zones only', () => {
    expect(cleanTimeZone('Europe/Berlin')).toBe('Europe/Berlin');
    expect(cleanTimeZone('Mars/Olympus')).toBeNull();
    expect(cleanTimeZone(42)).toBeNull();
    expect(cleanTimeZone('')).toBeNull();
  });
});

describe('bookingZones', () => {
  it("falls back to the host's zone for older bookings", () => {
    const host = { consultationSettings: { timezone: 'Asia/Ho_Chi_Minh' } };
    expect(bookingZones({ guestTimezone: null, host })).toEqual({ host: 'Asia/Ho_Chi_Minh', guest: 'Asia/Ho_Chi_Minh' });
    expect(bookingZones({ guestTimezone: 'Asia/Tokyo', host })).toEqual({ host: 'Asia/Ho_Chi_Minh', guest: 'Asia/Tokyo' });
  });
});
