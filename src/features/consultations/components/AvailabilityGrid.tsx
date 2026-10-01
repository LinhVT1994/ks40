'use client';

import { useRef } from 'react';
import { CELL_MINUTES, cellKey, gridRange, minutesToHHMM } from '../lib/availability-grid';
import { cn } from '@/lib/utils';

// Columns Mon→Sun; values are JS weekdays (0 = Sun).
const COLUMNS = [1, 2, 3, 4, 5, 6, 0];
const LABELS: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' };

type Props = {
  cells: Set<string>;
  onChange: (cells: Set<string>) => void;
};

/**
 * Paint weekly availability: press on a cell and drag to fill (or clear, if you started on a filled cell).
 * Works with mouse and touch via pointer events + elementFromPoint.
 */
export default function AvailabilityGrid({ cells, onChange }: Props) {
  const drag = useRef<{ mode: 'add' | 'remove'; next: Set<string> } | null>(null);
  const { from, to } = gridRange(cells);
  const rows: number[] = [];
  for (let m = from; m < to; m += CELL_MINUTES) rows.push(m);

  const keyAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-cell]')?.dataset.cell;

  const apply = (key: string | undefined) => {
    if (!key || !drag.current) return;
    const { mode, next } = drag.current;
    if (mode === 'add' ? next.has(key) : !next.has(key)) return;
    if (mode === 'add') next.add(key); else next.delete(key);
    onChange(new Set(next));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]')?.dataset.cell;
    if (!key) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode: cells.has(key) ? 'remove' : 'add', next: new Set(cells) };
    apply(key);
  };
  const onPointerMove = (e: React.PointerEvent) => { if (drag.current) apply(keyAt(e.clientX, e.clientY)); };
  const end = () => { drag.current = null; };

  const toggleDay = (day: number) => {
    const dayKeys = rows.map(m => cellKey(day, m));
    const allOn = dayKeys.every(k => cells.has(k));
    const next = new Set(cells);
    dayKeys.forEach(k => (allOn ? next.delete(k) : next.add(k)));
    onChange(next);
  };

  return (
    <div className="select-none">
      <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-x-1">
        <span />
        {COLUMNS.map(day => (
          <button key={day} type="button" onClick={() => toggleDay(day)} title="Bấm để chọn/bỏ cả ngày"
            className="pb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-primary transition-colors">
            {LABELS[day]}
          </button>
        ))}
      </div>
      <div
        className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-x-1 touch-none"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}
        role="grid" aria-label="Khung giờ rảnh hằng tuần"
      >
        {rows.map(m => (
          <div key={m} className="contents" role="row">
            <span className={cn('text-[10px] tabular-nums text-zinc-400 text-right pr-1.5 -translate-y-1.5', m % 60 !== 0 && 'invisible')}>{minutesToHHMM(m)}</span>
            {COLUMNS.map(day => {
              const key = cellKey(day, m);
              const on = cells.has(key);
              const above = cells.has(cellKey(day, m - CELL_MINUTES));
              const below = cells.has(cellKey(day, m + CELL_MINUTES));
              return (
                <div key={key} data-cell={key} role="gridcell" aria-selected={on} aria-label={`${LABELS[day]} ${minutesToHHMM(m)}`}
                  className={cn('h-5 cursor-pointer transition-colors border-x border-t',
                    on && above
                      ? 'border-t-transparent' // painted blocks read as one continuous window
                      : m % 60 === 0 ? 'border-t-zinc-200 dark:border-t-white/10' : 'border-t-zinc-100 dark:border-t-white/[0.04]',
                    on
                      ? cn('bg-primary/80 border-x-primary/80 hover:bg-primary', !above && 'rounded-t-md', !below && 'rounded-b-md')
                      : 'bg-zinc-50 dark:bg-white/[0.02] border-x-transparent hover:bg-primary/15')} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
