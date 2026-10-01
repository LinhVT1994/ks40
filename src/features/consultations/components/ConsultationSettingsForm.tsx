'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveConsultationSettingsAction, type ConsultationSettingsInput } from '../actions/consultation';
import { DURATION_OPTIONS, MAX_WEEKLY_WINDOWS, WEEKDAY_LABELS, generateSlots, parseWeeklySlots, type WeeklySlot } from '../lib/slots';
import { cn } from '@/lib/utils';

const inputClass = 'w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-zinc-800 dark:text-white';
const labelClass = 'text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-slate-500 mb-2 block';
// Mon→Sun reads more naturally than Sun→Sat.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function timeZones(current: string) {
  const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return list.includes(current) ? list : [current, ...list];
}

export default function ConsultationSettingsForm({ initial }: { initial: ConsultationSettingsInput | null }) {
  const router = useRouter();
  const browserZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [form, setForm] = useState<ConsultationSettingsInput>(initial ?? {
    enabled: false, intro: '', durationMin: 30, meetingUrl: '', timezone: browserZone,
    weeklySlots: [{ day: 2, start: '20:00', end: '22:00' }],
  });
  const [isPending, startTransition] = useTransition();
  const zones = useMemo(() => timeZones(form.timezone), [form.timezone]);

  const set = <K extends keyof ConsultationSettingsInput>(key: K, value: ConsultationSettingsInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const setSlot = (i: number, patch: Partial<WeeklySlot>) => set('weeklySlots', form.weeklySlots.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const parsed = parseWeeklySlots(form.weeklySlots);
  const previewCount = parsed.ok ? generateSlots({ weeklySlots: parsed.slots, timezone: form.timezone, durationMin: form.durationMin }).length : 0;

  const save = () => startTransition(async () => {
    const res = await saveConsultationSettingsAction(form);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(form.enabled ? 'Đã lưu. Người đọc có thể đặt lịch với bạn.' : 'Đã lưu thiết lập.');
    router.refresh();
  });

  return (
    <div className="space-y-8">
      <label className="flex items-start justify-between gap-6 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 cursor-pointer">
        <span>
          <span className="block text-sm font-bold text-zinc-800 dark:text-white">Nhận đặt lịch tư vấn</span>
          <span className="block text-xs text-zinc-500 mt-1">Hiện nút “Đặt lịch tư vấn” trên trang cá nhân của bạn.</span>
        </span>
        <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--color-brand)]" />
      </label>

      <div>
        <label htmlFor="c-intro" className={labelClass}>Bạn có thể giúp gì?</label>
        <textarea id="c-intro" rows={3} maxLength={500} value={form.intro} onChange={e => set('intro', e.target.value)}
          placeholder="Ví dụ: Mình có thể tư vấn về Revit, tổ chức mô hình BIM và lộ trình học cho người mới bắt đầu."
          className={cn(inputClass, 'resize-none')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="c-meet" className={labelClass}>Link Google Meet / Zoom</label>
          <input id="c-meet" type="url" inputMode="url" value={form.meetingUrl} onChange={e => set('meetingUrl', e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij" className={inputClass} />
          <p className="mt-1.5 text-[11px] text-zinc-500">Chỉ gửi cho người đặt sau khi bạn xác nhận lịch.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="c-dur" className={labelClass}>Mỗi buổi</label>
            <select id="c-dur" value={form.durationMin} onChange={e => set('durationMin', Number(e.target.value))} className={inputClass}>
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} phút</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-tz" className={labelClass}>Múi giờ</label>
            <select id="c-tz" value={form.timezone} onChange={e => set('timezone', e.target.value)} className={inputClass}>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between mb-3">
          <span className={cn(labelClass, 'mb-0')}>Khung giờ rảnh hằng tuần</span>
          <span className="text-[11px] text-zinc-500">Theo giờ {form.timezone}</span>
        </div>
        <div className="space-y-2">
          {form.weeklySlots.map((slot, i) => (
            <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select aria-label="Ngày" value={slot.day} onChange={e => setSlot(i, { day: Number(e.target.value) })} className={cn(inputClass, 'sm:w-40')}>
                {DAY_ORDER.map(d => <option key={d} value={d}>{WEEKDAY_LABELS[d]}</option>)}
              </select>
              <input aria-label="Từ" type="time" step={900} value={slot.start} onChange={e => setSlot(i, { start: e.target.value })} className={cn(inputClass, 'flex-1 sm:w-32')} />
              <span className="text-zinc-400 text-sm">→</span>
              <input aria-label="Đến" type="time" step={900} value={slot.end} onChange={e => setSlot(i, { end: e.target.value })} className={cn(inputClass, 'flex-1 sm:w-32')} />
              <button type="button" aria-label="Xóa khung giờ" onClick={() => set('weeklySlots', form.weeklySlots.filter((_, j) => j !== i))}
                className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        {form.weeklySlots.length < MAX_WEEKLY_WINDOWS && (
          <button type="button" onClick={() => set('weeklySlots', [...form.weeklySlots, { day: 4, start: '20:00', end: '22:00' }])}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Thêm khung giờ</button>
        )}
        <p className={cn('mt-4 text-xs rounded-xl px-4 py-3', parsed.ok ? 'bg-primary/5 text-zinc-600 dark:text-slate-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10')}>
          {parsed.ok ? <>Người đọc sẽ thấy <strong className="text-primary">{previewCount} khung giờ</strong> có thể đặt trong 2 tuần tới (đặt trước ít nhất 2 tiếng).</> : parsed.error}
        </p>
      </div>

      <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-white/10">
        <button type="button" onClick={save} disabled={isPending} className="ui-button mt-6 disabled:opacity-60">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu thiết lập
        </button>
      </div>
    </div>
  );
}
