'use client';

import { useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Dialog, FieldLabel, GhostButton, PrimaryButton, Select, fieldClass } from './dialog-ui';
import { cn } from '@/lib/utils';

export type GeneralSettings = { enabled: boolean; timezone: string; intro: string; price: number };

const PRICE_PRESETS = [0, 100_000, 200_000, 300_000, 500_000];
const short = (v: number) => (v === 0 ? 'Miễn phí' : `${v / 1000}k`);

function timeZones(current: string) {
  const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return list.includes(current) ? list : [current, ...list];
}

/** Account-level consultation options only: accept bookings or not, price, time zone, intro. */
export default function ConsultationSettingsDialog({ value, saving, canEnable, paymentReady, onSave, onClose }: {
  value: GeneralSettings;
  saving: boolean;
  /** Why bookings can't be turned on yet (no availability), or null when they can. */
  canEnable: string | null;
  /** The system bank account is set up, so paid sessions are possible. */
  paymentReady: boolean;
  onSave: (v: GeneralSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<GeneralSettings>(value);
  const zones = useMemo(() => timeZones(draft.timezone), [draft.timezone]);
  const zoneNow = useMemo(() => new Date().toLocaleTimeString('vi-VN', { timeZone: draft.timezone, hour: '2-digit', minute: '2-digit', hour12: false }), [draft.timezone]);
  const set = <K extends keyof GeneralSettings>(k: K, v: GeneralSettings[K]) => setDraft(d => ({ ...d, [k]: v }));
  const blocked = !value.enabled && draft.enabled && canEnable;
  const priceText = draft.price ? draft.price.toLocaleString('vi-VN') : '';
  const priceError = draft.price > 0 && draft.price < 10_000 ? 'Tối thiểu 10.000đ, hoặc để trống nếu miễn phí' : null;

  return (
    <Dialog titleId="cs-title" title="Cài đặt tư vấn" icon={<Settings2 />} onClose={onClose} size="lg"
      footer={<>
        <span />
        <div className="flex items-center gap-1.5">
          <GhostButton onClick={onClose}>Hủy</GhostButton>
          <PrimaryButton disabled={saving || !!blocked || !!priceError} onClick={() => onSave(draft)}>Lưu cài đặt</PrimaryButton>
        </div>
      </>}>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 dark:border-white/10 px-3.5 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-white">Cho phép nhận đặt lịch</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Hiện nút “Đặt lịch tư vấn” trên trang cá nhân của bạn.</p>
        </div>
        <button type="button" role="switch" aria-checked={draft.enabled} aria-label="Cho phép nhận đặt lịch" onClick={() => set('enabled', !draft.enabled)}
          className={cn('relative shrink-0 w-9 h-5 rounded-full transition-colors', draft.enabled ? 'bg-brand' : 'bg-zinc-300 dark:bg-white/15')}>
          <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', draft.enabled && 'translate-x-4')} />
        </button>
      </div>
      {blocked && <p className="-mt-2 text-[11px] text-rose-600">{canEnable}</p>}

      <div>
        <FieldLabel htmlFor="c-price" hint="mỗi buổi">Giá tư vấn</FieldLabel>
        {paymentReady || value.price > 0 ? (
          <>
            <div className="relative">
              <input id="c-price" inputMode="numeric" value={priceText} placeholder="0 — miễn phí"
                onChange={e => set('price', Math.min(50_000_000, Number(e.target.value.replace(/\D/g, '')) || 0))}
                className={cn(fieldClass, 'pr-10 tabular-nums font-medium')} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">đ</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map(v => (
                <button key={v} type="button" onClick={() => set('price', v)} aria-pressed={draft.price === v}
                  className={cn('h-7 px-2.5 rounded-md border text-xs font-medium transition-colors',
                    draft.price === v ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-primary/40')}>
                  {short(v)}
                </button>
              ))}
            </div>
            <p className={cn('mt-1.5 text-[11px]', priceError ? 'text-rose-600' : 'text-zinc-500')}>
              {priceError ?? (draft.price > 0
                ? 'Người đặt chuyển khoản vào tài khoản của hệ thống, kèm mã thanh toán. Yêu cầu chỉ tới bạn sau khi tiền đã được xác nhận.'
                : 'Miễn phí: người đặt gửi yêu cầu ngay, không cần chuyển khoản.')}
            </p>
          </>
        ) : (
          <p className="text-[11px] rounded-lg px-3 py-2 bg-zinc-50 text-zinc-600 dark:bg-white/5 dark:text-slate-400">Hiện các buổi tư vấn đều miễn phí. Hệ thống chưa có tài khoản nhận tiền, nên chưa thể đặt giá.</p>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="c-tz" hint={`· bây giờ ${zoneNow}`}>Múi giờ của lịch</FieldLabel>
        <Select id="c-tz" value={draft.timezone} onChange={e => set('timezone', e.target.value)}>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </Select>
        {draft.timezone !== value.timezone && (
          <p className="mt-1.5 text-[11px] rounded-lg px-3 py-2 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Giờ rảnh sẽ được hiểu theo múi giờ mới (ví dụ 20:00 giờ {draft.timezone}). Lịch hẹn đã đặt không bị ảnh hưởng.</p>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="c-intro" hint="(hiện khi người đọc đặt lịch)">Lời giới thiệu</FieldLabel>
        <textarea id="c-intro" rows={3} maxLength={500} value={draft.intro} onChange={e => set('intro', e.target.value)} aria-label="Bạn có thể giúp gì?"
          placeholder="Ví dụ: Mình có thể tư vấn về Revit, tổ chức mô hình BIM và lộ trình học cho người mới bắt đầu."
          className={cn(fieldClass, 'h-auto py-2.5 resize-none')} />
        <p className="mt-1 text-right text-[10px] text-zinc-400">{draft.intro.length}/500</p>
      </div>
    </Dialog>
  );
}
