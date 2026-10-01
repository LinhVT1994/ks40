'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Copy, Hourglass, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { reportPaymentAction, type PaymentInstructions } from '../actions/consultation';
import { bankOf, formatVnd, vietQrUrl } from '../lib/payment';
import { cn } from '@/lib/utils';

function CopyRow({ label, value, display, strong }: { label: string; value: string; display?: React.ReactNode; strong?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Không sao chép được, hãy chép thủ công');
    }
  };
  return (
    <div className={cn('flex items-center justify-between gap-3 px-3.5 py-2.5', strong && 'bg-primary/[0.06]')}>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500">{label}</p>
        <p className={cn('text-sm tabular-nums break-all', strong ? 'font-bold text-primary text-base tracking-wider' : 'font-semibold text-zinc-800 dark:text-white')}>{display ?? value}</p>
      </div>
      <button type="button" onClick={copy} aria-label={`Sao chép ${label.toLowerCase()}`}
        className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-slate-300 border border-zinc-200 dark:border-white/10 hover:border-primary/40 hover:text-primary transition-colors">
        {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Chép</>}
      </button>
    </div>
  );
}

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const left = Math.max(0, new Date(until).getTime() - now);
  return { left, text: `${Math.floor(left / 60_000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` };
}

/**
 * Transfer instructions for a held booking: VietQR + copyable fields, with the payment code as the
 * message. "Tôi đã chuyển khoản" stops the hold from expiring and asks an admin to check.
 */
export default function PaymentPanel({ consultationId, payment, onReported }: {
  consultationId: string;
  payment: PaymentInstructions;
  onReported?: () => void;
}) {
  const [reported, setReported] = useState(payment.reported);
  const [isPending, startTransition] = useTransition();
  const countdown = useCountdown(reported ? null : payment.holdUntil);
  const bank = bankOf(payment.account.bankBin);
  const expired = countdown?.left === 0;

  const report = () => startTransition(async () => {
    const res = await reportPaymentAction(consultationId);
    if (!res.success) { toast.error(res.error); return; }
    setReported(true);
    toast.success(res.late ? 'Đã ghi nhận. Quản trị viên sẽ đối chiếu và hoàn tiền cho bạn.' : 'Đã ghi nhận. Chúng tôi sẽ đối chiếu và báo cho bạn.');
    onReported?.();
  });

  return (
    <div className="space-y-4">
      {reported ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-3.5 py-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">Bạn đã báo chuyển khoản. Quản trị viên đang đối chiếu, yêu cầu sẽ được gửi tới tác giả ngay khi xác nhận được khoản tiền. Chỗ của bạn vẫn được giữ.</p>
        </div>
      ) : (
        <div className={cn('flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs',
          expired ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300')}>
          <Hourglass className="w-4 h-4 shrink-0" />
          {expired
            ? <span>Đã hết thời gian giữ chỗ. Nếu bạn đã lỡ chuyển tiền, vẫn bấm “Tôi đã chuyển khoản” để quản trị viên đối chiếu và hoàn lại.</span>
            : <span>Giữ chỗ trong <strong className="tabular-nums">{countdown?.text}</strong>. Hãy chuyển khoản rồi bấm “Tôi đã chuyển khoản”.</span>}
        </div>
      )}

      <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
        <div className="mx-auto sm:mx-0 w-[200px] rounded-xl border border-zinc-200 dark:border-white/10 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote VietQR image, sized by the API */}
          <img src={vietQrUrl(payment.account, payment.amount, payment.code)} alt={`Mã QR chuyển ${formatVnd(payment.amount)} tới ${bank?.short ?? ''}`} width={184} height={184} className="w-full h-auto" />
          <p className="mt-1 text-center text-[10px] text-zinc-500">Quét bằng app ngân hàng</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden">
          <div className="px-3.5 py-2.5">
            <p className="text-[11px] text-zinc-500">Ngân hàng</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{bank?.short} <span className="font-normal text-zinc-500 text-xs">· {bank?.name}</span></p>
          </div>
          <CopyRow label="Số tài khoản" value={payment.account.accountNumber} />
          <div className="px-3.5 py-2.5">
            <p className="text-[11px] text-zinc-500">Chủ tài khoản</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{payment.account.accountName}</p>
          </div>
          <CopyRow label="Số tiền" value={String(payment.amount)} display={formatVnd(payment.amount)} />
          <CopyRow label="Nội dung chuyển khoản" value={payment.code} strong />
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Ghi <strong className="text-zinc-700 dark:text-slate-200">đúng nội dung {payment.code}</strong> để hệ thống nhận ra khoản chuyển của bạn. Nếu tác giả từ chối hoặc lịch bị hủy, bạn sẽ được hoàn tiền.
      </p>

      {!reported && (
        <div className="flex justify-end">
          <button type="button" onClick={report} disabled={isPending} className="ui-button disabled:opacity-50">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Tôi đã chuyển khoản
          </button>
        </div>
      )}
    </div>
  );
}
