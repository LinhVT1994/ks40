/**
 * Consultation availability. Pure functions — safe on server and client.
 *
 * Hosts describe a weekly pattern in their own IANA time zone ("every Tue 20:00–22:00");
 * we expand it into concrete UTC start times for the booking window.
 */

/** Per-window session options. Missing values fall back to the host defaults. */
export type WindowOptions = { durationMin?: number; meetingUrl?: string };
/**
 * A recurring weekly window. `from`/`until` ("YYYY-MM-DD", host zone, inclusive) limit the period
 * it repeats in — e.g. "every Tue 19–21, for the next month". Missing = open-ended.
 */
export type WeeklySlot = { day: number; start: string; end: string; from?: string; until?: string } & WindowOptions;
export type BusyRange = { startAt: Date; endAt: Date };
export type DateWindow = { start: string; end: string } & WindowOptions;
/** Per-date availability that replaces the weekly pattern for that day; `[]` = day off. Keys are "YYYY-MM-DD" in the host zone. */
export type DateOverrides = Record<string, DateWindow[]>;

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;
export const BOOKING_HORIZON_DAYS = 14;
export const MIN_LEAD_MINUTES = 120;
export const MAX_WEEKLY_WINDOWS = 28;
export const MAX_DATE_OVERRIDES = 120;
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

/** https URL (≤ 500 chars), or null. */
export function isMeetingUrl(value: string) {
  if (value.length > 500) return false;
  try {
    return new URL(value).protocol === 'https:';
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
    const { day, start, end, durationMin, meetingUrl, from, until } = (raw ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(day) || (day as number) < 0 || (day as number) > 6) return { ok: false, error: 'Ngày trong tuần không hợp lệ' };
    if (typeof start !== 'string' || typeof end !== 'string' || !HHMM.test(start) || !END_HHMM.test(end)) return { ok: false, error: 'Giờ phải có dạng HH:MM' };
    if (toMinutes(start) >= toMinutes(end)) return { ok: false, error: 'Giờ kết thúc phải sau giờ bắt đầu' };
    const slot: WeeklySlot = { day: day as number, start, end };
    if (durationMin !== undefined && durationMin !== null) {
      if (!DURATION_OPTIONS.includes(durationMin as (typeof DURATION_OPTIONS)[number])) return { ok: false, error: 'Thời lượng không hợp lệ' };
      slot.durationMin = durationMin as number;
    }
    if (typeof meetingUrl === 'string' && meetingUrl.trim()) {
      if (!isMeetingUrl(meetingUrl.trim())) return { ok: false, error: 'Link họp phải là đường dẫn https:// hợp lệ' };
      slot.meetingUrl = meetingUrl.trim();
    }
    for (const [key, value] of [['from', from], ['until', until]] as const) {
      if (value === undefined || value === null || value === '') continue;
      if (typeof value !== 'string' || !isRealDate(value)) return { ok: false, error: 'Khoảng thời gian lặp lại không hợp lệ' };
      slot[key] = value;
    }
    if (slot.from && slot.until && slot.from > slot.until) return { ok: false, error: 'Ngày kết thúc lặp lại phải sau ngày bắt đầu' };
    slots.push(slot);
  }
  // Windows of the same weekday must not overlap while both are in effect — each minute belongs to one window.
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      if (a.day !== b.day) continue;
      const timesOverlap = toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
      const periodsOverlap = (a.from ?? '') <= (b.until ?? '9999-12-31') && (b.from ?? '') <= (a.until ?? '9999-12-31');
      if (timesOverlap && periodsOverlap) return { ok: false, error: 'Các khung giờ trong cùng một ngày bị chồng nhau' };
    }
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

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(key: string) {
  if (!DATE_KEY.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}

/** Minute of the day (0-1439) of `date` as seen in `tz`. */
export function minutesInZone(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return get('hour') * 60 + get('minute');
}

/** Validate untrusted per-date overrides; drops dates before `today` (host zone). */
export function parseDateOverrides(input: unknown, today: string): { ok: true; overrides: DateOverrides } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Lịch theo ngày không hợp lệ' };
  const overrides: DateOverrides = {};
  for (const [key, windows] of Object.entries(input as Record<string, unknown>)) {
    if (!isRealDate(key)) return { ok: false, error: 'Ngày không hợp lệ' };
    if (!Array.isArray(windows)) return { ok: false, error: 'Lịch theo ngày không hợp lệ' };
    // Reuse the weekly validator by tagging every window with a dummy weekday.
    const parsed = parseWeeklySlots(windows.map(w => ({ ...(w as object), day: 0 })));
    if (!parsed.ok) return parsed;
    if (key >= today) overrides[key] = parsed.slots.map(toDateWindow);
  }
  if (Object.keys(overrides).length > MAX_DATE_OVERRIDES) return { ok: false, error: `Tối đa ${MAX_DATE_OVERRIDES} ngày chỉnh riêng` };
  return { ok: true, overrides };
}

/** Whether a weekly window repeats on calendar date `dateKey` (within its from/until period). */
export function windowCovers(w: Pick<WeeklySlot, 'from' | 'until'>, dateKey: string) {
  return (!w.from || dateKey >= w.from) && (!w.until || dateKey <= w.until);
}

/** A weekly window without its weekday or period, keeping only the options that are set. */
const toDateWindow = ({ start, end, durationMin, meetingUrl }: WeeklySlot): DateWindow =>
  ({ start, end, ...(durationMin !== undefined && { durationMin }), ...(meetingUrl && { meetingUrl }) });

/** Effective windows for a calendar date: its override if any, else the weekly pattern for that weekday. */
export function windowsForDate(dateKey: string, weekday: number, weeklySlots: WeeklySlot[], overrides: DateOverrides): DateWindow[] {
  return overrides[dateKey] ?? weeklySlots.filter(w => w.day === weekday && windowCovers(w, dateKey)).map(toDateWindow);
}

function overlaps(start: number, end: number, busy: BusyRange[]) {
  return busy.some(b => start < b.endAt.getTime() && end > b.startAt.getTime());
}

export type SlotDetail = { start: Date; durationMin: number; meetingUrl?: string };

type GenerateOptions = {
  weeklySlots: WeeklySlot[];
  timezone: string;
  /** Default session length for windows without their own `durationMin`. */
  durationMin: number;
  now?: Date;
  days?: number;
  leadMinutes?: number;
  busy?: BusyRange[];
  /** Per-date replacements of the weekly pattern (host zone). */
  overrides?: DateOverrides;
};

/** Expand the weekly pattern (plus per-date overrides) into bookable slots, sorted, excluding past/too-soon and busy times. */
export function generateSlotDetails(opts: GenerateOptions): SlotDetail[] {
  const { weeklySlots, timezone, durationMin, now = new Date(), days = BOOKING_HORIZON_DAYS, leadMinutes = MIN_LEAD_MINUTES, busy = [], overrides = {} } = opts;
  if ((!weeklySlots.length && !Object.keys(overrides).length) || !isValidTimeZone(timezone)) return [];

  const earliest = now.getTime() + leadMinutes * 60_000;
  const today = zonedDate(now, timezone);
  const slots = new Map<number, SlotDetail>();

  for (let offset = 0; offset < days; offset++) {
    // Calendar arithmetic in UTC is safe for dates (no wall-clock involved).
    const cal = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const key = `${cal.getUTCFullYear()}-${pad2(cal.getUTCMonth() + 1)}-${pad2(cal.getUTCDate())}`;
    for (const window of windowsForDate(key, cal.getUTCDay(), weeklySlots, overrides)) {
      const step = window.durationMin ?? durationMin;
      if (step <= 0) continue;
      for (let m = toMinutes(window.start); m + step <= toMinutes(window.end); m += step) {
        const start = zonedTimeToUtc(cal.getUTCFullYear(), cal.getUTCMonth() + 1, cal.getUTCDate(), Math.floor(m / 60), m % 60, timezone).getTime();
        if (start < earliest) continue;
        if (overlaps(start, start + step * 60_000, busy)) continue;
        if (!slots.has(start)) slots.set(start, { start: new Date(start), durationMin: step, ...(window.meetingUrl && { meetingUrl: window.meetingUrl }) });
      }
    }
  }
  return [...slots.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Bookable UTC start times (see `generateSlotDetails`). */
export function generateSlots(opts: GenerateOptions): Date[] {
  return generateSlotDetails(opts).map(s => s.start);
}

/** True if `startAt` is exactly one of the host's currently bookable slots. */
export function isBookableSlot(startAt: Date, opts: GenerateOptions) {
  return !!findBookableSlot(startAt, opts);
}

/** The bookable slot starting exactly at `startAt`, with its duration and window link. */
export function findBookableSlot(startAt: Date, opts: GenerateOptions) {
  return generateSlotDetails(opts).find(s => s.start.getTime() === startAt.getTime()) ?? null;
}

export type SlotState = { start: Date; taken: boolean; durationMin: number };

/**
 * Every slot of the pattern in the booking window, flagged `taken` when it overlaps a busy range.
 * Used to render a calendar where booked times stay visible (greyed) instead of disappearing.
 */
export function generateSlotStates(opts: GenerateOptions): SlotState[] {
  const { busy = [], ...rest } = opts;
  return generateSlotDetails(rest).map(({ start, durationMin }) => ({
    start, durationMin, taken: overlaps(start.getTime(), start.getTime() + durationMin * 60_000, busy),
  }));
}
