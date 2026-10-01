/**
 * Consultation availability. Pure functions — safe on server and client.
 *
 * Hosts describe a weekly pattern in their own IANA time zone ("every Tue 20:00–22:00");
 * we expand it into concrete UTC start times for the booking window.
 */

export type WeeklySlot = { day: number; start: string; end: string };
export type BusyRange = { startAt: Date; endAt: Date };

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;
export const BOOKING_HORIZON_DAYS = 14;
export const MIN_LEAD_MINUTES = 120;
export const MAX_WEEKLY_WINDOWS = 28;
export const MAX_BLOCKED_DATES = 90;
export const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'] as const;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
/** End times may also be "24:00" (end of day), so the last slot of the day is bookable. */
const END_HHMM = /^(([01]\d|2[0-3]):([0-5]\d)|24:00)$/;

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Validate untrusted weekly slots (e.g. from a form). Returns a normalized copy or an error message. */
export function parseWeeklySlots(input: unknown): { ok: true; slots: WeeklySlot[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: 'Khung giờ không hợp lệ' };
  if (input.length > MAX_WEEKLY_WINDOWS) return { ok: false, error: `Tối đa ${MAX_WEEKLY_WINDOWS} khung giờ` };
  const slots: WeeklySlot[] = [];
  for (const raw of input) {
    const { day, start, end } = (raw ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(day) || (day as number) < 0 || (day as number) > 6) return { ok: false, error: 'Ngày trong tuần không hợp lệ' };
    if (typeof start !== 'string' || typeof end !== 'string' || !HHMM.test(start) || !END_HHMM.test(end)) return { ok: false, error: 'Giờ phải có dạng HH:MM' };
    if (toMinutes(start) >= toMinutes(end)) return { ok: false, error: 'Giờ kết thúc phải sau giờ bắt đầu' };
    slots.push({ day: day as number, start, end });
  }
  return { ok: true, slots };
}

/** Offset (ms) of `tz` from UTC at instant `date`: wall-clock-in-tz minus UTC. */
function tzOffsetMs(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convert a wall-clock time in `tz` to a UTC Date (handles DST by re-checking the offset). */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = tzOffsetMs(new Date(guess), tz);
  let utc = guess - first;
  const second = tzOffsetMs(new Date(utc), tz);
  if (second !== first) utc = guess - second;
  return new Date(utc);
}

/** Calendar date (y, m, d) of `date` as seen in `tz`. */
function zonedDate(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" of `date` as seen in `tz`. */
export function dateKeyInZone(date: Date, tz: string) {
  const { year, month, day } = zonedDate(date, tz);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Validate untrusted blocked dates; drops dates before `today` (host zone) and duplicates, sorts the rest. */
export function parseBlockedDates(input: unknown, today: string): { ok: true; dates: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: 'Danh sách ngày nghỉ không hợp lệ' };
  const dates = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, error: 'Ngày nghỉ không hợp lệ' };
    const [y, m, d] = raw.split('-').map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return { ok: false, error: 'Ngày nghỉ không hợp lệ' };
    if (raw >= today) dates.add(raw);
  }
  if (dates.size > MAX_BLOCKED_DATES) return { ok: false, error: `Tối đa ${MAX_BLOCKED_DATES} ngày nghỉ` };
  return { ok: true, dates: [...dates].sort() };
}

function overlaps(start: number, end: number, busy: BusyRange[]) {
  return busy.some(b => start < b.endAt.getTime() && end > b.startAt.getTime());
}

/** Expand a weekly pattern into bookable UTC start times, sorted, excluding past/too-soon and busy times. */
export function generateSlots(opts: {
  weeklySlots: WeeklySlot[];
  timezone: string;
  durationMin: number;
  now?: Date;
  days?: number;
  leadMinutes?: number;
  busy?: BusyRange[];
  /** "YYYY-MM-DD" dates (host zone) with no availability. */
  blockedDates?: string[];
}): Date[] {
  const { weeklySlots, timezone, durationMin, now = new Date(), days = BOOKING_HORIZON_DAYS, leadMinutes = MIN_LEAD_MINUTES, busy = [], blockedDates = [] } = opts;
  const blocked = new Set(blockedDates);
  if (!weeklySlots.length || durationMin <= 0 || !isValidTimeZone(timezone)) return [];

  const earliest = now.getTime() + leadMinutes * 60_000;
  const today = zonedDate(now, timezone);
  const starts = new Set<number>();

  for (let offset = 0; offset < days; offset++) {
    // Calendar arithmetic in UTC is safe for dates (no wall-clock involved).
    const cal = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const weekday = cal.getUTCDay();
    if (blocked.has(`${cal.getUTCFullYear()}-${pad2(cal.getUTCMonth() + 1)}-${pad2(cal.getUTCDate())}`)) continue;
    for (const window of weeklySlots) {
      if (window.day !== weekday) continue;
      for (let m = toMinutes(window.start); m + durationMin <= toMinutes(window.end); m += durationMin) {
        const start = zonedTimeToUtc(cal.getUTCFullYear(), cal.getUTCMonth() + 1, cal.getUTCDate(), Math.floor(m / 60), m % 60, timezone).getTime();
        if (start < earliest) continue;
        if (overlaps(start, start + durationMin * 60_000, busy)) continue;
        starts.add(start);
      }
    }
  }
  return [...starts].sort((a, b) => a - b).map(t => new Date(t));
}

/** True if `startAt` is exactly one of the host's currently bookable slots. */
export function isBookableSlot(startAt: Date, opts: Parameters<typeof generateSlots>[0]) {
  return generateSlots(opts).some(s => s.getTime() === startAt.getTime());
}

export type SlotState = { start: Date; taken: boolean };

/**
 * Every slot of the pattern in the booking window, flagged `taken` when it overlaps a busy range.
 * Used to render a calendar where booked times stay visible (greyed) instead of disappearing.
 */
export function generateSlotStates(opts: Parameters<typeof generateSlots>[0]): SlotState[] {
  const { busy = [], ...rest } = opts;
  return generateSlots(rest).map(start => {
    const end = start.getTime() + rest.durationMin * 60_000;
    return { start, taken: overlaps(start.getTime(), end, busy) };
  });
}
