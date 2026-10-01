'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_AHEAD = 3;
const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Props = {
  /** Selected "YYYY-MM-DD" dates. */
  value: string[];
  onChange: (dates: string[]) => void;
  /** Today in the host's zone ("YYYY-MM-DD"); earlier days can't be picked. */
  today: string;
  /** Dates that already have pending/confirmed bookings. */
  bookedDates: string[];
};

const fmt = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
};

/** Month calendar to toggle days off (vacations, busy days). Dates are plain calendar days in the host's zone. */
export default function BlockedDatesPicker({ value, onChange, today, bookedDates }: Props) {
  const [ty, tm] = today.split('-').map(Number);
  const [offset, setOffset] = useState(0);
  const year = new Date(ty, tm - 1 + offset, 1).getFullYear();
  const month = new Date(ty, tm - 1 + offset, 1).getMonth();
  const selected = new Set(value);
  const booked = new Set(bookedDates);

  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => key(year, month, i + 1))];

  const toggle = (k: string) => onChange(selected.has(k) ? value.filter(v => v !== k) : [...value, k].sort());
  const bookedAndBlocked = value.filter(v => booked.has(v));

  return (
    <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => setOffset(o => o - 1)} disabled={offset === 0} aria-label="Tháng trước"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-zinc-700 dark:text-slate-200">Tháng {month + 1}, {year}</span>
          <button type="button" onClick={() => setOffset(o => o + 1)} disabled={offset >= MONTHS_AHEAD} aria-label="Tháng sau"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(w => <span key={w} className="text-[10px] font-bold text-zinc-400 py-1">{w}</span>)}
          {cells.map((k, i) => {
            if (!k) return <span key={`e${i}`} />;
            const past = k < today;
            const on = selected.has(k);
            return (
              <button key={k} type="button" disabled={past} onClick={() => toggle(k)} aria-pressed={on}
                title={booked.has(k) ? 'Ngày này đã có lịch hẹn' : undefined}
                className={cn('relative h-9 rounded-lg text-sm tabular-nums transition-colors',
                  past ? 'text-zinc-300 dark:text-slate-700' : on ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-semibold line-through' : 'text-zinc-700 dark:text-slate-200 hover:bg-primary/10',
                  k === today && !on && 'ring-1 ring-primary/40')}>
                {Number(k.slice(8))}
                {booked.has(k) && <span className={cn('absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full', on ? 'bg-amber-400' : 'bg-primary')} />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-zinc-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Ngày đã có lịch hẹn</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-2">Ngày đã chọn nghỉ ({value.length})</p>
        {value.length === 0 ? (
          <p className="text-xs text-zinc-500 leading-relaxed">Chưa có ngày nào. Bấm vào một ngày trên lịch để không nhận đặt lịch hôm đó — ví dụ khi đi công tác hay nghỉ lễ.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map(k => (
              <span key={k} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-xs font-medium text-zinc-700 dark:text-slate-200">
                {fmt(k)}
                <button type="button" onClick={() => toggle(k)} aria-label={`Bỏ ngày ${fmt(k)}`} className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        {bookedAndBlocked.length > 0 && (
          <p className="mt-4 text-xs rounded-xl px-3 py-2.5 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 leading-relaxed">
            {bookedAndBlocked.map(fmt).join(', ')} đã có lịch hẹn. Chặn ngày không tự hủy các lịch này — hãy hủy hoặc liên hệ người đặt trong tab “Lịch hẹn” nếu cần.
          </p>
        )}
      </div>
    </div>
  );
}
