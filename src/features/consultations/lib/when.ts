import { isValidTimeZone } from './slots';

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** A valid IANA zone from untrusted input, else null. */
export function cleanTimeZone(raw: unknown): string | null {
  return typeof raw === 'string' && raw.length <= 64 && isValidTimeZone(raw) ? raw : null;
}

/**
 * When a session happens, worded for the reader's own clock, e.g. "thứ Hai, 13/10, 21:00 (Asia/Tokyo)".
 * If the other participant's clock reads differently, it's added: "… (Asia/Tokyo; 19:00 13/10 giờ Asia/Ho_Chi_Minh)".
 */
export function formatInZone(date: Date, tz: string, otherTz?: string | null) {
  const text = new Intl.DateTimeFormat('vi-VN', {
    timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  const short = (z: string) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: z, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    return `${get('hour')}:${get('minute')} ${get('day')}/${get('month')}`;
  };
  if (!otherTz || otherTz === tz || short(otherTz) === short(tz)) return `${text} (${tz})`;
  return `${text} (${tz}; ${short(otherTz)} giờ ${otherTz})`;
}

/** Both participants' zones for a booking; older bookings without a guest zone fall back to the host's. */
export function bookingZones(c: { guestTimezone: string | null; host: { consultationSettings: { timezone: string } | null } }) {
  const host = c.host.consultationSettings?.timezone ?? DEFAULT_TIMEZONE;
  return { host, guest: c.guestTimezone ?? host };
}
