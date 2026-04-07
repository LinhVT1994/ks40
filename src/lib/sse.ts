/**
 * In-memory SSE client registry.
 * Uses globalThis to survive Next.js HMR hot-reloads in dev.
 */

type Ctrl = ReadableStreamDefaultController<Uint8Array>;

const g = globalThis as typeof globalThis & {
  _sseClients?: Map<string, Set<Ctrl>>;
};
if (!g._sseClients) g._sseClients = new Map();

const clients = g._sseClients;

export function addSSEClient(userId: string, ctrl: Ctrl) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ctrl);
}

export function removeSSEClient(userId: string, ctrl: Ctrl) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(ctrl);
  if (set.size === 0) clients.delete(userId);
}

export function pushToUser(userId: string, event: string, data: unknown) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const payload = new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );

  for (const ctrl of [...set]) {
    try {
      ctrl.enqueue(payload);
    } catch {
      // client disconnected but cancel() hasn't fired yet
      set.delete(ctrl);
    }
  }
}

/** Broadcast to ALL connected users (e.g. system-wide alerts). */
export function broadcastToAll(event: string, data: unknown) {
  for (const userId of clients.keys()) {
    pushToUser(userId, event, data);
  }
}
