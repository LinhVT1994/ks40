'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Loader2, PauseCircle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveConsultationSettingsAction, type ConsultationSettingsInput } from '../actions/consultation';
import { dateKeyInZone, generateSlots, toMinutes, type DateOverrides, type DateWindow, type WeeklySlot } from '../lib/slots';
import { minutesToHHMM } from '../lib/availability-grid';
import AvailabilityCalendar, { type Availability, type Block, type ChangeNotice } from './AvailabilityCalendar';
import ConsultationSettingsDialog, { type GeneralSettings } from './ConsultationSettingsDialog';
import { cn } from '@/lib/utils';

/* Storage (windows with options) ⇄ editor (blocks). */
const toBlock = (w: DateWindow, fallbackDuration: number): Block => ({
  from: toMinutes(w.start), to: toMinutes(w.end), durationMin: w.durationMin ?? fallbackDuration, meetingUrl: w.meetingUrl ?? '',
});
const toWindow = (b: Block): DateWindow => ({
  start: minutesToHHMM(b.from), end: minutesToHHMM(b.to), durationMin: b.durationMin, ...(b.meetingUrl && { meetingUrl: b.meetingUrl }),
});
function fromStore(weeklySlots: WeeklySlot[], overrides: DateOverrides, fallbackDuration: number): Availability {
  const weekly = new Map<number, Block[]>();
  for (const { day, from, until, ...w } of weeklySlots) {
    const block: Block = { ...toBlock(w, fallbackDuration), ...(from && { validFrom: from }), ...(until && { validUntil: until }) };
    weekly.set(day, [...(weekly.get(day) ?? []), block].sort((a, b) => a.from - b.from));
  }
  return { weekly, overrides: Object.fromEntries(Object.entries(overrides).map(([k, list]) => [k, list.map(w => toBlock(w, fallbackDuration))])) };
}
function toStore(a: Availability): { weeklySlots: WeeklySlot[]; dateOverrides: DateOverrides } {
  return {
    weeklySlots: [...a.weekly].sort(([x], [y]) => x - y).flatMap(([day, blocks]) => blocks.map(b => ({
      day, ...toWindow(b), ...(b.validFrom && { from: b.validFrom }), ...(b.validUntil && { until: b.validUntil }),
    }))),
    dateOverrides: Object.fromEntries(Object.keys(a.overrides).sort().map(k => [k, a.overrides[k].map(toWindow)])),
  };
}

type Props = { initial: ConsultationSettingsInput | null; profileHref: string; bookedCells: Record<string, number[]> };

/**
 * Host availability planner: the calendar is the page. Creating time (pick on the calendar or
 * "Tạo lịch") opens a dialog with the session length and meeting link for that block; the settings
 * dialog only holds accept on/off, time zone and intro. Every confirmed change is saved immediately.
 */
export default function ConsultationSettingsForm({ initial, profileHref, bookedCells }: Props) {
  const router = useRouter();
  const browserZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const start = useMemo<ConsultationSettingsInput>(() => initial ?? {
    enabled: false, intro: '', durationMin: 30, meetingUrl: '', timezone: browserZone, weeklySlots: [], dateOverrides: {},
  }, [initial, browserZone]);

  const [general, setGeneral] = useState<GeneralSettings>({ enabled: start.enabled, timezone: start.timezone, intro: start.intro });
  const [availability, setAvailability] = useState<Availability>(() => fromStore(start.weeklySlots, start.dateOverrides, start.durationMin));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();

  // Legacy account-level defaults are kept as fallbacks; they're no longer edited here.
  const toPayload = (g: GeneralSettings, a: Availability): ConsultationSettingsInput => ({
    ...g, durationMin: start.durationMin, meetingUrl: start.meetingUrl, ...toStore(a),
  });
  const stored = toStore(availability);
  const hasHours = stored.weeklySlots.length > 0 || Object.values(stored.dateOverrides).some(w => w.length > 0);
  const upcoming = useMemo(() => generateSlots({
    weeklySlots: stored.weeklySlots, overrides: stored.dateOverrides, timezone: general.timezone, durationMin: start.durationMin,
  }).length, [stored.weeklySlots, stored.dateOverrides, general.timezone, start.durationMin]);
  const zoneToday = useMemo(() => dateKeyInZone(new Date(), general.timezone), [general.timezone]);
  const enableBlocker = !hasHours ? 'Hãy thêm giờ rảnh trên lịch trước.' : upcoming === 0 ? 'Chưa có buổi nào có thể đặt trong 2 tuần tới.' : null;

  /** Optimistically apply, save, and roll back on error. One toast per change (undo included when given). */
  const persist = (nextGeneral: GeneralSettings, nextAvailability: Availability, notice: ChangeNotice = { message: 'Đã lưu' }) => {
    const prev = { general, availability };
    setGeneral(nextGeneral);
    setAvailability(nextAvailability);
    startTransition(async () => {
      const res = await saveConsultationSettingsAction(toPayload(nextGeneral, nextAvailability));
      if (!res.success) {
        setGeneral(prev.general);
        setAvailability(prev.availability);
        toast.error(res.error);
        return;
      }
      const { undo } = notice;
      toast.success(notice.message, {
        id: 'consultation-save',
        ...(undo && { action: { label: 'Hoàn tác', onClick: () => persist(nextGeneral, undo, { message: 'Đã khôi phục' }) }, duration: 6000 }),
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 sm:px-5 py-3',
        general.enabled ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]')}>
        <div className="flex items-center gap-3 min-w-0">
          {general.enabled ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <PauseCircle className="w-5 h-5 text-zinc-400 shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{general.enabled ? 'Đang nhận đặt lịch' : 'Chưa nhận đặt lịch'}</p>
            <p className="text-xs text-zinc-500 truncate">
              {general.enabled
                ? <><strong className="text-primary">{upcoming}</strong> buổi có thể đặt trong 2 tuần tới · <Link href={profileHref} className="text-primary hover:underline inline-flex items-center gap-0.5">trang cá nhân <ExternalLink className="w-3 h-3" /></Link></>
                : hasHours ? <>Bật “Cho phép nhận đặt lịch” trong <button type="button" onClick={() => setSettingsOpen(true)} className="text-primary hover:underline">Cài đặt</button>.</> : 'Thêm giờ rảnh trên lịch bên dưới, rồi bật nhận đặt lịch trong Cài đặt.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" aria-label="Đang lưu" />}
          <button type="button" onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-surface dark:bg-transparent text-xs font-semibold text-zinc-700 dark:text-slate-200 hover:border-primary/50">
            <Settings2 className="w-3.5 h-3.5" /> Cài đặt
          </button>
        </div>
      </div>

      {/* The calendar is the page */}
      <section className="ui-panel p-4 sm:p-6">
        <AvailabilityCalendar
          weekly={availability.weekly}
          overrides={availability.overrides}
          onChange={(next, notice) => persist(general, next, notice)}
          today={zoneToday}
          bookedCells={bookedCells}
        />
        <p className="mt-3 text-[11px] text-zinc-500">Giờ theo múi {general.timezone}.</p>
      </section>

      {settingsOpen && (
        <ConsultationSettingsDialog
          value={general}
          saving={isSaving}
          canEnable={enableBlocker}
          onClose={() => setSettingsOpen(false)}
          onSave={g => {
            persist(g, availability, { message: g.enabled && !general.enabled ? 'Người đọc có thể đặt lịch với bạn' : 'Đã lưu cài đặt' });
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
