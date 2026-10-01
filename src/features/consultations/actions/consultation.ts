'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma, type ConsultationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createNotificationAction } from '@/lib/notifications';
import { sendConsultationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import {
  DURATION_OPTIONS, generateSlots, isBookableSlot, isValidTimeZone, parseWeeklySlots, type WeeklySlot,
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

const canHost = (u: { role: string; canWrite: boolean } | null) => !!u && (u.role === 'ADMIN' || u.canWrite);

function formatInZone(date: Date, tz: string) {
  const text = new Intl.DateTimeFormat('vi-VN', {
    timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  return `${text} (${tz})`;
}

function readSettings(raw: { weeklySlots: Prisma.JsonValue; timezone: string; durationMin: number }) {
  const parsed = parseWeeklySlots(raw.weeklySlots);
  return { weeklySlots: parsed.ok ? parsed.slots : [], timezone: raw.timezone, durationMin: raw.durationMin };
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
};

export async function getMyConsultationSettingsAction() {
  const user = await currentUser();
  if (!user) return null;
  const settings = await db.consultationSettings.findUnique({ where: { userId: user.id } });
  return {
    canHost: canHost(user),
    settings: settings && {
      enabled: settings.enabled,
      intro: settings.intro ?? '',
      durationMin: settings.durationMin,
      meetingUrl: settings.meetingUrl ?? '',
      timezone: settings.timezone,
      weeklySlots: readSettings(settings).weeklySlots,
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

  const meetingUrl = (input.meetingUrl ?? '').trim();
  if (meetingUrl) {
    try {
      const url = new URL(meetingUrl);
      if (url.protocol !== 'https:') throw new Error();
    } catch {
      return { success: false, error: 'Link họp phải là đường dẫn https:// hợp lệ' };
    }
  }
  if (input.enabled && !meetingUrl) return { success: false, error: 'Cần có link Meet/Zoom để bật nhận tư vấn' };
  if (input.enabled && slots.slots.length === 0) return { success: false, error: 'Cần ít nhất một khung giờ rảnh để bật nhận tư vấn' };

  const data = {
    enabled: !!input.enabled,
    intro: intro || null,
    durationMin: input.durationMin,
    meetingUrl: meetingUrl || null,
    timezone: input.timezone,
    weeklySlots: slots.slots as unknown as Prisma.InputJsonValue,
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

/** Bookable UTC start times (ISO strings) for the next two weeks. */
export async function getAvailableSlotsAction(hostId: string): Promise<string[]> {
  if (typeof hostId !== 'string' || !hostId) return [];
  const settings = await db.consultationSettings.findUnique({
    where: { userId: hostId },
    include: { user: { select: { role: true, canWrite: true, status: true } } },
  });
  if (!settings?.enabled || settings.user.status !== 'ACTIVE' || !canHost(settings.user)) return [];
  const now = new Date();
  const busy = await hostBusyRanges(hostId, now);
  return generateSlots({ ...readSettings(settings), now, busy }).map(d => d.toISOString());
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
  if (!isBookableSlot(startAt, { ...cfg, now, busy })) return { success: false, error: 'Khung giờ này không còn trống. Hãy chọn giờ khác.' };

  let id: string;
  try {
    const created = await db.consultation.create({
      data: { hostId: host.id, guestId: guest.id, startAt, endAt: new Date(startAt.getTime() + cfg.durationMin * 60_000), topic },
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
      host: { select: { id: true, name: true, email: true, consultationSettings: { select: { timezone: true } } } },
      guest: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function respondConsultationAction(id: string, decision: 'accept' | 'decline', reason?: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'Bạn cần đăng nhập' };
  const c = await loadForParticipant(id);
  if (!c || c.hostId !== user.id) return { success: false, error: 'Không tìm thấy lịch hẹn' };
  if (c.status !== 'PENDING') return { success: false, error: 'Lịch hẹn này đã được xử lý' };
  if (decision === 'accept' && c.startAt <= new Date()) return { success: false, error: 'Đã quá giờ hẹn, không thể chấp nhận' };

  const declineReason = decision === 'decline' ? (reason ?? '').trim().slice(0, 300) || null : null;
  // Guard against double-processing with a conditional update.
  const updated = await db.consultation.updateMany({
    where: { id, status: 'PENDING' },
    data: decision === 'accept' ? { status: 'CONFIRMED' } : { status: 'DECLINED', declineReason },
  });
  if (updated.count === 0) return { success: false, error: 'Lịch hẹn này đã được xử lý' };

  const when = formatInZone(c.startAt, c.host.consultationSettings?.timezone ?? 'Asia/Ho_Chi_Minh');
  if (decision === 'accept') {
    void createNotificationAction(c.guestId, 'CONSULTATION_CONFIRMED', `${c.host.name} đã xác nhận lịch tư vấn`, { message: when, link: '/consultations' });
    if (c.guest.email) void sendConsultationEmail({
      to: c.guest.email, subject: `Lịch tư vấn với ${c.host.name} đã được xác nhận`, heading: 'Lịch tư vấn đã được xác nhận 🎉',
      lines: [`${c.host.name} đã xác nhận buổi trò chuyện vào ${when}.`, 'Link họp và file lịch (.ics) có trong trang Lịch hẹn của bạn.'],
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
      meetingUrl: r.status === 'CONFIRMED' ? r.host.consultationSettings?.meetingUrl ?? null : null,
      other: { id: other.id, name: other.name, username: other.username, image: other.image },
    };
  });
}
