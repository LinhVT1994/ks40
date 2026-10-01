'use client';

import { useState } from 'react';
import { CalendarClock, CalendarRange, Clock, Link2, Plus, Repeat, Sparkles, Trash2, X } from 'lucide-react';
import { CELL_MINUTES, PRESETS } from '../lib/availability-grid';
import { DURATION_OPTIONS, isMeetingUrl, toMinutes } from '../lib/slots';
import { ChipGroup, Dialog, FieldLabel, GhostButton, PrimaryButton, Segmented, Select, fieldClass } from './dialog-ui';
import { cn } from '@/lib/utils';

export type SlotDialogDay = { key: string; weekday: number; label: string };
export type SlotScope = 'weekly' | 'date';
export type TimeRange = { from: number; to: number };
export type SlotDialogResult = {
  ranges: TimeRange[]; scope: SlotScope; durationMin: number; meetingUrl: string; weekdays?: number[];
  /** Repeat period for weekly blocks ("YYYY-MM-DD", inclusive); unset = open-ended. */
  validFrom?: string; validUntil?: string;
};

type Props = {
  /** create: from a calendar selection · quick: "+ Tạo lịch" with no selection · edit: an existing block. */
  mode: 'create' | 'quick' | 'edit';
  days: SlotDialogDay[];
  from: number;
  to: number;
  durationMin: number;
  meetingUrl: string;
  /** Whether the selected/edited days are one-off date overrides. */
  isCustom?: boolean;
  bookedInRange?: boolean;
  /** Today and the first day the repeat starts ("YYYY-MM-DD", host zone). */
  today: string;
  startDate: string;
  /** Existing repeat end when editing. */
  validUntil?: string;
  onConfirm: (v: SlotDialogResult) => void;
  onDelete?: (scope: SlotScope) => void;
  onClose: () => void;
};

const WEEKDAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const TIMES = Array.from({ length: 24 * 60 / CELL_MINUTES + 1 }, (_, i) => i * CELL_MINUTES);

// Repeat periods, counted from the start date (inclusive).
const PERIODS = [
  { id: 'forever', label: 'Không giới hạn' },
  { id: '1w', label: '1 tuần', days: 7 },
  { id: '2w', label: '2 tuần', days: 14 },
  { id: '1m', label: '1 tháng', months: 1 },
  { id: '2m', label: '2 tháng', months: 2 },
  { id: '3m', label: '3 tháng', months: 3 },
  { id: 'custom', label: 'Đến ngày…' },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];
const keyToDate = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const dateToKey = (d: Date) => d.toISOString().slice(0, 10);
const fmtDate = (k: string) => { const d = keyToDate(k); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`; };
function periodEnd(start: string, id: PeriodId): string | undefined {
  const p = PERIODS.find(x => x.id === id)!;
  const d = keyToDate(start);
  if ('days' in p) d.setUTCDate(d.getUTCDate() + p.days - 1);
  else if ('months' in p) { d.setUTCMonth(d.getUTCMonth() + p.months); d.setUTCDate(d.getUTCDate() - 1); }
  else return undefined;
  return dateToKey(d);
}

/** Google-Calendar-like dialog to create (from a selection or quickly) or edit an availability block. */
export default function SlotDialog({ mode, days, from: f0, to: t0, durationMin: d0, meetingUrl: l0, isCustom, bookedInRange, today, startDate, validUntil, onConfirm, onDelete, onClose }: Props) {
  const [ranges, setRanges] = useState<TimeRange[]>([{ from: f0, to: t0 }]);
  const [durationMin, setDuration] = useState(d0);
  const [meetingUrl, setLink] = useState(l0);
  const [scope, setScope] = useState<SlotScope>(isCustom ? 'date' : 'weekly');
  const [weekdays, setWeekdays] = useState<number[]>(mode === 'quick' ? [1, 2, 3, 4, 5] : []);
  const [period, setPeriod] = useState<PeriodId>(validUntil ? 'custom' : 'forever');
  const [customUntil, setCustomUntil] = useState(validUntil ?? periodEnd(startDate, '1m')!);
  const repeatStart = startDate < today ? today : startDate;
  const until = period === 'custom' ? customUntil : periodEnd(repeatStart, period);
  const repeats = mode === 'quick' || (!isCustom && scope === 'weekly');

  const applyPreset = (id: string) => {
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    setWeekdays([...new Set(p.windows.map(w => w.day))]);
    setRanges([{ from: toMinutes(p.windows[0].start), to: toMinutes(p.windows[0].end) }]);
  };
  const setRange = (i: number, patch: Partial<TimeRange>) => setRanges(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  // Suggest the next range right after the last one (same length, clamped to the day).
  const addRange = () => setRanges(rs => {
    const last = rs[rs.length - 1];
    const len = Math.max(60, last.to - last.from);
    const from = Math.min(last.to + 60, 24 * 60 - CELL_MINUTES);
    return [...rs, { from, to: Math.min(from + len, 24 * 60) }];
  });

  const linkOk = !meetingUrl.trim() || isMeetingUrl(meetingUrl.trim());
  const rangeError = (() => {
    if (ranges.some(r => r.to <= r.from)) return 'Giờ kết thúc phải sau giờ bắt đầu.';
    const sorted = [...ranges].sort((a, b) => a.from - b.from);
    if (sorted.some((r, i) => i > 0 && r.from < sorted[i - 1].to)) return 'Các khoảng thời gian bị chồng nhau.';
    if (ranges.some(r => r.to - r.from < durationMin)) return `Có khoảng ngắn hơn một buổi ${durationMin} phút.`;
    return null;
  })();
  const sessions = ranges.reduce((n, r) => n + (r.to > r.from ? Math.floor((r.to - r.from) / durationMin) : 0), 0);
  const periodError = repeats && until && until < repeatStart ? 'Ngày kết thúc phải sau ngày bắt đầu.' : null;
  const valid = !rangeError && !periodError && sessions > 0 && linkOk && (mode !== 'quick' || weekdays.length > 0);
  const single = days.length === 1;
  const weekdayNames = [...new Set(days.map(d => WEEKDAY_LONG[d.weekday]))].join(', ');

  const confirm = () => onConfirm({
    ranges: [...ranges].sort((a, b) => a.from - b.from), scope: mode === 'quick' ? 'weekly' : scope, durationMin, meetingUrl: meetingUrl.trim(),
    ...(mode === 'quick' && { weekdays }),
    ...(repeats && until && { validFrom: repeatStart, validUntil: until }),
  });

  return (
    <Dialog titleId="slot-title" title={mode === 'edit' ? 'Sửa giờ rảnh' : 'Thêm giờ rảnh'} icon={<CalendarClock />} onClose={onClose}
      footer={<>
        {mode === 'edit' && onDelete ? (
          <GhostButton onClick={() => onDelete(scope)} className="!text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-500/10 -ml-2"><Trash2 className="w-3.5 h-3.5" /> Xóa</GhostButton>
        ) : <span />}
        <div className="flex items-center gap-1.5">
          <GhostButton onClick={onClose}>Hủy</GhostButton>
          <PrimaryButton disabled={!valid} onClick={confirm}>Lưu</PrimaryButton>
        </div>
      </>}>

      {mode === 'quick' ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 inline-flex items-center gap-1 text-[11px] text-zinc-500"><Sparkles className="w-3 h-3" /> Mẫu</span>
            {PRESETS.map(p => (
              <button key={p.id} type="button" onClick={() => applyPreset(p.id)}
                className="h-7 px-2.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors">{p.label.split(' · ')[0]}</button>
            ))}
          </div>
          <div>
            <FieldLabel icon={<Repeat />}>Lặp lại hằng tuần vào</FieldLabel>
            <ChipGroup ariaLabel="Ngày trong tuần"
              options={[1, 2, 3, 4, 5, 6, 0].map(d => ({ value: d, label: WEEKDAY_SHORT[d] }))}
              isActive={d => weekdays.includes(d)}
              onToggle={d => setWeekdays(w => (w.includes(d) ? w.filter(x => x !== d) : [...w, d]))} />
          </div>
        </>
      ) : (
        <p className="text-sm font-medium text-zinc-700 dark:text-slate-200">{days.map(d => d.label).join(', ')}</p>
      )}

      <div>
        <FieldLabel icon={<Clock />}>Thời gian</FieldLabel>
        <div className="space-y-2">
          {ranges.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select aria-label={i === 0 ? 'Từ' : `Từ (khoảng ${i + 1})`} value={r.from} onChange={e => setRange(i, { from: Number(e.target.value) })} className="flex-1">
                {TIMES.slice(0, -1).map(t => <option key={t} value={t}>{hm(t)}</option>)}
              </Select>
              <span className="text-zinc-400 text-sm">–</span>
              <Select aria-label={i === 0 ? 'Đến' : `Đến (khoảng ${i + 1})`} value={r.to} onChange={e => setRange(i, { to: Number(e.target.value) })} className="flex-1">
                {TIMES.slice(1).map(t => <option key={t} value={t}>{hm(t)}</option>)}
              </Select>
              {ranges.length > 1 ? (
                <button type="button" onClick={() => setRanges(rs => rs.filter((_, j) => j !== i))} aria-label={`Xóa khoảng ${i + 1}`}
                  className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-4 h-4" /></button>
              ) : mode !== 'edit' && <span className="shrink-0 w-8" />}
            </div>
          ))}
        </div>
        {mode !== 'edit' && ranges.length < 6 && (
          <button type="button" onClick={addRange} className="mt-2 inline-flex items-center gap-1 h-7 px-1.5 -ml-1.5 rounded-md text-xs font-semibold text-primary hover:bg-primary/5">
            <Plus className="w-3.5 h-3.5" /> Thêm khoảng thời gian
          </button>
        )}
        {rangeError && <p className="mt-1 text-[11px] text-rose-600">{rangeError}</p>}
      </div>

      <div>
        <FieldLabel>Mỗi buổi</FieldLabel>
        <Segmented ariaLabel="Thời lượng mỗi buổi"
          options={DURATION_OPTIONS.map(d => ({ value: d, label: `${d} phút` }))}
          isActive={d => d === durationMin} onToggle={setDuration} />
        {!rangeError && (
          <p className="mt-1 text-[11px] text-zinc-500"><strong className="text-primary">{sessions}</strong> buổi {durationMin} phút mỗi ngày</p>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="slot-link" hint="(không bắt buộc)">Link họp</FieldLabel>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input id="slot-link" type="url" inputMode="url" value={meetingUrl} onChange={e => setLink(e.target.value)}
            placeholder="https://meet.google.com/…" className={cn(fieldClass, 'pl-9', !linkOk && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15')} />
        </div>
        <p className={cn('mt-1 text-[11px]', linkOk ? 'text-zinc-500' : 'text-rose-600')}>
          {linkOk ? 'Để trống thì bạn nhập link khi chấp nhận lịch.' : 'Link phải bắt đầu bằng https://'}
        </p>
      </div>

      {mode !== 'quick' && !isCustom && (
        <div>
          <FieldLabel icon={<Repeat />}>Áp dụng cho</FieldLabel>
          <div className="grid gap-1.5">
            {([
              ['weekly', `Mọi ${weekdayNames} hằng tuần`],
              ['date', single ? `Chỉ ngày ${days[0].label}` : `Chỉ ${days.length} ngày đã chọn`],
            ] as const).map(([value, label]) => (
              <label key={value} className={cn('flex h-10 items-center gap-2.5 rounded-lg border px-3 cursor-pointer text-sm transition-colors',
                scope === value ? 'border-primary bg-primary/5 text-zinc-800 dark:text-white' : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-slate-300 hover:border-primary/40')}>
                <input type="radio" name="slot-scope" value={value} checked={scope === value} onChange={() => setScope(value)} className="accent-[var(--color-brand)]" />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
      {repeats && (
        <div>
          <FieldLabel icon={<CalendarRange />}>Lặp lại trong</FieldLabel>
          <div className="flex items-center gap-2">
            <Select aria-label="Lặp lại trong" value={period} onChange={e => setPeriod(e.target.value as PeriodId)} className="flex-1">
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
            {period === 'custom' && (
              <input type="date" aria-label="Lặp lại đến ngày" value={customUntil} min={repeatStart} onChange={e => setCustomUntil(e.target.value)}
                className={cn(fieldClass, 'flex-1 tabular-nums')} />
            )}
          </div>
          <p className={cn('mt-1 text-[11px]', periodError ? 'text-rose-600' : 'text-zinc-500')}>
            {periodError ?? (until ? `Từ ${fmtDate(repeatStart)} đến hết ${fmtDate(until)}.` : `Lặp lại hằng tuần từ ${fmtDate(repeatStart)}, không có ngày kết thúc.`)}
          </p>
        </div>
      )}

      {mode !== 'quick' && isCustom && (
        <p className="text-[11px] rounded-lg px-3 py-2 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Giờ riêng của ngày này, không ảnh hưởng các tuần khác.</p>
      )}
      {bookedInRange && <p className="text-[11px] rounded-lg px-3 py-2 bg-primary/5 text-primary">Khung giờ này đã có người đặt. Thay đổi giờ rảnh không hủy lịch hẹn đã có.</p>}
    </Dialog>
  );
}
