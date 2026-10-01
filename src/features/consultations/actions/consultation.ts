'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma, type ConsultationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createNotificationAction } from '@/lib/notifications';
import { sendConsultationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import {
  DURATION_OPTIONS, dateKeyInZone, findBookableSlot, generateSlotStates, minutesInZone, isValidTimeZone, parseDateOverrides, parseWeeklySlots, type DateOverrides, type WeeklySlot,
} from '../lib/slots';

const MAX_PENDING_PER_GUEST = 2;
const TOPIC_MIN = 10;
const TOPIC_MAX = 1000;
const ACTIVE: ConsultationStatus[] = ['PENDING', 'CONFIRMED'];

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, username: true, role: true, canWrite: true, status: true },
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

const canHost = (u: { role: string; canWrite: boolean } | null) => !!u && (u.role === 'ADMIN' || u.canWrite);

function formatInZone(date: Date, tz: string) {
  const text = new Intl.DateTimeFormat('vi-VN', {
    timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  return `${text} (${tz})`;
}

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
    },
  };
}

export async function saveConsultationSettingsAction(input: ConsultationSettingsInput): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  if (!canHost(user)) return { success: false, error: 'Chỉ tác giả mới có thể nhận tư vấn' };

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
    select: { enabled: true, intro: true, durationMin: true, timezone: true, user: { select: { role: true, canWrite: true, status: true } } },
  });
  if (!settings?.enabled || settings.user.status !== 'ACTIVE' || !canHost(settings.user)) return null;
  return { intro: settings.intro, durationMin: settings.durationMin, timezone: settings.timezone };
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
    include: { user: { select: { role: true, canWrite: true, status: true } } },
  });
  if (!settings?.enabled || settings.user.status !== 'ACTIVE' || !canHost(settings.user)) return [];
  const now = new Date();
  const busy = await hostBusyRanges(hostId, now);
  return generateSlotStates({ ...readSettings(settings), now, busy }).map(s => ({ start: s.start.toISOString(), taken: s.taken, durationMin: s.durationMin }));
}

export async function requestConsultationAction(input: { hostId: string; startAt: string; topic: string }): Promise<Result<{ id: string }>> {
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
    include: { user: { select: { id: true, name: true, email: true, username: true, role: true, canWrite: true, status: true } } },
  });
  const host = settings?.user;
  if (!settings?.enabled || !host || host.status !== 'ACTIVE' || !canHost(host)) return { success: false, error: 'Tác giả hiện không nhận tư vấn' };

  const pending = await db.consultation.count({ where: { guestId: guest.id, status: 'PENDING', startAt: { gt: new Date() } } });
  if (pending >= MAX_PENDING_PER_GUEST) return { success: false, error: `Bạn đang có ${pending} yêu cầu chờ xác nhận. Hãy chờ phản hồi trước khi đặt thêm.` };

  const now = new Date();
  const busy = await hostBusyRanges(host.id, now);
  const cfg = readSettings(settings);
  const slot = findBookableSlot(startAt, { ...cfg, now, busy });
  if (!slot) return { success: false, error: 'Khung giờ này không còn trống. Hãy chọn giờ khác.' };

  let id: string;
  try {
    const created = await db.consultation.create({
      // The window's link is kept for the host's accept form; guests only see it once confirmed.
      data: { hostId: host.id, guestId: guest.id, startAt, endAt: new Date(startAt.getTime() + slot.durationMin * 60_000), topic, meetingUrl: slot.meetingUrl ?? null },
      select: { id: true },
    });
    id = created.id;
  } catch (err) {
    // Partial unique index: someone else grabbed this slot a moment ago.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: 'Khung giờ này vừa có người đặt. Hãy chọn giờ khác.' };
    }
    throw err;
  }

  const when = formatInZone(startAt, cfg.timezone);
  void createNotificationAction(host.id, 'CONSULTATION_REQUESTED', `${guest.name} muốn đặt lịch tư vấn`, { message: when, link: '/consultations' });
  if (host.email) {
    void sendConsultationEmail({
      to: host.email,
      subject: `Yêu cầu tư vấn mới từ ${guest.name}`,
      heading: 'Bạn có một yêu cầu tư vấn mới',
      lines: [`${guest.name} muốn trò chuyện với bạn vào ${when}.`, `Câu hỏi: ${topic}`],
      ctaUrl: `${SITE_URL}/consultations`,
      ctaLabel: 'Xem và phản hồi',
    });
  }
  revalidatePath('/consultations');
  return { success: true, id };
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

  const when = formatInZone(c.startAt, c.host.consultationSettings?.timezone ?? 'Asia/Ho_Chi_Minh');
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
      lines: [`${c.host.name} không thể nhận buổi trò chuyện vào ${when}.`, ...(declineReason ? [`Lời nhắn: ${declineReason}`] : []), 'Bạn có thể chọn một khung giờ khác.'],
      ctaUrl: `${SITE_URL}/consultations`, ctaLabel: 'Xem lịch hẹn',
    });
  }
  revalidatePath('/consultations');
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

  const when = formatInZone(c.startAt, c.host.consultationSettings?.timezone ?? 'Asia/Ho_Chi_Minh');
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
  if (c.startAt <= new Date()) return { success: false, error: 'Lịch hẹn đã bắt đầu, không thể hủy' };

  const updated = await db.consultation.updateMany({ where: { id, status: { in: ACTIVE } }, data: { status: 'CANCELLED', cancelledById: user.id } });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn này không thể hủy' };

  const other = c.hostId === user.id ? c.guest : c.host;
  const when = formatInZone(c.startAt, c.host.consultationSettings?.timezone ?? 'Asia/Ho_Chi_Minh');
  void createNotificationAction(other.id, 'CONSULTATION_CANCELLED', `${user.name} đã hủy lịch tư vấn`, { message: when, link: '/consultations' });
  if (other.email) void sendConsultationEmail({
    to: other.email, subject: `${user.name} đã hủy lịch tư vấn`, heading: 'Lịch tư vấn đã bị hủy',
    lines: [`${user.name} đã hủy buổi trò chuyện vào ${when}.`],
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
};

export async function getMyConsultationsAction(): Promise<ConsultationListItem[]> {
  const user = await currentUser();
  if (!user) return [];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const rows = await db.consultation.findMany({
    where: { OR: [{ hostId: user.id }, { guestId: user.id }], startAt: { gte: since } },
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
    };
  });
}
