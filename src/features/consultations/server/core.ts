import 'server-only';

import { db } from '@/lib/db';
import { createNotificationAction } from '@/lib/notifications';
import { sendConsultationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import { PAYMENT_CONFIG_KEY, PAYMENT_HOLD_MINUTES, parsePaymentAccount, type PaymentAccount } from '../lib/payment';

/* Server-only helpers shared by the consultation and admin payment actions (not callable from the client). */

export const EXPIRED_REASON = 'Quá hạn thanh toán';

export function formatInZone(date: Date, tz: string) {
  const text = new Intl.DateTimeFormat('vi-VN', {
    timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  return `${text} (${tz})`;
}

/** Release holds whose guest never reported a transfer in time. Cheap enough to run on every read. */
export async function releaseExpiredHolds() {
  await db.consultation.updateMany({
    where: { status: 'AWAITING_PAYMENT', paymentReportedAt: null, createdAt: { lt: new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60_000) } },
    data: { status: 'CANCELLED', declineReason: EXPIRED_REASON },
  });
}

/** The system bank account guests transfer to, or null when an admin hasn't set it up. */
export async function getPaymentAccount(): Promise<PaymentAccount | null> {
  const row = await db.siteConfig.findUnique({ where: { key: PAYMENT_CONFIG_KEY } }).catch(() => null);
  const parsed = parsePaymentAccount(row?.value);
  return parsed.ok ? parsed.account : null;
}

/** "New request" notification + email to the host (on booking when free, after payment when paid). */
export async function notifyHostOfRequest({ host, guestName, startAt, topic, timezone }: {
  host: { id: string; email: string | null }; guestName: string; startAt: Date; topic: string; timezone: string;
}) {
  const when = formatInZone(startAt, timezone);
  await createNotificationAction(host.id, 'CONSULTATION_REQUESTED', `${guestName} muốn đặt lịch tư vấn`, { message: when, link: '/consultations' });
  if (host.email) {
    await sendConsultationEmail({
      to: host.email,
      subject: `Yêu cầu tư vấn mới từ ${guestName}`,
      heading: 'Bạn có một yêu cầu tư vấn mới',
      lines: [`${guestName} muốn trò chuyện với bạn vào ${when}.`, `Câu hỏi: ${topic}`],
      ctaUrl: `${SITE_URL}/consultations`,
      ctaLabel: 'Xem và phản hồi',
    });
  }
}
