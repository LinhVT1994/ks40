'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { randomInt } from 'node:crypto';
import { Prisma, type ConsultationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createNotificationAction } from '@/lib/notifications';
import { sendConsultationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import {
  DURATION_OPTIONS, dateKeyInZone, findBookableSlot, generateSlotStates, minutesInZone, isValidTimeZone, parseDateOverrides, parseWeeklySlots, type DateOverrides, type WeeklySlot,
} from '../lib/slots';
import { PAYMENT_HOLD_MINUTES, PRICE_MAX, generatePaymentCode, type PaymentAccount } from '../lib/payment';
import { EXPIRED_REASON, getPaymentAccount, notifyHostOfRequest, releaseExpiredHolds } from '../server/core';
import { bookingZones, cleanTimeZone, formatInZone } from '../lib/when';

const MAX_PENDING_PER_GUEST = 2;
const TOPIC_MIN = 10;
const TOPIC_MAX = 1000;
/** Statuses that hold the host's slot (matches the partial unique index). */
const ACTIVE: ConsultationStatus[] = ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED'];
const PRICE_MIN = 10_000;

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, username: true, role: true, canConsult: true, status: true },
  });
}

/** Trimmed https URL, '' for empty, or null when invalid. */
function normalizeMeetingUrl(raw: string | undefined | null): string | null {
  const value = (raw ?? '').trim();
  if (!value) return '';
  if (value.length > 500) return null;
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

// Admins decide who may host (User.canConsult); existing bookings survive a revoke.
const canHost = (u: { canConsult: boolean } | null) => !!u && u.canConsult;

function readSettings(raw: { weeklySlots: Prisma.JsonValue; dateOverrides: Prisma.JsonValue; timezone: string; durationMin: number }) {
  const parsed = parseWeeklySlots(raw.weeklySlots);
  return { weeklySlots: parsed.ok ? parsed.slots : [], overrides: upcomingOverrides(raw.dateOverrides, raw.timezone), timezone: raw.timezone, durationMin: raw.durationMin };
}

/** Stored per-date overrides minus those already in the past (host zone). */
function upcomingOverrides(raw: Prisma.JsonValue, tz: string): DateOverrides {
  const parsed = parseDateOverrides(raw ?? {}, dateKeyInZone(new Date(), tz));
  return parsed.ok ? parsed.overrides : {};
}

async function hostBusyRanges(hostId: string, from: Date) {
  await releaseExpiredHolds();
  return db.consultation.findMany({
    where: { hostId, status: { in: ACTIVE }, endAt: { gt: from } },
    select: { startAt: true, endAt: true },
  });
}

/* ── Host settings ─────────────────────────────────────────── */

export type ConsultationSettingsInput = {
  enabled: boolean;
  intro: string;
  durationMin: number;
  meetingUrl: string;
  timezone: string;
  weeklySlots: WeeklySlot[];
  dateOverrides: DateOverrides;
  /** VND per session; 0 = free. */
  price: number;
};

export async function getMyConsultationSettingsAction() {
  const user = await currentUser();
  if (!user) return null;
  const settings = await db.consultationSettings.findUnique({ where: { userId: user.id } });
  // Upcoming active bookings as host-zone { date: [30-min cells] }, so the calendar can show which slots are taken.
  const upcoming = settings ? await db.consultation.findMany({
    where: { hostId: user.id, status: { in: ACTIVE }, endAt: { gt: new Date() } },
    select: { startAt: true, endAt: true },
  }) : [];
  const bookedCells: Record<string, number[]> = {};
  for (const c of upcoming) {
    const tz = settings!.timezone;
    for (let t = c.startAt.getTime(); t < c.endAt.getTime(); t += 30 * 60_000) {
      const at = new Date(t);
      const key = dateKeyInZone(at, tz);
      const minute = Math.floor(minutesInZone(at, tz) / 30) * 30;
      const cells = (bookedCells[key] ??= []);
      if (!cells.includes(minute)) cells.push(minute);
    }
  }
  return {
    canHost: canHost(user),
    bookedCells,
    settings: settings && {
      enabled: settings.enabled,
      intro: settings.intro ?? '',
      durationMin: settings.durationMin,
      meetingUrl: settings.meetingUrl ?? '',
      timezone: settings.timezone,
      weeklySlots: readSettings(settings).weeklySlots,
      dateOverrides: upcomingOverrides(settings.dateOverrides, settings.timezone),
      price: settings.price,
    },
    paymentReady: !!(await getPaymentAccount()),
  };
}

export async function saveConsultationSettingsAction(input: ConsultationSettingsInput): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  if (!canHost(user)) return { success: false, error: 'Tài khoản của bạn chưa được admin cấp quyền nhận tư vấn' };

  const intro = (input.intro ?? '').trim();
  if (intro.length > 500) return { success: false, error: 'Lời giới thiệu tối đa 500 ký tự' };
  if (!DURATION_OPTIONS.includes(input.durationMin as (typeof DURATION_OPTIONS)[number])) return { success: false, error: 'Thời lượng không hợp lệ' };
  if (!isValidTimeZone(input.timezone)) return { success: false, error: 'Múi giờ không hợp lệ' };

  const slots = parseWeeklySlots(input.weeklySlots);
  if (!slots.ok) return { success: false, error: slots.error };
  const overrides = parseDateOverrides(input.dateOverrides ?? {}, dateKeyInZone(new Date(), input.timezone));
  if (!overrides.ok) return { success: false, error: overrides.error };
  // Drop repeating windows whose period has already ended.
  const today = dateKeyInZone(new Date(), input.timezone);
  slots.slots = slots.slots.filter(w => !w.until || w.until >= today);

  // Default link is optional: hosts who use a fresh link per session add it when accepting.
  const meetingUrl = normalizeMeetingUrl(input.meetingUrl);
  if (meetingUrl === null) return { success: false, error: 'Link họp phải là đường dẫn https:// hợp lệ' };
  const price = Math.round(Number(input.price ?? 0));
  if (!Number.isFinite(price) || price < 0 || price > PRICE_MAX) return { success: false, error: 'Giá không hợp lệ' };
  if (price > 0 && price < PRICE_MIN) return { success: false, error: `Giá tối thiểu ${PRICE_MIN.toLocaleString('vi-VN')}đ (hoặc 0 để miễn phí)` };
  if (price > 0 && !(await getPaymentAccount())) return { success: false, error: 'Hệ thống chưa có tài khoản nhận tiền nên chưa thể đặt giá. Hãy liên hệ quản trị viên.' };
  const anyDateHours = overrides.ok && Object.values(overrides.overrides).some(w => w.length > 0);
  if (input.enabled && slots.slots.length === 0 && !anyDateHours) return { success: false, error: 'Cần ít nhất một khung giờ rảnh để bật nhận tư vấn' };

  const data = {
    enabled: !!input.enabled,
    intro: intro || null,
    durationMin: input.durationMin,
    meetingUrl: meetingUrl || null,
    timezone: input.timezone,
    weeklySlots: slots.slots as unknown as Prisma.InputJsonValue,
    dateOverrides: overrides.overrides as unknown as Prisma.InputJsonValue,
    price,
  };
  await db.consultationSettings.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
  revalidatePath('/consultations');
  revalidatePath(`/@${user.username || user.id}`);
  return { success: true };
}

/* ── Public booking ────────────────────────────────────────── */

/** Public info shown on a profile; null when the host isn't accepting bookings. */
export async function getPublicConsultationInfoAction(hostId: string) {
  const settings = await db.consultationSettings.findUnique({
    where: { userId: hostId },
    select: { enabled: true, intro: true, durationMin: true, timezone: true, price: true, user: { select: { role: true, canConsult: true, status: true } } },
  });
  if (!settings?.enabled || settings.user.status !== 'ACTIVE' || !canHost(settings.user)) return null;
  return { intro: settings.intro, durationMin: settings.durationMin, timezone: settings.timezone, price: settings.price };
}

export type SlotOption = { start: string; taken: boolean; durationMin: number };

/**
 * Slots for the next two weeks as ISO start times. Taken slots are included (flagged) so the
 * booking calendar can show them greyed out; no details about who booked them are exposed.
 */
export async function getAvailableSlotsAction(hostId: string): Promise<SlotOption[]> {
  if (typeof hostId !== 'string' || !hostId) return [];
  const settings = await db.consultationSettings.findUnique({
    where: { userId: hostId },
    include: { user: { select: { role: true, canConsult: true, status: true } } },
  });
  if (!settings?.enabled || settings.user.status !== 'ACTIVE' || !canHost(settings.user)) return [];
  const now = new Date();
  const busy = await hostBusyRanges(hostId, now);
  return generateSlotStates({ ...readSettings(settings), now, busy }).map(s => ({ start: s.start.toISOString(), taken: s.taken, durationMin: s.durationMin }));
}

export type PaymentInstructions = { code: string; amount: number; account: PaymentAccount; holdUntil: string | null; reported: boolean };

export async function requestConsultationAction(input: { hostId: string; startAt: string; topic: string; timezone?: string }): Promise<Result<{ id: string; payment: PaymentInstructions | null }>> {
  const guest = await currentUser();
  if (!guest || guest.status !== 'ACTIVE') return { success: false, error: 'Bạn cần đăng nhập để đặt lịch' };
  if (guest.id === input.hostId) return { success: false, error: 'Bạn không thể tự đặt lịch với chính mình' };

  const topic = (input.topic ?? '').trim();
  if (topic.length < TOPIC_MIN) return { success: false, error: `Hãy mô tả câu hỏi của bạn (ít nhất ${TOPIC_MIN} ký tự)` };
  if (topic.length > TOPIC_MAX) return { success: false, error: `Nội dung tối đa ${TOPIC_MAX} ký tự` };

  const startAt = new Date(input.startAt);
  if (Number.isNaN(startAt.getTime())) return { success: false, error: 'Thời gian không hợp lệ' };

  const settings = await db.consultationSettings.findUnique({
    where: { userId: input.hostId },
    include: { user: { select: { id: true, name: true, email: true, username: true, role: true, canConsult: true, status: true } } },
  });
  const host = settings?.user;
  if (!settings?.enabled || !host || host.status !== 'ACTIVE' || !canHost(host)) return { success: false, error: 'Tác giả hiện không nhận tư vấn' };

  await releaseExpiredHolds();
  const pending = await db.consultation.count({ where: { guestId: guest.id, status: { in: ['AWAITING_PAYMENT', 'PENDING'] }, startAt: { gt: new Date() } } });
  if (pending >= MAX_PENDING_PER_GUEST) return { success: false, error: `Bạn đang có ${pending} yêu cầu chờ xác nhận. Hãy chờ phản hồi trước khi đặt thêm.` };

  const now = new Date();
  const busy = await hostBusyRanges(host.id, now);
  const cfg = readSettings(settings);
  const slot = findBookableSlot(startAt, { ...cfg, now, busy });
  if (!slot) return { success: false, error: 'Khung giờ này không còn trống. Hãy chọn giờ khác.' };

  // Paid sessions hold the slot until the transfer is confirmed; the host is only asked after that.
  const price = settings.price;
  const account = price > 0 ? await getPaymentAccount() : null;
  if (price > 0 && !account) return { success: false, error: 'Hệ thống tạm thời chưa nhận thanh toán. Hãy thử lại sau.' };

  const guestTimezone = cleanTimeZone(input.timezone);
  let created: { id: string; paymentCode: string | null; createdAt: Date } | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    try {
      created = await db.consultation.create({
        // The window's link is kept for the host's accept form; guests only see it once confirmed.
        data: {
          hostId: host.id, guestId: guest.id, guestTimezone, startAt, endAt: new Date(startAt.getTime() + slot.durationMin * 60_000), topic, meetingUrl: slot.meetingUrl ?? null,
          price, ...(price > 0 && { status: 'AWAITING_PAYMENT', paymentCode: generatePaymentCode(randomInt) }),
        },
        select: { id: true, paymentCode: true, createdAt: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Payment code collision (very rare): try a new code. Otherwise someone grabbed the slot a moment ago.
        if (String(err.meta?.target ?? '').includes('paymentCode') || JSON.stringify(err.meta ?? {}).includes('paymentCode')) continue;
        return { success: false, error: 'Khung giờ này vừa có người đặt. Hãy chọn giờ khác.' };
      }
      throw err;
    }
  }
  if (!created) return { success: false, error: 'Không tạo được mã thanh toán, hãy thử lại' };

  if (price === 0) void notifyHostOfRequest({ host, guestName: guest.name, startAt, topic, timezone: cfg.timezone, guestTimezone });
  revalidatePath('/consultations');
  return {
    success: true,
    id: created.id,
    payment: account && created.paymentCode ? {
      code: created.paymentCode, amount: price, account, reported: false,
      holdUntil: new Date(created.createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60_000).toISOString(),
    } : null,
  };
}

/* ── Guest payment ─────────────────────────────────────────── */

/** Transfer details for one of the guest's held bookings (to reopen the QR later). */
export async function getPaymentInstructionsAction(id: string): Promise<Result<{ payment: PaymentInstructions }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  await releaseExpiredHolds();
  const c = await db.consultation.findUnique({ where: { id }, select: { guestId: true, status: true, price: true, paymentCode: true, paymentReportedAt: true, createdAt: true } });
  if (!c || c.guestId !== user.id) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (c.status !== 'AWAITING_PAYMENT' || !c.paymentCode) return { success: false, error: 'Lịch hẹn này không còn chờ thanh toán' };
  const account = await getPaymentAccount();
  if (!account) return { success: false, error: 'Hệ thống tạm thời chưa nhận thanh toán' };
  return {
    success: true,
    payment: {
      code: c.paymentCode, amount: c.price, account, reported: !!c.paymentReportedAt,
      holdUntil: c.paymentReportedAt ? null : new Date(c.createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60_000).toISOString(),
    },
  };
}

/**
 * Guest says they've transferred: the hold no longer expires and admins are asked to check. A report on
 * a hold that already expired is still recorded, so an admin can match the money and refund it.
 */
export async function reportPaymentAction(id: string): Promise<Result<{ late: boolean }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  await releaseExpiredHolds();
  const c = await db.consultation.findUnique({ where: { id }, select: { guestId: true, status: true, paymentCode: true, price: true, paymentReportedAt: true, paidAt: true, declineReason: true } });
  if (!c || c.guestId !== user.id || !c.paymentCode) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (c.paymentReportedAt) return { success: true, late: c.status !== 'AWAITING_PAYMENT' };
  const late = c.status === 'CANCELLED' && c.declineReason === EXPIRED_REASON && !c.paidAt;
  if (c.status !== 'AWAITING_PAYMENT' && !late) return { success: false, error: 'Lịch hẹn này không còn chờ thanh toán' };

  const updated = await db.consultation.updateMany({ where: { id, status: c.status, paymentReportedAt: null }, data: { paymentReportedAt: new Date() } });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn vừa thay đổi, hãy tải lại trang' };

  const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' }, select: { id: true } });
  for (const a of admins) {
    void createNotificationAction(a.id, 'CONSULTATION_PAYMENT_REPORTED', `${user.name} báo đã chuyển khoản${late ? ' (sau khi hết giờ giữ chỗ)' : ''}`, {
      message: `${c.paymentCode} · ${c.price.toLocaleString('vi-VN')}đ`, link: '/admin/payments',
    });
  }
  revalidatePath('/consultations');
  revalidatePath('/admin/payments');
  return { success: true, late };
}

/* ── Responding & cancelling ───────────────────────────────── */

async function loadForParticipant(id: string) {
  return db.consultation.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, email: true, consultationSettings: { select: { timezone: true, meetingUrl: true } } } },
      guest: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Accept or decline a pending request. On accept, `meetingUrl` is this session's link; when empty the
 * host's default link is used, and one of the two is required.
 */
export async function respondConsultationAction(id: string, decision: 'accept' | 'decline', reason?: string, meetingUrl?: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  const c = await loadForParticipant(id);
  if (!c || c.hostId !== user.id) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (c.status !== 'PENDING') return { success: false, error: 'Lịch hẹn này đã được xử lý' };
  if (decision === 'accept' && c.startAt <= new Date()) return { success: false, error: 'Đã quá giờ hẹn, không thể chấp nhận' };

  let link: string | null = null;
  if (decision === 'accept') {
    const given = normalizeMeetingUrl(meetingUrl);
    if (given === null) return { success: false, error: 'Link họp phải là đường dẫn https:// hợp lệ' };
    link = given || c.meetingUrl || c.host.consultationSettings?.meetingUrl || null;
    if (!link) return { success: false, error: 'Hãy nhập link Meet/Zoom cho buổi này' };
  }

  const declineReason = decision === 'decline' ? (reason ?? '').trim().slice(0, 300) || null : null;
  // Guard against double-processing with a conditional update.
  const updated = await db.consultation.updateMany({
    where: { id, status: 'PENDING' },
    data: decision === 'accept' ? { status: 'CONFIRMED', meetingUrl: link } : { status: 'DECLINED', declineReason },
  });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn này đã được xử lý' };

  const zones = bookingZones(c);
  const when = formatInZone(c.startAt, zones.guest, zones.host);
  if (decision === 'accept') {
    void createNotificationAction(c.guestId, 'CONSULTATION_CONFIRMED', `${c.host.name} đã xác nhận lịch tư vấn`, { message: when, link: '/consultations' });
    if (c.guest.email) void sendConsultationEmail({
      to: c.guest.email, subject: `Lịch tư vấn với ${c.host.name} đã được xác nhận`, heading: 'Lịch tư vấn đã được xác nhận 🎉',
      lines: [`${c.host.name} đã xác nhận buổi trò chuyện vào ${when}.`, `Link họp: ${link}`, 'File lịch (.ics) có trong trang Lịch hẹn của bạn.'],
      ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
    });
  } else {
    void createNotificationAction(c.guestId, 'CONSULTATION_DECLINED', `${c.host.name} không thể nhận lịch tư vấn`, { message: declineReason ?? when, link: '/consultations' });
    if (c.guest.email) void sendConsultationEmail({
      to: c.guest.email, subject: `${c.host.name} không thể nhận lịch tư vấn`, heading: 'Lịch tư vấn chưa thể diễn ra',
      lines: [`${c.host.name} không thể nhận buổi trò chuyện vào ${when}.`, ...(declineReason ? [`Lời nhắn: ${declineReason}`] : []), ...(c.paidAt ? ['Khoản thanh toán của bạn sẽ được hoàn lại.'] : []), 'Bạn có thể chọn một khung giờ khác.'],
      ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
    });
  }
  revalidatePath('/consultations');
  revalidatePath('/admin/payments');
  return { success: true };
}

/** Host changes the meeting link of a confirmed, upcoming booking; the guest is notified. */
export async function updateConsultationLinkAction(id: string, meetingUrl: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  const link = normalizeMeetingUrl(meetingUrl);
  if (!link) return { success: false, error: 'Link họp phải là đường dẫn https:// hợp lệ' };
  const c = await loadForParticipant(id);
  if (!c || c.hostId !== user.id) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (c.status !== 'CONFIRMED' || c.endAt <= new Date()) return { success: false, error: 'Chỉ sửa được link của lịch đã xác nhận và chưa diễn ra' };
  if (link === c.meetingUrl) return { success: true };

  const updated = await db.consultation.updateMany({ where: { id, status: 'CONFIRMED' }, data: { meetingUrl: link } });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn này đã thay đổi, hãy tải lại trang' };

  const zones = bookingZones(c);
  const when = formatInZone(c.startAt, zones.guest, zones.host);
  void createNotificationAction(c.guestId, 'CONSULTATION_CONFIRMED', `${c.host.name} đã cập nhật link họp`, { message: when, link: '/consultations' });
  if (c.guest.email) void sendConsultationEmail({
    to: c.guest.email, subject: `Link họp mới cho buổi tư vấn với ${c.host.name}`, heading: 'Link họp đã được cập nhật',
    lines: [`Buổi trò chuyện vào ${when} có link họp mới:`, link],
    ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
  });
  revalidatePath('/consultations');
  return { success: true };
}

export async function cancelConsultationAction(id: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  const c = await loadForParticipant(id);
  if (!c || (c.hostId !== user.id && c.guestId !== user.id)) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (!ACTIVE.includes(c.status)) return { success: false, error: 'Lịch hẹn này không thể hủy' };
  if (c.status === 'AWAITING_PAYMENT' && c.guestId !== user.id) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  // Once a transfer is reported the admin decides (confirm or release), so the money is never lost track of.
  if (c.status === 'AWAITING_PAYMENT' && c.paymentReportedAt) return { success: false, error: 'Khoản chuyển của bạn đang được đối chiếu, hãy chờ quản trị viên xử lý' };
  if (c.startAt <= new Date()) return { success: false, error: 'Lịch hẹn đã bắt đầu, không thể hủy' };

  const updated = await db.consultation.updateMany({
    where: { id, status: c.status, ...(c.status === 'AWAITING_PAYMENT' && { paymentReportedAt: null }) },
    data: { status: 'CANCELLED', cancelledById: user.id },
  });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn này không thể hủy' };

  revalidatePath('/admin/payments');
  // An unpaid hold was never shown to the host, so there's no one to tell.
  if (c.status === 'AWAITING_PAYMENT') { revalidatePath('/consultations'); return { success: true }; }
  const other = c.hostId === user.id ? c.guest : c.host;
  const zones = bookingZones(c);
  const when = other.id === c.guestId ? formatInZone(c.startAt, zones.guest, zones.host) : formatInZone(c.startAt, zones.host, zones.guest);
  void createNotificationAction(other.id, 'CONSULTATION_CANCELLED', `${user.name} đã hủy lịch tư vấn`, { message: when, link: '/consultations' });
  if (other.email) void sendConsultationEmail({
    to: other.email, subject: `${user.name} đã hủy lịch tư vấn`, heading: 'Lịch tư vấn đã bị hủy',
    lines: [`${user.name} đã hủy buổi trò chuyện vào ${when}.`, ...(c.paidAt && other.id === c.guestId ? ['Khoản thanh toán của bạn sẽ được hoàn lại.'] : [])],
    ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
  });
  revalidatePath('/consultations');
  return { success: true };
}

/* ── Listing ───────────────────────────────────────────────── */

export type ConsultationListItem = {
  id: string;
  role: 'host' | 'guest';
  startAt: string;
  endAt: string;
  topic: string;
  status: ConsultationStatus;
  declineReason: string | null;
  cancelledByMe: boolean;
  /** Only revealed to both parties once confirmed. */
  meetingUrl: string | null;
  /** Host-only: link to prefill when accepting a pending request (from the booked window or the default). */
  suggestedMeetingUrl: string | null;
  other: { id: string; name: string; username: string | null; image: string | null };
  /** Host-only: the guest's zone at booking, to show their local time when it differs. */
  guestTimezone: string | null;
  /** VND paid/owed; 0 = free. */
  price: number;
  /** Guest-only while awaiting payment. */
  paymentCode: string | null;
  paymentReported: boolean;
  /** When an unreported hold is released. */
  holdUntil: string | null;
  paid: boolean;
  refunded: boolean;
};

export async function getMyConsultationsAction(): Promise<ConsultationListItem[]> {
  const user = await currentUser();
  if (!user) return [];
  await releaseExpiredHolds();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const rows = await db.consultation.findMany({
    // Hosts only see paid-flow bookings once the transfer has been confirmed.
    where: {
      startAt: { gte: since },
      OR: [{ guestId: user.id }, { hostId: user.id, OR: [{ price: 0 }, { paidAt: { not: null } }] }],
    },
    orderBy: { startAt: 'asc' },
    take: 200,
    include: {
      host: { select: { id: true, name: true, username: true, image: true, consultationSettings: { select: { meetingUrl: true } } } },
      guest: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  return rows.map(r => {
    const role = r.hostId === user.id ? 'host' : 'guest';
    const other = role === 'host' ? r.guest : r.host;
    return {
      id: r.id,
      role,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      topic: r.topic,
      status: r.status,
      declineReason: r.declineReason,
      cancelledByMe: r.cancelledById === user.id,
      // Per-booking link; older bookings fall back to the host's default.
      meetingUrl: r.status === 'CONFIRMED' ? r.meetingUrl ?? r.host.consultationSettings?.meetingUrl ?? null : null,
      suggestedMeetingUrl: role === 'host' && r.status === 'PENDING' ? r.meetingUrl ?? r.host.consultationSettings?.meetingUrl ?? null : null,
      other: { id: other.id, name: other.name, username: other.username, image: other.image },
      guestTimezone: role === 'host' ? r.guestTimezone : null,
      price: r.price,
      paymentCode: role === 'guest' && r.status === 'AWAITING_PAYMENT' ? r.paymentCode : null,
      paymentReported: !!r.paymentReportedAt,
      holdUntil: r.status === 'AWAITING_PAYMENT' && !r.paymentReportedAt ? new Date(r.createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60_000).toISOString() : null,
      paid: !!r.paidAt,
      refunded: !!r.refundedAt,
    };
  });
}
