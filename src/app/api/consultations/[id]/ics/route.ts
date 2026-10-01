import { auth } from '@/auth';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
// RFC 5545 text escaping; also strips CR so user text can't inject new properties.
const icsText = (s: string) => s.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Calendar file for a confirmed consultation. Only the host or guest may download it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return new Response(null, { status: 404 });

  const c = await db.consultation.findUnique({
    where: { id },
    include: {
      host: { select: { name: true, consultationSettings: { select: { meetingUrl: true } } } },
      guest: { select: { name: true } },
    },
  });
  if (!c || (c.hostId !== userId && c.guestId !== userId) || c.status !== 'CONFIRMED') return new Response(null, { status: 404 });

  const meetingUrl = c.host.consultationSettings?.meetingUrl ?? '';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lenote//Consultations//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:consultation-${c.id}@lenote.dev`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(c.startAt)}`,
    `DTEND:${icsDate(c.endAt)}`,
    `SUMMARY:${icsText(`Tư vấn 1:1 · ${c.host.name} & ${c.guest.name}`)}`,
    `DESCRIPTION:${icsText(`${c.topic}\n\nLink họp: ${meetingUrl}\nQuản lý lịch hẹn: ${SITE_URL}/consultations`)}`,
    ...(meetingUrl ? [`LOCATION:${icsText(meetingUrl)}`, `URL:${icsText(meetingUrl)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Buổi tư vấn bắt đầu sau 30 phút',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="lenote-tu-van-${c.id}.ics"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
