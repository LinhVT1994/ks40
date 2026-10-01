'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PickerSlot = { start: Date; taken: boolean };

type Props = {
  slots: PickerSlot[];
  selected: string | null;
  onSelect: (iso: string) => void;
};

// Everything below works in the viewer's local time zone.
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeKey = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday of the week containing `d`. */
const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function SlotButton({ slot, selected, onSelect, className }: { slot: PickerSlot; selected: boolean; onSelect: (iso: string) => void; className?: string }) {
  if (slot.taken) {
    return (
      <span title="Đã có người đặt" className={cn('flex items-center justify-center rounded-lg text-[11px] font-medium text-zinc-400 dark:text-slate-600 bg-zinc-100 dark:bg-white/[0.03] line-through decoration-zinc-300 cursor-not-allowed', className)}>
        Kín
      </span>
    );
  }
  const iso = slot.start.toISOString();
  return (
    <button type="button" onClick={() => onSelect(iso)} aria-pressed={selected}
      className={cn('flex items-center justify-center rounded-lg text-xs font-semibold tabular-nums border transition-colors',
        selected ? 'bg-brand border-transparent text-white shadow-sm' : 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/50', className)}>
      {timeKey(slot.start)}
    </button>
  );
}

/** Desktop: a week grid (days × times) so free and booked times are visible at a glance. */
function WeekGrid({ slots, selected, onSelect }: Props) {
  const weeks = useMemo(() => {
    const keys = new Map<string, Date>();
    for (const s of slots) { const w = weekStart(s.start); keys.set(dayKey(w), w); }
    return [...keys.values()].sort((a, b) => a.getTime() - b.getTime());
  }, [slots]);
  const [index, setIndex] = useState(0);
  const week = weeks[Math.min(index, weeks.length - 1)];

  const { days, times, cells } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
    const end = addDays(week, 7).getTime();
    const inWeek = slots.filter(s => s.start.getTime() >= week.getTime() && s.start.getTime() < end);
    const times = [...new Set(inWeek.map(s => timeKey(s.start)))].sort();
    const cells = new Map(inWeek.map(s => [`${dayKey(s.start)}|${timeKey(s.start)}`, s]));
    return { days, times, cells };
  }, [slots, week]);

  const today = dayKey(new Date());
  const fmt = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setIndex(i => i - 1)} disabled={index === 0} aria-label="Tuần trước"
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-zinc-700 dark:text-slate-200">{fmt(days[0])} – {fmt(days[6])}</span>
        <button type="button" onClick={() => setIndex(i => i + 1)} disabled={index >= weeks.length - 1} aria-label="Tuần sau"
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] gap-1.5">
        <span />
        {days.map((d, i) => {
          const isToday = dayKey(d) === today;
          return (
            <div key={i} className={cn('text-center pb-1.5 rounded-lg', isToday && 'bg-primary/5')}>
              <div className={cn('text-[10px] font-bold uppercase tracking-wider', isToday ? 'text-primary' : 'text-zinc-400')}>{WEEKDAYS[i]}</div>
              <div className={cn('text-sm font-semibold', isToday ? 'text-primary' : 'text-zinc-700 dark:text-slate-200')}>{d.getDate()}</div>
            </div>
          );
        })}
        {times.map(t => (
          <div key={t} className="contents">
            <span className="text-[11px] tabular-nums text-zinc-400 flex items-center justify-end pr-1">{t}</span>
            {days.map((d, i) => {
              const slot = cells.get(`${dayKey(d)}|${t}`);
              return slot
                ? <SlotButton key={i} slot={slot} selected={selected === slot.start.toISOString()} onSelect={onSelect} className="h-9" />
                : <span key={i} className="h-9 rounded-lg border border-dashed border-zinc-200/70 dark:border-white/5" aria-hidden="true" />;
            })}
          </div>
        ))}
      </div>
      {times.length === 0 && <p className="text-sm text-zinc-500 text-center py-6">Tuần này không có khung giờ.</p>}
    </div>
  );
}

/** Mobile: a compact month calendar; pick a day, then a time. */
function MonthPicker({ slots, selected, onSelect }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<string, PickerSlot[]>();
    for (const s of slots) map.set(dayKey(s.start), [...(map.get(dayKey(s.start)) ?? []), s]);
    return map;
  }, [slots]);
  const firstFree = slots.find(s => !s.taken)?.start ?? slots[0].start;
  const [month, setMonth] = useState(() => new Date(firstFree.getFullYear(), firstFree.getMonth(), 1));
  const [day, setDay] = useState(() => dayKey(firstFree));

  const lastSlot = slots[slots.length - 1].start;
  const canPrev = month > new Date(slots[0].start.getFullYear(), slots[0].start.getMonth(), 1);
  const canNext = month < new Date(lastSlot.getFullYear(), lastSlot.getMonth(), 1);
  const gridStart = weekStart(month);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = dayKey(new Date());
  const daySlots = byDay.get(day) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} disabled={!canPrev} aria-label="Tháng trước"
          className="p-1.5 rounded-lg text-zinc-500 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-zinc-700 dark:text-slate-200">Tháng {month.getMonth() + 1}, {month.getFullYear()}</span>
        <button type="button" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} disabled={!canNext} aria-label="Tháng sau"
          className="p-1.5 rounded-lg text-zinc-500 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(w => <span key={w} className="text-[10px] font-bold text-zinc-400 py-1">{w}</span>)}
        {cells.map(d => {
          const key = dayKey(d);
          const list = byDay.get(key);
          const free = list?.filter(s => !s.taken).length ?? 0;
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <button key={key} type="button" disabled={!list} onClick={() => setDay(key)}
              className={cn('relative h-10 rounded-lg text-sm transition-colors',
                !inMonth && 'opacity-30',
                key === day ? 'bg-brand text-white font-semibold' : list ? (free ? 'text-primary font-semibold bg-primary/5' : 'text-zinc-400 bg-zinc-100 dark:bg-white/5') : 'text-zinc-300 dark:text-slate-700',
                key === today && key !== day && 'ring-1 ring-primary/40')}>
              {d.getDate()}
              {free > 0 && key !== day && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {daySlots.map(s => <SlotButton key={s.start.toISOString()} slot={s} selected={selected === s.start.toISOString()} onSelect={onSelect} className="h-10" />)}
      </div>
    </div>
  );
}

export default function SlotPicker(props: Props) {
  if (props.slots.length === 0) return null;
  return (
    <>
      <div className="hidden sm:block"><WeekGrid {...props} /></div>
      <div className="sm:hidden"><MonthPicker {...props} /></div>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-primary/30 bg-primary/10" /> Còn trống</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-200 dark:bg-white/10" /> Đã có người đặt</span>
      </div>
    </>
  );
}
