'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, ExternalLink, Eraser, Link2, Loader2, Sparkles, Video } from 'lucide-react';
import { toast } from 'sonner';
import { saveConsultationSettingsAction, type ConsultationSettingsInput } from '../actions/consultation';
import { DURATION_OPTIONS, WEEKDAY_LABELS, dateKeyInZone, generateSlots } from '../lib/slots';
import { PRESETS, cellsToWindows, windowsToCells } from '../lib/availability-grid';
import AvailabilityGrid from './AvailabilityGrid';
import BlockedDatesPicker from './BlockedDatesPicker';
import { cn } from '@/lib/utils';

const inputClass = 'w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-zinc-800 dark:text-white';

function timeZones(current: string) {
  const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return list.includes(current) ? list : [current, ...list];
}

function meetingProvider(url: string): { label: string; ok: boolean } | null {
  if (!url.trim()) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return { label: 'Link phải bắt đầu bằng https://', ok: false };
    if (u.hostname === 'meet.google.com') return { label: 'Google Meet', ok: true };
    if (u.hostname.endsWith('zoom.us')) return { label: 'Zoom', ok: true };
    if (u.hostname.endsWith('teams.microsoft.com') || u.hostname.endsWith('teams.live.com')) return { label: 'Microsoft Teams', ok: true };
    return { label: u.hostname, ok: true };
  } catch {
    return { label: 'Link chưa hợp lệ', ok: false };
  }
}

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="ui-panel p-5 sm:p-7">
      <div className="flex items-start gap-3 mb-5">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{step}</span>
        <div>
          <h2 className="font-display font-semibold text-zinc-800 dark:text-white">{title}</h2>
          {hint && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ConsultationSettingsForm({ initial, profileHref, bookedDates }: { initial: ConsultationSettingsInput | null; profileHref: string; bookedDates: string[] }) {
  const router = useRouter();
  const browserZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const start = useMemo<ConsultationSettingsInput>(() => initial ?? {
    enabled: false, intro: '', durationMin: 30, meetingUrl: '', timezone: browserZone, weeklySlots: [], blockedDates: [],
  }, [initial, browserZone]);
  const [form, setForm] = useState(start);
  const [cells, setCells] = useState(() => windowsToCells(start.weeklySlots));
  const [saved, setSaved] = useState(() => JSON.stringify(start));
  const [isPending, startTransition] = useTransition();
  const zones = useMemo(() => timeZones(form.timezone), [form.timezone]);

  const windows = useMemo(() => cellsToWindows(cells), [cells]);
  const current: ConsultationSettingsInput = { ...form, weeklySlots: windows };
  const dirty = JSON.stringify(current) !== saved;
  const provider = meetingProvider(form.meetingUrl);
  const hoursPerWeek = (cells.size * 30) / 60;
  const upcoming = useMemo(() => generateSlots({ weeklySlots: windows, timezone: form.timezone, durationMin: form.durationMin, blockedDates: form.blockedDates }).length, [windows, form.timezone, form.durationMin, form.blockedDates]);
  const zoneToday = useMemo(() => dateKeyInZone(new Date(), form.timezone), [form.timezone]);
  const zoneNow = useMemo(() => new Date().toLocaleTimeString('vi-VN', { timeZone: form.timezone, hour: '2-digit', minute: '2-digit', hour12: false }), [form.timezone]);

  // Problems that block turning bookings on.
  const blockers = [
    !form.meetingUrl.trim() && 'thêm link Meet/Zoom',
    provider && !provider.ok && 'sửa link họp',
    cells.size === 0 && 'chọn ít nhất một khung giờ rảnh',
    cells.size > 0 && upcoming === 0 && `khung giờ phải dài ít nhất ${form.durationMin} phút`,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof ConsultationSettingsInput>(key: K, value: ConsultationSettingsInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const addPreset = (id: string) => {
    const preset = PRESETS.find(p => p.id === id);
    if (preset) setCells(c => new Set([...c, ...windowsToCells(preset.windows)]));
  };

  const save = (override?: Partial<ConsultationSettingsInput>) => startTransition(async () => {
    const payload = { ...current, ...override };
    const res = await saveConsultationSettingsAction(payload);
    if (!res.success) { toast.error(res.error); return; }
    if (override) setForm(f => ({ ...f, ...override }));
    setSaved(JSON.stringify(payload));
    toast.success(payload.enabled ? 'Đã lưu. Người đọc có thể đặt lịch với bạn.' : 'Đã lưu thiết lập.');
    router.refresh();
  });

  const enabledLive = JSON.parse(saved).enabled as boolean;

  return (
    <div className="space-y-5 pb-24">
      {/* Status */}
      <div className={cn('rounded-2xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between',
        enabledLive ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]')}>
        <div className="flex items-start gap-3">
          {enabledLive ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold text-zinc-800 dark:text-white">{enabledLive ? 'Đang nhận đặt lịch' : 'Chưa nhận đặt lịch'}</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              {form.enabled !== enabledLive
                ? <>Bấm <strong>Lưu thay đổi</strong> bên dưới để {form.enabled ? 'bắt đầu nhận' : 'tạm dừng nhận'} đặt lịch.</>
                : enabledLive
                ? <>Nút “Đặt lịch tư vấn” đang hiện trên <Link href={profileHref} className="text-primary hover:underline inline-flex items-center gap-0.5">trang cá nhân <ExternalLink className="w-3 h-3" /></Link> của bạn.</>
                : blockers.length ? <>Để bật, hãy {blockers.join(', ')}.</> : 'Mọi thứ đã sẵn sàng — bật để người đọc đặt lịch với bạn.'}
            </p>
          </div>
        </div>
        <button type="button" role="switch" aria-checked={form.enabled} onClick={() => set('enabled', !form.enabled)}
          disabled={!form.enabled && blockers.length > 0}
          className={cn('relative shrink-0 self-end sm:self-auto w-12 h-7 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            form.enabled ? 'bg-brand' : 'bg-zinc-300 dark:bg-white/15')}>
          <span className={cn('absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform', form.enabled && 'translate-x-5')} />
          <span className="sr-only">Nhận đặt lịch tư vấn</span>
        </button>
      </div>

      <Section step={1} title="Giới thiệu" hint="Người đọc sẽ thấy đoạn này trong hộp thoại đặt lịch.">
        <textarea rows={3} maxLength={500} value={form.intro} onChange={e => set('intro', e.target.value)} aria-label="Bạn có thể giúp gì?"
          placeholder="Ví dụ: Mình có thể tư vấn về Revit, tổ chức mô hình BIM và lộ trình học cho người mới bắt đầu."
          className={cn(inputClass, 'resize-none')} />
        <p className="mt-1 text-right text-[10px] text-zinc-400">{form.intro.length}/500</p>
      </Section>

      <Section step={2} title="Buổi tư vấn" hint="Link họp chỉ gửi cho người đặt sau khi bạn xác nhận lịch.">
        <div className="space-y-5">
          <div>
            <span className="text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-2 block">Thời lượng mỗi buổi</span>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(d => (
                <button key={d} type="button" onClick={() => set('durationMin', d)} aria-pressed={form.durationMin === d}
                  className={cn('px-4 py-2 rounded-xl border text-sm font-semibold transition-colors',
                    form.durationMin === d ? 'bg-brand border-transparent text-white' : 'border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-slate-300 hover:border-primary/50')}>
                  {d} phút
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="c-meet" className="text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-2 block">Link Google Meet / Zoom</label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input id="c-meet" type="url" inputMode="url" value={form.meetingUrl} onChange={e => set('meetingUrl', e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij" className={cn(inputClass, 'pl-10')} />
            </div>
            {provider && (
              <p className={cn('mt-1.5 text-xs flex items-center gap-1.5', provider.ok ? 'text-emerald-600' : 'text-rose-600')}>
                {provider.ok ? <Video className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} {provider.label}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section step={3} title="Lịch rảnh hằng tuần" hint="Bấm hoặc kéo trên lưới để tô giờ rảnh. Kéo từ ô đã tô để xóa. Bấm tên thứ để chọn cả ngày.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <label htmlFor="c-tz" className="text-xs text-zinc-500 shrink-0">Múi giờ</label>
            <select id="c-tz" value={form.timezone} onChange={e => set('timezone', e.target.value)} className={cn(inputClass, 'py-1.5 text-xs w-auto max-w-[220px]')}>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <span className="text-[11px] text-zinc-400 shrink-0">Bây giờ {zoneNow}</span>
          </div>
          <button type="button" onClick={() => setCells(new Set())} disabled={cells.size === 0}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-rose-500 disabled:opacity-40 self-start sm:self-auto"><Eraser className="w-3.5 h-3.5" /> Xóa hết</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-[11px] text-zinc-500 self-center mr-1">Thêm nhanh:</span>
          {PRESETS.map(p => (
            <button key={p.id} type="button" onClick={() => addPreset(p.id)}
              className="px-3 py-1.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors">+ {p.label}</button>
          ))}
        </div>

        <AvailabilityGrid cells={cells} onChange={setCells} />

        <div className="mt-5 grid sm:grid-cols-[auto_1fr] gap-4 items-start rounded-2xl bg-primary/5 p-4">
          <div className="flex sm:flex-col gap-4 sm:gap-1 sm:pr-4 sm:border-r border-primary/15">
            <p className="text-xs text-zinc-500"><strong className="text-lg text-primary font-display">{hoursPerWeek % 1 ? hoursPerWeek.toFixed(1) : hoursPerWeek}</strong> giờ/tuần</p>
            <p className="text-xs text-zinc-500"><strong className="text-lg text-primary font-display">{upcoming}</strong> khung trong 2 tuần tới</p>
          </div>
          <ul className="text-xs text-zinc-600 dark:text-slate-300 space-y-1">
            {windows.length === 0
              ? <li className="text-zinc-500">Chưa có khung giờ nào. Tô trên lưới hoặc dùng “Thêm nhanh”.</li>
              : [1, 2, 3, 4, 5, 6, 0].map(day => {
                  const list = windows.filter(w => w.day === day);
                  return list.length > 0 && <li key={day}><span className="font-semibold w-16 inline-block">{WEEKDAY_LABELS[day]}</span> {list.map(w => `${w.start}–${w.end}`).join(', ')}</li>;
                })}
          </ul>
        </div>
      </Section>

      <Section step={4} title="Ngày không nhận lịch" hint="Chặn những ngày cụ thể (đi công tác, nghỉ lễ…) mà không cần sửa lịch rảnh hằng tuần.">
        <BlockedDatesPicker value={form.blockedDates} onChange={d => set('blockedDates', d)} today={zoneToday} bookedDates={bookedDates} />
      </Section>

      {/* Save bar */}
      <div className={cn('sticky bottom-4 z-10 transition-all', dirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none')}>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-surface/95 dark:bg-[#2b2924]/95 backdrop-blur-md shadow-xl px-5 py-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300">Chưa lưu thay đổi</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { const s = JSON.parse(saved) as ConsultationSettingsInput; setForm(s); setCells(windowsToCells(s.weeklySlots)); }}
              className="px-2 sm:px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-white whitespace-nowrap">Hoàn tác</button>
            <button type="button" onClick={() => save()} disabled={isPending} className="ui-button !py-2 whitespace-nowrap disabled:opacity-60">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
