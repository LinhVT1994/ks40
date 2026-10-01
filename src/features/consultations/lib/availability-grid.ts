/**
 * Weekly availability as a paintable grid of 30-minute cells, converted to/from the stored
 * `WeeklySlot[]` windows. Cell key: `${day}-${minuteOfDay}` (day 0-6 = Sun-Sat).
 */
import { toMinutes, type WeeklySlot } from './slots';

export const CELL_MINUTES = 30;
export const DEFAULT_RANGE = { from: 7 * 60, to: 23 * 60 };

const pad = (n: number) => String(n).padStart(2, '0');
export const minutesToHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const cellKey = (day: number, minute: number) => `${day}-${minute}`;

/** Expand windows into 30-minute cells (partial cells are rounded outward). */
export function windowsToCells(windows: WeeklySlot[]): Set<string> {
  const cells = new Set<string>();
  for (const w of windows) {
    const start = Math.floor(toMinutes(w.start) / CELL_MINUTES) * CELL_MINUTES;
    const end = Math.ceil(toMinutes(w.end) / CELL_MINUTES) * CELL_MINUTES;
    for (let m = start; m < end; m += CELL_MINUTES) cells.add(cellKey(w.day, m));
  }
  return cells;
}

/** Merge consecutive cells per day back into windows, ordered by day then time. */
export function cellsToWindows(cells: Set<string>): WeeklySlot[] {
  const byDay = new Map<number, number[]>();
  for (const key of cells) {
    const [day, minute] = key.split('-').map(Number);
    byDay.set(day, [...(byDay.get(day) ?? []), minute]);
  }
  const windows: WeeklySlot[] = [];
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    const minutes = byDay.get(day)!.sort((a, b) => a - b);
    let start = minutes[0];
    let prev = minutes[0];
    for (const m of [...minutes.slice(1), Infinity]) {
      if (m !== prev + CELL_MINUTES) {
        windows.push({ day, start: minutesToHHMM(start), end: minutesToHHMM(prev + CELL_MINUTES) }); // may be "24:00"
        start = m;
      }
      prev = m;
    }
  }
  return windows;
}

/** Visible hour range: the default, widened to include any existing availability. */
export function gridRange(cells: Set<string>) {
  let { from, to } = DEFAULT_RANGE;
  for (const key of cells) {
    const minute = Number(key.split('-')[1]);
    from = Math.min(from, Math.floor(minute / 60) * 60);
    to = Math.max(to, Math.ceil((minute + CELL_MINUTES) / 60) * 60);
  }
  return { from, to: Math.min(to, 24 * 60) };
}

export const PRESETS: { id: string; label: string; windows: WeeklySlot[] }[] = [
  { id: 'weeknight', label: 'Tối trong tuần · 19:00–21:00', windows: [1, 2, 3, 4, 5].map(day => ({ day, start: '19:00', end: '21:00' })) },
  { id: 'weekend', label: 'Sáng cuối tuần · 09:00–11:00', windows: [6, 0].map(day => ({ day, start: '09:00', end: '11:00' })) },
  { id: 'lunch', label: 'Giờ nghỉ trưa · 12:00–13:00', windows: [1, 2, 3, 4, 5].map(day => ({ day, start: '12:00', end: '13:00' })) },
];
