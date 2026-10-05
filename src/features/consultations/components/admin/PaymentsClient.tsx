'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Landmark, Loader2, Pencil, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  confirmPaymentAction, markRefundedAction, rejectPaymentAction, savePaymentAccountAction,
  type AdminPaymentRow, type PaymentQueue,
} from '../../actions/payment-admin';
import { BANKS, bankOf, formatVnd, normalizeAccountName, vietQrUrl, type PaymentAccount } from '../../lib/payment';
import { Select, fieldClass } from '../dialog-ui';
import { cn } from '@/lib/utils';

const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

/* ── System bank account ─────────────────────────────────────── */

function AccountCard({ account }: { account: PaymentAccount | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!account);
  const [draft, setDraft] = useState<PaymentAccount>(account ?? { bankBin: '', accountNumber: '', accountName: '' });
  const [isPending, startTransition] = useTransition();
  const bank = account && bankOf(account.bankBin);

  const save = () => startTransition(async () => {
    const res = await savePaymentAccountAction(draft);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('Đã lưu tài khoản nhận tiền');
    setEditing(false);
    router.refresh();
  });

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-zinc-800 dark:text-white"><Landmark className="w-4 h-4 text-primary" /> Tài khoản nhận tiền</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Người đặt lịch tư vấn có phí chuyển khoản vào tài khoản này, kèm mã thanh toán.</p>
        </div>
        {account && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 hover:border-primary/50">
            <Pencil className="w-3.5 h-3.5" /> Sửa
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pa-bank" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-slate-300">Ngân hàng</label>
            <Select id="pa-bank" value={draft.bankBin} onChange={e => setDraft(d => ({ ...d, bankBin: e.target.value }))}>
              <option value="">Chọn ngân hàng…</option>
              {BANKS.map(b => <option key={b.bin} value={b.bin}>{b.short} — {b.name}</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="pa-number" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-slate-300">Số tài khoản</label>
            <input id="pa-number" inputMode="numeric" value={draft.accountNumber} onChange={e => setDraft(d => ({ ...d, accountNumber: e.target.value.replace(/\D/g, '') }))} className={cn(fieldClass, 'tabular-nums')} />
          </div>
          <div>
            <label htmlFor="pa-name" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-slate-300">Chủ tài khoản</label>
            <input id="pa-name" value={draft.accountName} onChange={e => setDraft(d => ({ ...d, accountName: e.target.value }))} onBlur={() => setDraft(d => ({ ...d, accountName: normalizeAccountName(d.accountName) }))}
              placeholder="NGUYEN VAN A" className={cn(fieldClass, 'uppercase')} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            {account && <button type="button" onClick={() => { setDraft(account); setEditing(false); }} className="h-9 px-3 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-white/5">Hủy</button>}
            <button type="button" onClick={save} disabled={isPending} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Lưu tài khoản
            </button>
          </div>
        </div>
      ) : account && (
        <div className="mt-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote VietQR preview */}
          <img src={vietQrUrl(account)} alt="QR xem trước" width={88} height={88} className="rounded-lg border border-zinc-200 bg-white p-1" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-zinc-500">Ngân hàng</dt><dd className="font-semibold">{bank?.short} <span className="font-normal text-zinc-500">· {bank?.name}</span></dd>
            <dt className="text-zinc-500">Số tài khoản</dt><dd className="font-semibold tabular-nums">{account.accountNumber}</dd>
            <dt className="text-zinc-500">Chủ tài khoản</dt><dd className="font-semibold">{account.accountName}</dd>
          </dl>
        </div>
      )}
    </section>
  );
}

/* ── Queue ───────────────────────────────────────────────────── */

function StatusCell({ r }: { r: AdminPaymentRow }) {
  const [label, cls] =
    r.status === 'AWAITING_PAYMENT' ? (r.reportedAt ? ['Đã báo chuyển', 'bg-sky-50 text-sky-700'] : ['Chờ chuyển khoản', 'bg-amber-50 text-amber-700'])
    : r.refundedAt ? ['Đã hoàn tiền', 'bg-zinc-100 text-zinc-600']
    : r.paidAt && (r.status === 'DECLINED' || r.status === 'CANCELLED') ? ['Cần hoàn tiền', 'bg-rose-50 text-rose-700']
    : r.status === 'CANCELLED' && r.reportedAt && !r.paidAt ? ['Báo chuyển sau khi hết hạn', 'bg-sky-50 text-sky-700']
    : r.paidAt ? ['Đã thanh toán', 'bg-emerald-50 text-emerald-700']
    : ['Đã hủy', 'bg-zinc-100 text-zinc-500'];
  return <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap dark:bg-white/5', cls)}>{label}</span>;
}

function Actions({ r }: { r: AdminPaymentRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) => startTransition(async () => {
    const res = await fn();
    if (!res.success) { toast.error(res.error ?? 'Đã có lỗi'); return; }
    toast.success(ok);
    router.refresh();
  });
  const late = r.status === 'CANCELLED' && !!r.reportedAt && !r.paidAt;
  const needsRefund = !!r.paidAt && !r.refundedAt && (r.status === 'DECLINED' || r.status === 'CANCELLED');

  if (isPending) return <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />;
  return (
    <div className="flex items-center justify-end gap-1.5">
      {(r.status === 'AWAITING_PAYMENT' || late) && (
        <>
          <button type="button" onClick={() => { if (confirm(`Xác nhận đã nhận ${formatVnd(r.amount)} với nội dung ${r.code}?`)) run(() => confirmPaymentAction(r.id), late ? 'Đã ghi nhận, chuyển sang cần hoàn tiền' : 'Đã xác nhận, yêu cầu đã gửi tới tác giả'); }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-brand text-white text-xs font-semibold whitespace-nowrap"><Check className="w-3.5 h-3.5" /> Đã nhận tiền</button>
          <button type="button" onClick={() => { const reason = prompt('Lý do (gửi cho người đặt):', 'Không tìm thấy giao dịch chuyển khoản'); if (reason !== null) run(() => rejectPaymentAction(r.id, reason), 'Đã hủy giữ chỗ'); }}
            aria-label="Không tìm thấy giao dịch" title="Không tìm thấy giao dịch"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50"><X className="w-4 h-4" /></button>
        </>
      )}
      {needsRefund && (
        <button type="button" onClick={() => { if (confirm(`Đã hoàn ${formatVnd(r.amount)} cho ${r.guest.name}?`)) run(() => markRefundedAction(r.id), 'Đã đánh dấu hoàn tiền'); }}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 dark:text-slate-200 dark:border-white/10 whitespace-nowrap"><RotateCcw className="w-3.5 h-3.5" /> Đã hoàn tiền</button>
      )}
    </div>
  );
}

const QUEUE_TABS: { key: PaymentQueue; label: string }[] = [
  { key: 'awaiting', label: 'Chờ đối chiếu' },
  { key: 'refund', label: 'Cần hoàn tiền' },
  { key: 'all', label: 'Tất cả' },
];

export default function PaymentsClient({ account, queue, q, rows, counts }: {
  account: PaymentAccount | null;
  queue: PaymentQueue;
  q: string;
  rows: AdminPaymentRow[];
  counts: { awaiting: number; reported: number; refund: number };
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const href = (next: PaymentQueue, query = q) => `/admin/payments?queue=${next}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
  const badge: Partial<Record<PaymentQueue, number>> = { awaiting: counts.awaiting, refund: counts.refund };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Thanh toán tư vấn</h1>
        <p className="text-sm text-zinc-500 mt-1">Đối chiếu sao kê theo mã thanh toán (nội dung chuyển khoản), xác nhận để gửi yêu cầu tới tác giả, và theo dõi hoàn tiền.</p>
      </div>

      <AccountCard account={account} />

      <section className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 border-b border-zinc-100 dark:border-white/5">
          <nav className="flex gap-1">
            {QUEUE_TABS.map(t => (
              <Link key={t.key} href={href(t.key)} scroll={false}
                className={cn('relative px-3 py-2.5 text-sm font-semibold', queue === t.key ? 'text-primary after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-primary after:rounded-full' : 'text-zinc-500 hover:text-zinc-800')}>
                {t.label}
                {!!badge[t.key] && <span className={cn('ml-1.5 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold', t.key === 'refund' ? 'bg-rose-500 text-white' : 'bg-brand text-white')}>{badge[t.key]}</span>}
              </Link>
            ))}
          </nav>
          <form onSubmit={e => { e.preventDefault(); router.replace(href(queue, search.trim())); }} className="relative mb-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mã LN…, tên hoặc email" aria-label="Tìm giao dịch"
              className={cn(fieldClass, 'h-9 w-64 pl-9')} />
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="py-14 text-center text-sm text-zinc-500">{queue === 'awaiting' ? 'Không có khoản nào chờ đối chiếu.' : queue === 'refund' ? 'Không có khoản nào cần hoàn tiền.' : 'Chưa có giao dịch.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-2.5 font-semibold">Mã</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Số tiền</th>
                  <th className="px-4 py-2.5 font-semibold">Người đặt</th>
                  <th className="px-4 py-2.5 font-semibold">Tác giả · Giờ hẹn</th>
                  <th className="px-4 py-2.5 font-semibold">Trạng thái</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {rows.map(r => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 font-mono font-bold tracking-wider text-primary whitespace-nowrap">{r.code}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">{formatVnd(r.amount)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800 dark:text-white">{r.guest.name}</p>
                      <p className="text-xs text-zinc-500">{r.guest.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-800 dark:text-white">{r.host.name}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">{fmt(r.startAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusCell r={r} />
                      <p className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                        {r.reportedAt ? `Báo chuyển ${fmt(r.reportedAt)}` : r.holdUntil ? `Giữ chỗ tới ${fmt(r.holdUntil)}` : `Tạo ${fmt(r.createdAt)}`}
                      </p>
                      {r.note && r.status !== 'AWAITING_PAYMENT' && <p className="mt-0.5 text-[11px] text-zinc-500">{r.note}</p>}
                    </td>
                    <td className="px-4 py-3"><Actions r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
