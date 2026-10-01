'use client';

import { useRef, useState } from 'react';
import { Video, X } from 'lucide-react';
import { CELL_MINUTES, DEFAULT_RANGE, minutesToHHMM } from '../lib/availability-grid';
import { cn } from '@/lib/utils';

/** An availability window inside one day, with its own session options. Minutes are minute-of-day. */
export type Block = {
  from: number; to: number; durationMin: number; meetingUrl: string;
  /** Repeat period for weekly blocks ("YYYY-MM-DD", inclusive); unset = open-ended. */
  validFrom?: string; validUntil?: string;
};

export type GridColumn = {
  key: string;
  label: string;
  sublabel?: string;
  blocks: Block[];
  disabled?: boolean;
  /** Visual hints: today's column, or a date edited separately from the weekly pattern. */
  today?: boolean;
  custom?: boolean;
  /** 30-min cells that already have a pending/confirmed booking. */
  booked?: Set<number>;
};

export type GridSelection = { cols: string[]; from: number; to: number };

type Props = {
  columns: GridColumn[];
  /** Drag (or tap) over empty cells → a selected range, to be confirmed in a dialog. */
  onSelect: (selection: GridSelection) => void;
  /** Tap on an existing block. */
  onBlockClick: (col: string, block: Block) => void;
  /** Quick delete straight from the calendar; only offered on blocks without bookings. */
  onBlockDelete?: (col: string, block: Block) => void;
  onHeaderClick?: (key: string) => void;
  /** A range to keep highlighted (e.g. while its dialog is open). */
  selection?: GridSelection | null;
};

const CELL_PX = 28;
const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const blockAt = (c: GridColumn, m: number) => c.blocks.find(b => m >= b.from && m < b.to);
const hasBookingIn = (c: GridColumn, b: Block) => [...(c.booked ?? [])].some(m => m >= b.from && m < b.to);

function visibleRange(columns: GridColumn[]) {
  let { from, to } = DEFAULT_RANGE;
  for (const c of columns) for (const b of c.blocks) {
    from = Math.min(from, Math.floor(b.from / 60) * 60);
    to = Math.max(to, Math.ceil(b.to / 60) * 60);
  }
  return { from, to: Math.min(to, 24 * 60) };
}

/**
 * Calendar-style time grid: drag across empty cells to select a range (across several days if you
 * like), tap a block to edit it. Mouse and touch via pointer events + elementFromPoint.
 */
export default function AvailabilityGrid({ columns, onSelect, onBlockClick, onBlockDelete, onHeaderClick, selection = null }: Props) {
  type Hit = { col: string; minute: number };
  const gesture = useRef<{ anchor: Hit; current: Hit; block: Block | null; moved: boolean } | null>(null);
  const [dragPreview, setPreview] = useState<GridSelection | null>(null);
  const preview = dragPreview ?? selection;
  const { from, to } = visibleRange(columns);
  const rows: number[] = [];
  for (let m = from; m < to; m += CELL_MINUTES) rows.push(m);
  const byKey = new Map(columns.map(c => [c.key, c]));
  const order = columns.map(c => c.key);

  const parse = (el: Element | null): Hit | null => {
    const raw = (el as HTMLElement | null)?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
    if (!raw) return null;
    const i = raw.lastIndexOf('|');
    return { col: raw.slice(0, i), minute: Number(raw.slice(i + 1)) };
  };
  const selectionOf = (a: Hit, b: Hit): GridSelection => {
    const [i, j] = [order.indexOf(a.col), order.indexOf(b.col)].sort((x, y) => x - y);
    const cols = order.slice(i, j + 1).filter(k => !byKey.get(k)?.disabled);
    return { cols, from: Math.min(a.minute, b.minute), to: Math.max(a.minute, b.minute) + CELL_MINUTES };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('[data-quick-delete]')) return; // the × button handles its own click
    const hit = parse(e.target as Element);
    const col = hit && byKey.get(hit.col);
    if (!hit || !col || col.disabled) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const block = blockAt(col, hit.minute) ?? null;
    gesture.current = { anchor: hit, current: hit, block, moved: false };
    if (!block) setPreview(selectionOf(hit, hit));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const hit = parse(document.elementFromPoint(e.clientX, e.clientY));
    if (!hit || (hit.col === g.current.col && hit.minute === g.current.minute)) return;
    g.current = hit;
    g.moved = true;
    if (!g.block) setPreview(selectionOf(g.anchor, hit));
  };
  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.block) {
      if (!g.moved) onBlockClick(g.anchor.col, g.block);
      return;
    }
    const sel = selectionOf(g.anchor, g.current);
    setPreview(null);
    if (sel.cols.length) onSelect(sel);
  };
  const onPointerCancel = () => { gesture.current = null; setPreview(null); };
  const inPreview = (col: string, m: number) => !!preview && preview.cols.includes(col) && m >= preview.from && m < preview.to;

  const template = { gridTemplateColumns: `2.75rem repeat(${columns.length}, minmax(0, 1fr))` };
  const hatch = { backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(120,113,108,0.08) 6px 7px)' };
  const bookedRun = (c: GridColumn, m: number) => { let n = 1; while (c.booked?.has(m + n * CELL_MINUTES)) n++; return n; };

  return (
    <div className="select-none">
      <div className="grid" style={template}>
        <span />
        {columns.map(c => (
          <button key={c.key} type="button" onClick={() => onHeaderClick?.(c.key)} disabled={!onHeaderClick}
            className={cn('pb-2 pt-1 text-center rounded-t-xl transition-colors', onHeaderClick && 'hover:bg-primary/5', c.today && 'bg-primary/[0.06]', c.disabled && 'opacity-40')}>
            <span className={cn('block text-[10px] font-bold uppercase tracking-wider', c.today ? 'text-primary' : 'text-zinc-500')}>{c.label}</span>
            {c.sublabel && (
              <span className={cn('mx-auto mt-0.5 flex items-center justify-center text-sm font-semibold',
                c.today ? 'w-fit min-w-7 h-7 px-1.5 rounded-full bg-brand text-white' : 'text-zinc-700 dark:text-slate-200')}>{c.sublabel}</span>
            )}
            {c.custom && (
              <span className={cn('block text-[9px] font-semibold leading-none mt-1', c.blocks.length === 0 ? 'text-zinc-400' : 'text-amber-600 dark:text-amber-400')}>
                {c.blocks.length === 0 ? 'nghỉ' : 'riêng'}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="grid touch-none rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.015] overflow-hidden" style={template}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
        role="grid" aria-label="Khung giờ rảnh">
        {rows.map(m => (
          <div key={m} className="contents" role="row">
            <span className={cn('relative text-[10px] tabular-nums text-zinc-400 text-right pr-2 bg-zinc-50/60 dark:bg-white/[0.02]', m % 60 === 0 && m !== from && 'border-t border-zinc-200 dark:border-white/10')}>
              {m % 60 === 0 && m !== from && <span className="absolute right-2 -top-[7px] bg-zinc-50 dark:bg-[#22211e] px-0.5">{minutesToHHMM(m)}</span>}
              {m === from && <span className="absolute right-2 top-0.5">{minutesToHHMM(m)}</span>}
            </span>
            {columns.map(c => {
              const block = blockAt(c, m);
              const startsHere = !!block && block.from === m;
              const endsHere = !!block && block.to === m + CELL_MINUTES;
              const isBooked = !!c.booked?.has(m);
              const bookedStart = isBooked && !c.booked!.has(m - CELL_MINUTES);
              const lineTop = m === from ? '' : m % 60 === 0 ? 'border-t border-t-zinc-200 dark:border-t-white/10' : 'border-t border-dashed border-t-zinc-100 dark:border-t-white/[0.05]';
              const sessions = block ? Math.floor((block.to - block.from) / block.durationMin) : 0;
              return (
                <div key={c.key} data-cell={`${c.key}|${m}`} role="gridcell" aria-selected={!!block}
                  aria-label={`${c.label} ${c.sublabel ?? ''} ${minutesToHHMM(m)}${isBooked ? ' (đã có người đặt)' : ''}`}
                  title={isBooked ? 'Đã có người đặt' : undefined}
                  style={c.disabled ? hatch : undefined}
                  className={cn('group relative h-7 border-l border-l-zinc-100 dark:border-l-white/[0.06]', !(block && !startsHere) && lineTop,
                    c.today && !block && 'bg-primary/[0.03]', c.disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
                  {block ? (
                    <span className={cn('absolute inset-x-1 transition-[filter]', startsHere ? 'top-0.5' : 'top-0', endsHere ? 'bottom-0.5' : 'bottom-0',
                      c.custom ? 'bg-amber-100 border-l-[3px] border-l-amber-500 dark:bg-amber-500/20' : 'bg-primary/[0.14] border-l-[3px] border-l-primary dark:bg-primary/25',
                      startsHere && 'rounded-t-lg', endsHere && 'rounded-b-lg', !c.disabled && 'group-hover:brightness-95', c.disabled && 'opacity-45', isBooked && !c.disabled && 'opacity-55')} />
                  ) : isBooked ? (
                    <span className={cn('pointer-events-none absolute inset-x-1 inset-y-0 bg-primary/15 border-x border-dashed border-primary/50', bookedStart && 'border-t rounded-t-md')} />
                  ) : inPreview(c.key, m) ? (
                    <span className={cn('pointer-events-none absolute inset-x-1 bg-primary/20 border-x-2 border-primary/60',
                      m === preview!.from ? 'top-0.5 rounded-t-lg border-t-2' : 'top-0', m + CELL_MINUTES === preview!.to ? 'bottom-0.5 rounded-b-lg border-b-2' : 'bottom-0')} />
                  ) : !c.disabled && !preview && (
                    <span className="pointer-events-none absolute inset-x-1 inset-y-0.5 rounded-md border border-dashed border-primary/40 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-1.5 text-[10px] font-medium text-primary">
                      + {minutesToHHMM(m)}
                    </span>
                  )}

                  {/* Block label: spans the block and centers vertically, so short and long blocks look balanced. */}
                  {startsHere && (
                    <span style={{ height: ((block.to - block.from) / CELL_MINUTES) * CELL_PX - 4 }}
                      className={cn('pointer-events-none absolute left-[11px] right-1.5 top-0.5 z-10 flex flex-col justify-center overflow-hidden whitespace-nowrap leading-tight',
                        c.custom ? 'text-amber-800 dark:text-amber-200' : 'text-primary', c.disabled && 'opacity-60')}>
                      <span className="text-[10px] font-semibold tabular-nums">{hm(block.from)}–{hm(block.to)}</span>
                      {block.to - block.from >= 60 && (
                        <span className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                          {sessions} × {block.durationMin}′ {block.meetingUrl && <Video className="w-2.5 h-2.5" aria-label="Có link họp" />}
                          {block.validUntil && <span>· đến {Number(block.validUntil.slice(8))}/{Number(block.validUntil.slice(5, 7))}</span>}
                        </span>
                      )}
                    </span>
                  )}
                  {startsHere && onBlockDelete && !c.disabled && !hasBookingIn(c, block) && (
                    <button type="button" data-quick-delete aria-label={`Xóa khung ${hm(block.from)}–${hm(block.to)}`} title="Xóa khung giờ này"
                      onClick={e => { e.stopPropagation(); onBlockDelete(c.key, block); }}
                      className={cn('absolute right-1.5 top-1 z-30 w-5 h-5 inline-flex items-center justify-center rounded-md transition-colors',
                        c.custom ? 'text-amber-700/70 hover:text-white hover:bg-amber-600' : 'text-primary/60 hover:text-white hover:bg-primary')}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {bookedStart && (
                    <span style={{ height: bookedRun(c, m) * CELL_PX - 4 }} className="pointer-events-none absolute right-2 top-0.5 z-20 flex items-center">
                      <span className="rounded px-1 text-[9px] font-bold uppercase tracking-wide leading-4 bg-white text-primary dark:bg-[#2b2924] shadow-sm ring-1 ring-primary/15">Đã đặt</span>
                    </span>
                  )}
                  {preview && m === preview.from && c.key === preview.cols[0] && (
                    <span className="pointer-events-none absolute left-2 -top-5 z-30 rounded-md bg-zinc-900 text-white text-[10px] font-semibold px-1.5 py-0.5 shadow whitespace-nowrap">
                      {hm(preview.from)}–{hm(preview.to)}{preview.cols.length > 1 ? ` · ${preview.cols.length} ngày` : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
