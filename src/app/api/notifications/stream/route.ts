import { auth } from '@/auth';
import { db } from '@/lib/db';
import { addSSEClient, removeSSEClient } from '@/lib/sse';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'api/notifications/stream' });

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();

  // Heartbeat to keep the connection alive (every 25 s)
  let heartbeatTimer: ReturnType<typeof setInterval>;

  let ctrl: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      ctrl = c;
      addSSEClient(userId, c);
      log.info({ userId }, 'SSE connection opened');

      // Send initial unread count immediately
      const unreadCount = await db.notification.count({
        where: { userId, read: false },
      });
      c.enqueue(encoder.encode(
        `event: init\ndata: ${JSON.stringify({ unreadCount })}\n\n`,
      ));

      heartbeatTimer = setInterval(() => {
        try {
          c.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          log.debug({ userId }, 'SSE heartbeat thất bại, đóng kết nối');
          clearInterval(heartbeatTimer);
        }
      }, 25_000);
    },
    cancel() {
      clearInterval(heartbeatTimer);
      removeSSEClient(userId, ctrl);
      log.info({ userId }, 'SSE connection closed');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection:      'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
