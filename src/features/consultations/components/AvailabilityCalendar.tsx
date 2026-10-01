'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import AvailabilityGrid, { type Block, type GridColumn, type GridSelection } from './AvailabilityGrid';
import SlotDialog, { type SlotDialogResult, type SlotScope } from './SlotDialog';
import { cn } from '@/lib/utils';

/**
 * Availability editor with Day / Week / Month views on real dates.
 * - `weekly` (day 0-6 → blocks) is the default for every week.
 * - `overrides` (date → blocks, empty = day off) replace it for one date.
 * Blocks carry their own session length and meeting link. Edits happen in dialogs and are
 * reported as a full next state via `onChange`.
 */

export type { Block };
export type WeeklyBlocks = Map<number, Block[]>;
export type OverrideBlocks = Record<string, Block[]>;
export type Availability = { weekly: WeeklyBlocks; overrides: OverrideBlocks };
type View = 'day' | 'week' | 'month';
export type ChangeNotice = { message: string; undo?: Availability };

type Props = {
  weekly: WeeklyBlocks;
  overrides: OverrideBlocks;
  /** `notice` replaces the generic "saved" toast, optionally with an undo back to `notice.undo`. */
  onChange: (next: Availability, notice?: ChangeNotice) => void;
  /** Today in the host zone, "YYYY-MM-DD". */
  today: string;
  /** Pending/confirmed bookings as { date: [30-min cells] } in the host zone. */
  bookedCells: Record<string, number[]>;
};

const MONTHS_AHEAD = 4;
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Date keys are plain calendar days; do all arithmetic in UTC so local DST never shifts them.
const toDate = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const toKey = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (k: string, n: number) => { const d = toDate(k); d.setUTCDate(d.getUTCDate() + n); return toKey(d); };
const weekday = (k: string) => toDate(k).getUTCDay();
const mondayOf = (k: string) => addDays(k, -((weekday(k) + 6) % 7));
const monthStart = (k: string) => `${k.slice(0, 7)}-01`;
const addMonths = (k: string, n: number) => { const d = toDate(monthStart(k)); d.setUTCMonth(d.getUTCMonth() + n); return toKey(d); };
const dayNum = (k: string) => Number(k.slice(8));
const short = (m: number) => (m % 60 === 0 ? String(m / 60) : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);

/* ── Block list operations (one day) ───────────────────────── */
const sameOptions = (a: Block, b: Block) => a.durationMin === b.durationMin && a.meetingUrl === b.meetingUrl
  && a.validFrom === b.validFrom && a.validUntil === b.validUntil;
const withoutPeriod = (b: Block): Block => ({ from: b.from, to: b.to, durationMin: b.durationMin, meetingUrl: b.meetingUrl });
const covers = (b: Block, k: string) => (!b.validFrom || k >= b.validFrom) && (!b.validUntil || k <= b.validUntil);
/** Remove [from, to) from every block, splitting blocks that straddle it. */
function subtract(blocks: Block[], from: number, to: number): Block[] {
  return blocks.flatMap(b => {
    if (b.to <= from || b.from >= to) return [b];
    const out: Block[] = [];
    if (b.from < from) out.push({ ...b, to: from });
    if (b.to > to) out.push({ ...b, from: to });
    return out;
  });
}
/** Insert a block (it wins over anything it overlaps) and merge touching blocks with identical options. */
function insert(blocks: Block[], block: Block): Block[] {
  const sorted = [...subtract(blocks, block.from, block.to), block].sort((a, b) => a.from - b.from);
  return sorted.reduce<Block[]>((acc, b) => {
    const last = acc[acc.length - 1];
    if (last && last.to === b.from && sameOptions(last, b)) last.to = b.to; else acc.push({ ...b });
    return acc;
  }, []);
}

type DialogState =
  | { mode: 'create'; cols: string[]; from: number; to: number }
  | { mode: 'quick' }
  | { mode: 'edit'; col: string; block: Block };

export default function AvailabilityCalendar({ weekly, overrides, onChange, today, bookedCells }: Props) {
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(today);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const booked = new Set(Object.keys(bookedCells).filter(k => bookedCells[k].length > 0));
  const limit = addMonths(today, MONTHS_AHEAD);

  const effective = (k: string): Block[] => overrides[k] ?? (weekly.get(weekday(k)) ?? []).filter(b => covers(b, k));
  const isCustom = (k: string) => k in overrides;
  // New blocks start with the options of the most recently listed block, so repeated setup is quick.
  const lastOptions = (() => {
    const any = [...Object.values(overrides).flat(), ...[...weekly.values()].flat()].at(-1);
    return { durationMin: any?.durationMin ?? 30, meetingUrl: any?.meetingUrl ?? '' };
  })();

  /* ── Navigation ───────────────────────────────────────── */
  const step = (dir: -1 | 1) => setAnchor(a => {
    const next = view === 'day' ? addDays(a, dir) : view === 'week' ? addDays(a, 7 * dir) : addMonths(a, dir);
    if (next < (view === 'month' ? monthStart(today) : view === 'week' ? mondayOf(today) : today)) return a;
    return next > limit ? a : next;
  });
  const canPrev = view === 'day' ? anchor > today : view === 'week' ? mondayOf(anchor) > mondayOf(today) : monthStart(anchor) > monthStart(today);
  const canNext = (view === 'month' ? addMonths(anchor, 1) : addDays(anchor, view === 'week' ? 7 : 1)) <= limit;
  const openDay = (k: string) => { if (k >= today) { setAnchor(k); setView('day'); } };

  const title = (() => {
    const d = toDate(anchor);
    if (view === 'month') return `Tháng ${d.getUTCMonth() + 1}, ${d.getUTCFullYear()}`;
    if (view === 'day') return `${WEEKDAY_LONG[weekday(anchor)]}, ${dayNum(anchor)}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
    const mon = mondayOf(anchor), sun = addDays(mon, 6);
    return `${dayNum(mon)}/${Number(mon.slice(5, 7))} – ${dayNum(sun)}/${Number(sun.slice(5, 7))}, ${sun.slice(0, 4)}`;
  })();

  /* ── Editing ──────────────────────────────────────────── */
  /** Apply `edit` to date `k`'s blocks at the given scope (weekly pattern or that date only). */
  const mutate = (state: Availability, k: string, scope: SlotScope, edit: (b: Block[]) => Block[]): Availability => {
    const list = state.weekly.get(weekday(k)) ?? [];
    if (scope === 'weekly' && !(k in state.overrides)) {
      // Only weekly blocks in effect on `k` are edited; blocks repeating in other periods are left alone.
      const next = new Map(state.weekly);
      next.set(weekday(k), [...list.filter(b => !covers(b, k)), ...edit(list.filter(b => covers(b, k)))].sort((a, b) => a.from - b.from));
      return { weekly: next, overrides: state.overrides };
    }
    // A one-off date: start from what's in effect that day, without the weekly repeat period.
    const base = state.overrides[k] ?? list.filter(b => covers(b, k)).map(withoutPeriod);
    return { weekly: state.weekly, overrides: { ...state.overrides, [k]: edit(base) } };
  };

  const confirmDialog = (r: SlotDialogResult) => {
    if (!dialog) return;
    const blocks: Block[] = r.ranges.map(({ from, to }) => ({
      from, to, durationMin: r.durationMin, meetingUrl: r.meetingUrl,
      ...(r.scope === 'weekly' && r.validFrom && { validFrom: r.validFrom }),
      ...(r.scope === 'weekly' && r.validUntil && { validUntil: r.validUntil }),
    }));
    const insertAll = (list: Block[]) => blocks.reduce(insert, list);
    let next: Availability = { weekly, overrides };
    if (dialog.mode === 'quick') {
      const w = new Map(weekly);
      for (const d of r.weekdays ?? []) w.set(d, insertAll(w.get(d) ?? []));
      next = { weekly: w, overrides };
    } else if (dialog.mode === 'create') {
      for (const k of dialog.cols) next = mutate(next, k, r.scope, insertAll);
    } else {
      next = mutate(next, dialog.col, r.scope, b => insertAll(subtract(b, dialog.block.from, dialog.block.to)));
    }
    onChange(next);
    setDialog(null);
  };
  const deleteBlock = (scope: SlotScope) => {
    if (dialog?.mode !== 'edit') return;
    onChange(mutate({ weekly, overrides }, dialog.col, scope, b => subtract(b, dialog.block.from, dialog.block.to)));
    setDialog(null);
  };
  const setDayOff = (k: string) => onChange({ weekly, overrides: { ...overrides, [k]: [] } });
  const resetDay = (k: string) => { const next = { ...overrides }; delete next[k]; onChange({ weekly, overrides: next }); };

  const highlighted: GridSelection | null = dialog?.mode === 'create' ? { cols: dialog.cols, from: dialog.from, to: dialog.to } : null;
  const dayLabel = (k: string) => `${WEEKDAY_SHORT[weekday(k)]} ${dayNum(k)}/${Number(k.slice(5, 7))}`;
  const column = (k: string, label: string, sublabel?: string): GridColumn => ({
    key: k, label, sublabel, blocks: effective(k), disabled: k < today, today: k === today, custom: isCustom(k),
    booked: new Set(bookedCells[k] ?? []),
  });
  const gridProps = {
    onSelect: (sel: GridSelection) => setDialog({ mode: 'create', cols: sel.cols, from: sel.from, to: sel.to }),
    onBlockClick: (col: string, block: Block) => setDialog({ mode: 'edit', col, block }),
    // Unbooked blocks can be removed in one click (weekly blocks for every week, custom ones for that date), with undo.
    onBlockDelete: (col: string, block: Block) => {
      const prev: Availability = { weekly, overrides };
      const when = `${short(block.from)}–${short(block.to)}`;
      onChange(mutate(prev, col, isCustom(col) ? 'date' : 'weekly', b => subtract(b, block.from, block.to)), {
        message: isCustom(col) ? `Đã xóa ${when} ngày ${dayLabel(col)}` : `Đã xóa ${when} mọi ${WEEKDAY_LONG[weekday(col)]}`,
        undo: prev,
      });
    },
    selection: highlighted,
  };

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAnchor(today)} className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 hover:bg-zinc-50 dark:hover:bg-white/5">Hôm nay</button>
          <button type="button" onClick={() => step(-1)} disabled={!canPrev} aria-label="Trước"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={() => step(1)} disabled={!canNext} aria-label="Sau"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight className="w-4 h-4" /></button>
          <span className="ml-1 text-sm font-semibold text-zinc-800 dark:text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDialog({ mode: 'quick' })}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tạo lịch
          </button>
          <div role="tablist" aria-label="Kiểu xem" className="inline-flex p-0.5 rounded-xl bg-zinc-100 dark:bg-white/5">
            {([['day', 'Ngày'], ['week', 'Tuần'], ['month', 'Tháng']] as const).map(([v, label]) => (
              <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  view === v ? 'bg-surface dark:bg-[#2b2924] text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view !== 'month' && (
        <p className="mb-3 text-xs text-zinc-500">Kéo trên lịch để chọn giờ rảnh · bấm vào khung giờ để sửa hoặc xóa · hoặc dùng <strong>Tạo lịch</strong> để tạo nhanh.</p>
      )}

      {view === 'week' && (
        <AvailabilityGrid
          columns={Array.from({ length: 7 }, (_, i) => { const k = addDays(mondayOf(anchor), i); return column(k, WEEKDAY_SHORT[weekday(k)], String(dayNum(k))); })}
          onHeaderClick={openDay}
          {...gridProps}
        />
      )}

      {view === 'day' && (
        <div className="grid md:grid-cols-[1fr_240px] gap-6">
          <AvailabilityGrid columns={[column(anchor, WEEKDAY_LONG[weekday(anchor)], `${dayNum(anchor)}/${Number(anchor.slice(5, 7))}`)]} {...gridProps} />
          <div className="space-y-3 text-xs">
            <p className={cn('rounded-xl px-3 py-2.5 leading-relaxed', isCustom(anchor) ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-primary/5 text-zinc-600 dark:text-slate-300')}>
              {isCustom(anchor)
                ? (overrides[anchor].length === 0 ? 'Ngày này đang nghỉ.' : 'Ngày này đã được chỉnh riêng, khác lịch hằng tuần.')
                : `Đang theo lịch hằng tuần của ${WEEKDAY_LONG[weekday(anchor)]}.`}
            </p>
            {booked.has(anchor) && <p className="rounded-xl px-3 py-2.5 bg-primary/5 text-primary">Ngày này đã có lịch hẹn. Thay đổi giờ không hủy lịch đã đặt.</p>}
            {anchor >= today && (
              <div className="flex flex-col gap-2">
                {!(isCustom(anchor) && overrides[anchor].length === 0) && (
                  <button type="button" onClick={() => setDayOff(anchor)} className="ui-button ui-button-secondary !py-2 !text-xs justify-center">Nghỉ cả ngày</button>
                )}
                {isCustom(anchor) && (
                  <button type="button" onClick={() => resetDay(anchor)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5">
                    <RotateCcw className="w-3.5 h-3.5" /> Về lịch hằng tuần
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'month' && (() => {
        const first = monthStart(anchor);
        const gridStart = mondayOf(first);
        const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
        const month = first.slice(0, 7);
        return (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {[1, 2, 3, 4, 5, 6, 0].map(d => <span key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 py-1">{WEEKDAY_SHORT[d]}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map(k => {
                const past = k < today;
                const blocks = effective(k);
                const custom = isCustom(k);
                return (
                  <button key={k} type="button" onClick={() => openDay(k)} disabled={past || k > limit}
                    className={cn('relative min-h-[5rem] sm:min-h-[6.5rem] rounded-xl border p-1.5 text-left transition-colors flex flex-col',
                      !k.startsWith(month) && 'opacity-40',
                      past ? 'bg-zinc-50 dark:bg-white/[0.02] border-transparent opacity-50' : 'border-zinc-200 dark:border-white/10 hover:border-primary/50',
                      k === today && 'ring-1 ring-primary/50')}>
                    <span className="flex items-center justify-between">
                      <span className={cn('text-xs font-semibold', k === today ? 'text-primary' : 'text-zinc-700 dark:text-slate-200')}>{dayNum(k)}</span>
                      {booked.has(k) && <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Có lịch hẹn" />}
                    </span>
                    <span className="mt-1 space-y-0.5">
                      {custom && blocks.length === 0 ? (
                        <span className="block text-[10px] font-semibold text-zinc-400 line-through">Nghỉ</span>
                      ) : (
                        <>
                          {blocks.slice(0, 2).map(b => (
                            <span key={b.from} className={cn('block text-[10px] font-semibold rounded px-1 truncate',
                              custom ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-primary/10 text-primary')}>
                              {short(b.from)}–{short(b.to)} <span className="font-normal opacity-70">· {b.durationMin}′</span>
                            </span>
                          ))}
                          {blocks.length > 2 && <span className="block text-[10px] text-zinc-400">+{blocks.length - 2}</span>}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-zinc-500">Bấm vào một ngày để chỉnh giờ hoặc cho nghỉ ngày đó.</p>
          </div>
        );
      })()}

      {dialog && (
        <SlotDialog
          key={dialog.mode === 'create' ? `c-${dialog.cols.join()}-${dialog.from}` : dialog.mode === 'edit' ? `e-${dialog.col}-${dialog.block.from}` : 'quick'}
          mode={dialog.mode}
          days={(dialog.mode === 'create' ? dialog.cols : dialog.mode === 'edit' ? [dialog.col] : []).map(k => ({ key: k, weekday: weekday(k), label: dayLabel(k) }))}
          from={dialog.mode === 'create' ? dialog.from : dialog.mode === 'edit' ? dialog.block.from : 19 * 60}
          to={dialog.mode === 'create' ? dialog.to : dialog.mode === 'edit' ? dialog.block.to : 21 * 60}
          durationMin={dialog.mode === 'edit' ? dialog.block.durationMin : lastOptions.durationMin}
          meetingUrl={dialog.mode === 'edit' ? dialog.block.meetingUrl : lastOptions.meetingUrl}
          today={today}
          startDate={dialog.mode === 'create' ? [...dialog.cols].sort()[0] : dialog.mode === 'edit' ? (dialog.block.validFrom ?? today) : today}
          validUntil={dialog.mode === 'edit' ? dialog.block.validUntil : undefined}
          isCustom={dialog.mode === 'edit' ? isCustom(dialog.col) : dialog.mode === 'create' ? dialog.cols.every(isCustom) : false}
          bookedInRange={dialog.mode === 'quick' ? false : (dialog.mode === 'create' ? dialog.cols : [dialog.col]).some(k => {
            const [f, t] = dialog.mode === 'create' ? [dialog.from, dialog.to] : [dialog.block.from, dialog.block.to];
            return (bookedCells[k] ?? []).some(m => m >= f && m < t);
          })}
          onConfirm={confirmDialog}
          onDelete={dialog.mode === 'edit' ? deleteBlock : undefined}
          onClose={() => setDialog(null)}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/[0.14] border-l-[3px] border-l-primary" /> Lịch hằng tuần</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border-l-[3px] border-l-amber-500" /> Chỉ ngày đó</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/35 border border-dashed border-primary/60" /> Đã có người đặt</span>
      </div>
    </div>
  );
}
