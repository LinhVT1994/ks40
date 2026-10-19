'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { createNotificationAction } from '@/lib/notifications';
import { sendConsultationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import { PAYMENT_CONFIG_KEY, PAYMENT_HOLD_MINUTES, parsePaymentAccount, type PaymentAccount } from '../lib/payment';
import { EXPIRED_REASON, getPaymentAccount, notifyHostOfRequest, releaseExpiredHolds } from '../server/core';
import { bookingZones, formatInZone } from '../lib/when';

type Result = { success: true } | { success: false; error: string };

const refresh = () => { revalidatePath('/admin/payments'); revalidatePath('/consultations'); };

/* ── System bank account ───────────────────────────────────── */

export async function getPaymentAccountAdminAction(): Promise<PaymentAccount | null> {
  await requireAdmin();
  return getPaymentAccount();
}

export async function savePaymentAccountAction(input: PaymentAccount): Promise<Result & { account?: PaymentAccount }> {
  await requireAdmin();
  const parsed = parsePaymentAccount(input);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const value = parsed.account as unknown as Prisma.InputJsonValue;
  await db.siteConfig.upsert({ where: { key: PAYMENT_CONFIG_KEY }, update: { value }, create: { key: PAYMENT_CONFIG_KEY, value } });
  revalidatePath('/admin/payments');
  return { success: true, account: parsed.account };
}

/* ── Payments queue ────────────────────────────────────────── */

export type AdminPaymentRow = {
  id: string;
  code: string | null;
  amount: number;
  status: string;
  startAt: string;
  createdAt: string;
  reportedAt: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  holdUntil: string | null;
  note: string | null;
  guest: { name: string; email: string | null };
  host: { name: string };
};

export type PaymentQueue = 'awaiting' | 'refund' | 'all';

/**
 * awaiting: holds waiting for the transfer (reported first) · refund: paid but declined/cancelled and
 * not refunded yet · all: every paid-flow booking, newest first. `q` matches the payment code or guest.
 */
export async function getAdminPaymentsAction({ queue, q }: { queue: PaymentQueue; q?: string }) {
  await requireAdmin();
  await releaseExpiredHolds();
  const search = q?.trim();
  const base: Prisma.ConsultationWhereInput = {
    price: { gt: 0 },
    ...(search && {
      OR: [
        { paymentCode: { contains: search.toUpperCase() } },
        { guest: { name: { contains: search, mode: 'insensitive' } } },
        { guest: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };
  // Guest reported a transfer after the hold had expired: still needs matching (then refunding).
  const lateReport: Prisma.ConsultationWhereInput = { status: 'CANCELLED', paymentReportedAt: { not: null }, paidAt: null, declineReason: EXPIRED_REASON };
  const refundWhere: Prisma.ConsultationWhereInput = { paidAt: { not: null }, refundedAt: null, status: { in: ['DECLINED', 'CANCELLED'] } };
  const where: Prisma.ConsultationWhereInput =
    queue === 'awaiting' ? { AND: [base, { OR: [{ status: 'AWAITING_PAYMENT' }, lateReport] }] } : queue === 'refund' ? { AND: [base, refundWhere] } : base;

  const [rows, awaiting, reported, refund] = await Promise.all([
    db.consultation.findMany({
      where,
      orderBy: queue === 'awaiting' ? [{ paymentReportedAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }] : { createdAt: 'desc' },
      take: 100,
      include: { guest: { select: { name: true, email: true } }, host: { select: { name: true } } },
    }),
    db.consultation.count({ where: { price: { gt: 0 }, OR: [{ status: 'AWAITING_PAYMENT' }, lateReport] } }),
    db.consultation.count({ where: { price: { gt: 0 }, status: 'AWAITING_PAYMENT', paymentReportedAt: { not: null } } }),
    db.consultation.count({ where: { price: { gt: 0 }, ...refundWhere } }),
  ]);

  return {
    counts: { awaiting, reported, refund },
    rows: rows.map((r): AdminPaymentRow => ({
      id: r.id,
      code: r.paymentCode,
      amount: r.price,
      status: r.status,
      startAt: r.startAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      reportedAt: r.paymentReportedAt?.toISOString() ?? null,
      paidAt: r.paidAt?.toISOString() ?? null,
      refundedAt: r.refundedAt?.toISOString() ?? null,
      holdUntil: r.status === 'AWAITING_PAYMENT' && !r.paymentReportedAt ? new Date(r.createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60_000).toISOString() : null,
      note: r.declineReason,
      guest: { name: r.guest.name, email: r.guest.email },
      host: { name: r.host.name },
    })),
  };
}

async function loadPayment(id: string) {
  return db.consultation.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, email: true, consultationSettings: { select: { timezone: true } } } },
      guest: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * The transfer arrived. A live hold moves on to the host (PENDING). A hold that already expired or was
 * cancelled is only recorded as paid, which puts it in the refund queue.
 */
export async function confirmPaymentAction(id: string): Promise<Result> {
  const admin = await requireAdmin();
  const c = await loadPayment(id);
  if (!c || c.price <= 0) return { success: false, error: 'Không tìm thấy giao dịch' };
  if (c.paidAt) return { success: false, error: 'Giao dịch này đã được xác nhận' };
  const now = new Date();

  if (c.status === 'AWAITING_PAYMENT' && c.startAt > now) {
    const updated = await db.consultation.updateMany({
      where: { id, status: 'AWAITING_PAYMENT', paidAt: null },
      data: { status: 'PENDING', paidAt: now, paymentConfirmedById: admin.id },
    });
    if (updated.count === 0) return { success: false, error: 'Giao dịch đã thay đổi, hãy tải lại' };
    const zones = bookingZones(c);
    const when = formatInZone(c.startAt, zones.guest, zones.host);
    void notifyHostOfRequest({ host: c.host, guestName: c.guest.name, startAt: c.startAt, topic: c.topic, timezone: zones.host, guestTimezone: c.guestTimezone });
    void createNotificationAction(c.guestId, 'CONSULTATION_PAID', 'Đã nhận thanh toán', { message: `Yêu cầu đã được gửi tới ${c.host.name} · ${when}`, link: '/consultations' });
    if (c.guest.email) void sendConsultationEmail({
      to: c.guest.email, subject: `Đã nhận thanh toán ${c.paymentCode}`, heading: 'Đã nhận thanh toán',
      lines: [`Chúng tôi đã nhận ${c.price.toLocaleString('vi-VN')}đ cho buổi tư vấn với ${c.host.name} vào ${when}.`, 'Yêu cầu đã được gửi tới tác giả. Bạn sẽ nhận thông báo khi tác giả xác nhận.'],
      ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
    });
    refresh();
    return { success: true };
  }

  // Too late to book (expired / cancelled / start passed): record the money so it gets refunded.
  await db.consultation.update({
    where: { id },
    data: {
      paidAt: now, paymentConfirmedById: admin.id,
      ...(c.status === 'AWAITING_PAYMENT' && { status: 'CANCELLED', declineReason: 'Quá giờ hẹn trước khi xác nhận thanh toán' }),
    },
  });
  refresh();
  return { success: true };
}

/** No matching transfer: release the hold. */
export async function rejectPaymentAction(id: string, reason?: string): Promise<Result> {
  await requireAdmin();
  const note = (reason ?? '').trim().slice(0, 300) || 'Không tìm thấy giao dịch chuyển khoản';
  const c = await loadPayment(id);
  if (!c) return { success: false, error: 'Không tìm thấy giao dịch' };
  const updated = await db.consultation.updateMany({
    where: { id, paidAt: null, OR: [{ status: 'AWAITING_PAYMENT' }, { status: 'CANCELLED', paymentReportedAt: { not: null }, declineReason: EXPIRED_REASON }] },
    data: { status: 'CANCELLED', declineReason: note },
  });
  if (updated.count === 0) return { success: false, error: 'Giao dịch này không còn chờ thanh toán' };
  void createNotificationAction(c.guestId, 'CONSULTATION_CANCELLED', 'Chưa nhận được thanh toán', { message: note, link: '/consultations' });
  if (c.guest.email) void sendConsultationEmail({
    to: c.guest.email, subject: `Lịch tư vấn ${c.paymentCode} đã bị hủy`, heading: 'Chưa nhận được thanh toán',
    lines: [`Chúng tôi chưa tìm thấy khoản chuyển với nội dung ${c.paymentCode}, nên chỗ giữ đã được hủy.`, `Lý do: ${note}`, 'Nếu bạn đã chuyển tiền, hãy trả lời email này kèm ảnh chụp giao dịch.'],
    ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
  });
  refresh();
  return { success: true };
}

export async function markRefundedAction(id: string): Promise<Result> {
  await requireAdmin();
  const c = await loadPayment(id);
  if (!c) return { success: false, error: 'Không tìm thấy giao dịch' };
  const updated = await db.consultation.updateMany({
    where: { id, paidAt: { not: null }, refundedAt: null, status: { in: ['DECLINED', 'CANCELLED'] } },
    data: { refundedAt: new Date() },
  });
  if (updated.count === 0) return { success: false, error: 'Giao dịch này không cần hoàn tiền' };
  void createNotificationAction(c.guestId, 'SYSTEM', 'Đã hoàn tiền buổi tư vấn', { message: `${c.price.toLocaleString('vi-VN')}đ · ${c.paymentCode}`, link: '/consultations' });
  if (c.guest.email) void sendConsultationEmail({
    to: c.guest.email, subject: `Đã hoàn tiền ${c.paymentCode}`, heading: 'Đã hoàn tiền',
    lines: [`Chúng tôi đã hoàn ${c.price.toLocaleString('vi-VN')}đ cho buổi tư vấn với ${c.host.name} (mã ${c.paymentCode}) về tài khoản bạn đã dùng để chuyển.`],
    ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
  });
  refresh();
  return { success: true };
}
