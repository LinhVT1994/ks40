'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CalendarPlus, Check, Link2, Loader2, Pencil, QrCode, Video, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/shared/Avatar';
import { cancelConsultationAction, getPaymentInstructionsAction, respondConsultationAction, updateConsultationLinkAction, type ConsultationListItem, type PaymentInstructions } from '../actions/consultation';
import { formatVnd } from '../lib/payment';
import { Dialog } from './dialog-ui';
import PaymentPanel from './PaymentPanel';
import { cn } from '@/lib/utils';

const fmtWhen = (iso: string, endIso: string) => {
  const start = new Date(iso);
  const date = start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const t = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${t(start)}–${t(new Date(endIso))}`;
};

type Bucket = 'action' | 'upcoming' | 'past';

function bucketOf(c: ConsultationListItem, now: number): Bucket {
  const upcoming = new Date(c.endAt).getTime() > now;
  if (upcoming && c.status === 'PENDING' && c.role === 'host') return 'action';
  if (upcoming && c.status === 'AWAITING_PAYMENT' && !c.paymentReported) return 'action';
  if (upcoming && (c.status === 'AWAITING_PAYMENT' || c.status === 'PENDING' || c.status === 'CONFIRMED')) return 'upcoming';
  return 'past';
}

function StatusBadge({ c, now }: { c: ConsultationListItem; now: number }) {
  const ended = new Date(c.endAt).getTime() <= now;
  const map: Record<string, [string, string]> = {
    AWAITING_PAYMENT: c.paymentReported ? ['Đang đối chiếu', 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'] : ['Chờ thanh toán', 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'],
    PENDING: ended ? ['Hết hạn', 'bg-zinc-100 text-zinc-500 dark:bg-white/5'] : ['Chờ xác nhận', 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'],
    CONFIRMED: ended ? ['Đã diễn ra', 'bg-zinc-100 text-zinc-600 dark:bg-white/5'] : ['Đã xác nhận', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'],
    DECLINED: ['Đã từ chối', 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'],
    CANCELLED: [c.cancelledByMe ? 'Bạn đã hủy' : c.declineReason === 'Quá hạn thanh toán' ? 'Hết giờ giữ chỗ' : 'Đã bị hủy', 'bg-zinc-100 text-zinc-500 dark:bg-white/5'],
  };
  const [label, cls] = map[c.status];
  return <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md', cls)}>{label}</span>;
}

/** Refund state for a paid booking that won't happen. */
function RefundNote({ c }: { c: ConsultationListItem }) {
  if (!c.paid || (c.status !== 'DECLINED' && c.status !== 'CANCELLED')) return null;
  return (
    <p className={cn('mt-2 inline-flex items-center gap-1.5 text-xs', c.refunded ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
      <Wallet className="w-3.5 h-3.5" /> {c.role === 'guest'
        ? (c.refunded ? `Đã hoàn ${formatVnd(c.price)}` : `${formatVnd(c.price)} sẽ được hoàn lại cho bạn`)
        : (c.refunded ? 'Người đặt đã được hoàn tiền' : 'Người đặt sẽ được hoàn tiền')}
    </p>
  );
}

function PaymentDialog({ c, onClose }: { c: ConsultationListItem; onClose: () => void }) {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getPaymentInstructionsAction(c.id).then(res => (res.success ? setPayment(res.payment) : setError(res.error))).catch(() => setError('Không tải được thông tin thanh toán'));
  }, [c.id]);
  return (
    <Dialog titleId={`pay-${c.id}`} title={`Thanh toán ${formatVnd(c.price)}`} icon={<QrCode />} onClose={onClose} size="lg"
      footer={<><span className="text-[11px] text-zinc-500">Buổi tư vấn với {c.other.name}</span><button type="button" onClick={onClose} className="h-9 px-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5">Đóng</button></>}>
      {payment ? <PaymentPanel consultationId={c.id} payment={payment} onReported={() => router.refresh()} />
        : error ? <p className="py-8 text-center text-sm text-rose-600">{error}</p>
        : <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</div>}
    </Dialog>
  );
}

function Row({ c, now, defaultMeetingUrl }: { c: ConsultationListItem; now: number; defaultMeetingUrl: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'idle' | 'accept' | 'decline' | 'edit-link'>('idle');
  const [paying, setPaying] = useState(false);
  const [reason, setReason] = useState('');
  const [link, setLink] = useState('');
  const upcoming = new Date(c.startAt).getTime() > now;
  const profileHref = `/@${c.other.username || c.other.id}`;

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) => startTransition(async () => {
    const res = await fn();
    if (!res.success) { toast.error(res.error ?? 'Đã có lỗi xảy ra'); return; }
    toast.success(ok);
    setMode('idle');
    router.refresh();
  });

  return (
    <li className="ui-article-row rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <Link href={profileHref} className="shrink-0"><Avatar src={c.other.image} name={c.other.name} size={44} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={profileHref} className="font-semibold text-zinc-800 dark:text-white hover:text-primary">{c.other.name}</Link>
            <span className="text-[11px] text-zinc-500">{c.role === 'host' ? 'đặt lịch với bạn' : 'là người tư vấn'}</span>
            <StatusBadge c={c} now={now} />
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-slate-300 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" /> {fmtWhen(c.startAt, c.endAt)}{c.price > 0 && <span className="text-zinc-500">· {formatVnd(c.price)}</span>}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-slate-400 leading-relaxed whitespace-pre-line line-clamp-4">{c.topic}</p>
          {c.status === 'DECLINED' && c.declineReason && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Lời nhắn: {c.declineReason}</p>}
          {c.status === 'CANCELLED' && !c.cancelledByMe && c.declineReason && <p className="mt-2 text-xs text-zinc-500">Lý do: {c.declineReason}</p>}
          {c.status === 'AWAITING_PAYMENT' && (
            <p className="mt-2 text-xs text-zinc-500">{c.paymentReported
              ? 'Bạn đã báo chuyển khoản, quản trị viên đang đối chiếu. Yêu cầu sẽ tới tác giả ngay sau đó.'
              : <>Chuyển khoản với nội dung <strong className="text-primary tracking-wider">{c.paymentCode}</strong> trước {c.holdUntil && new Date(c.holdUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} để giữ chỗ.</>}</p>
          )}
          <RefundNote c={c} />

          {upcoming && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {c.status === 'AWAITING_PAYMENT' && (
                <button type="button" onClick={() => setPaying(true)} className={cn('ui-button !py-2 !px-3.5 !text-xs', c.paymentReported && 'ui-button-secondary')}>
                  <QrCode className="w-3.5 h-3.5" /> {c.paymentReported ? 'Xem thông tin chuyển khoản' : 'Thanh toán'}
                </button>
              )}
              {c.status === 'CONFIRMED' && c.meetingUrl && (
                <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="ui-button !py-2 !px-3.5 !text-xs"><Video className="w-3.5 h-3.5" /> Vào phòng họp</a>
              )}
              {c.status === 'CONFIRMED' && (
                <a href={`/api/consultations/${c.id}/ics`} className="ui-button ui-button-secondary !py-2 !px-3.5 !text-xs"><CalendarPlus className="w-3.5 h-3.5" /> Thêm vào lịch</a>
              )}
              {c.status === 'CONFIRMED' && c.role === 'host' && mode === 'idle' && (
                <button type="button" onClick={() => { setLink(c.meetingUrl ?? ''); setMode('edit-link'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /> Sửa link</button>
              )}
              {c.status === 'PENDING' && c.role === 'host' && mode === 'idle' && (
                <>
                  <button type="button" disabled={isPending} onClick={() => { setLink(c.suggestedMeetingUrl ?? defaultMeetingUrl); setMode('accept'); }} className="ui-button !py-2 !px-3.5 !text-xs">
                    <Check className="w-3.5 h-3.5" /> Chấp nhận
                  </button>
                  <button type="button" disabled={isPending} onClick={() => setMode('decline')} className="ui-button ui-button-secondary !py-2 !px-3.5 !text-xs"><X className="w-3.5 h-3.5" /> Từ chối</button>
                </>
              )}
              {(c.status === 'CONFIRMED' || (c.role === 'guest' && (c.status === 'PENDING' || (c.status === 'AWAITING_PAYMENT' && !c.paymentReported)))) && (
                <button type="button" disabled={isPending}
                  onClick={() => {
                    const msg = c.status === 'AWAITING_PAYMENT'
                      ? 'Hủy giữ chỗ này? Nếu bạn đã chuyển tiền, đừng hủy — hãy bấm “Thanh toán” → “Tôi đã chuyển khoản”.'
                      : `Hủy lịch hẹn này? Người kia sẽ nhận được thông báo.${c.paid ? ' Người đặt sẽ được hoàn tiền.' : ''}`;
                    if (confirm(msg)) run(() => cancelConsultationAction(c.id), 'Đã hủy lịch hẹn');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">Hủy lịch</button>
              )}
            </div>
          )}

          {(mode === 'accept' || mode === 'edit-link') && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 space-y-2">
              <label htmlFor={`link-${c.id}`} className="text-xs font-semibold text-zinc-700 dark:text-slate-200">Link họp cho buổi này</label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input id={`link-${c.id}`} type="url" inputMode="url" value={link} onChange={e => setLink(e.target.value)} autoFocus
                  placeholder="https://meet.google.com/… hoặc https://zoom.us/j/…"
                  className="w-full bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <p className="text-[11px] text-zinc-500">{mode === 'accept' ? ((c.suggestedMeetingUrl ?? defaultMeetingUrl) ? 'Đã điền sẵn link của khung giờ này — thay bằng link mới nếu muốn.' : 'Tạo một phòng Meet/Zoom rồi dán link vào đây.') : 'Người đặt sẽ nhận thông báo về link mới.'}</p>
              <div className="flex gap-2">
                <button type="button" disabled={isPending || !link.trim()}
                  onClick={() => mode === 'accept'
                    ? run(() => respondConsultationAction(c.id, 'accept', undefined, link), 'Đã xác nhận lịch hẹn')
                    : run(() => updateConsultationLinkAction(c.id, link), 'Đã cập nhật link họp')}
                  className="ui-button !py-2 !px-3.5 !text-xs disabled:opacity-50">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {mode === 'accept' ? 'Xác nhận lịch' : 'Lưu link'}
                </button>
                <button type="button" onClick={() => setMode('idle')} className="px-3 py-2 text-xs text-zinc-500">Thôi</button>
              </div>
            </div>
          )}

          {mode === 'decline' && (
            <div className="mt-4 space-y-2">
              <input value={reason} onChange={e => setReason(e.target.value)} maxLength={300} autoFocus
                placeholder="Lời nhắn (không bắt buộc), ví dụ: tuần này mình bận, bạn chọn tuần sau nhé"
                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              <div className="flex gap-2">
                <button type="button" disabled={isPending} onClick={() => run(() => respondConsultationAction(c.id, 'decline', reason), 'Đã từ chối lịch hẹn')} className="ui-button !py-2 !px-3.5 !text-xs">Gửi từ chối</button>
                <button type="button" onClick={() => setMode('idle')} className="px-3 py-2 text-xs text-zinc-500">Thôi</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {paying && <PaymentDialog c={c} onClose={() => { setPaying(false); router.refresh(); }} />}
    </li>
  );
}

export default function ConsultationList({ items, defaultMeetingUrl = '' }: { items: ConsultationListItem[]; defaultMeetingUrl?: string }) {
  const [now] = useState(() => Date.now());
  const groups: Record<Bucket, ConsultationListItem[]> = { action: [], upcoming: [], past: [] };
  for (const c of items) groups[bucketOf(c, now)].push(c);
  groups.past.reverse(); // most recent first

  if (items.length === 0) {
    return (
      <div className="py-16 text-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <CalendarDays className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-600 dark:text-slate-300 font-medium">Chưa có lịch hẹn nào.</p>
        <p className="text-sm text-zinc-500 mt-1">Ghé trang cá nhân của một tác giả và bấm “Đặt lịch tư vấn” để bắt đầu.</p>
      </div>
    );
  }

  const sections: [Bucket, string][] = [['action', 'Cần bạn xử lý'], ['upcoming', 'Sắp tới'], ['past', 'Đã qua & đã hủy']];
  return (
    <div className="space-y-10">
      {sections.map(([key, title]) => groups[key].length > 0 && (
        <section key={key}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">{title} <span className="text-primary">({groups[key].length})</span></h2>
          <ul className="space-y-3">{groups[key].map(c => <Row key={c.id} c={c} now={now} defaultMeetingUrl={defaultMeetingUrl} />)}</ul>
        </section>
      ))}
    </div>
  );
}
