'use client';

import type { Notification } from '@prisma/client';

/**
 * One notification SSE connection per browser, shared by every tab and every subscriber.
 *
 * Browsers cap HTTP/1.1 connections at 6 per origin. A long-lived EventSource per tab
 * (plus a second one on /notifications) quickly exhausts that pool and every other
 * request — pages, JS, server actions — queues behind it. Instead, one tab wins a
 * Web Lock, holds the only EventSource and relays events to the others over a
 * BroadcastChannel. When that tab closes, its lock is released and another tab takes over.
 */

type StreamEvent =
  | { type: 'init'; unreadCount: number }
  | { type: 'notification'; notification: Notification };

type Listener = (event: StreamEvent) => void;

const LOCK_NAME = 'lenote-notifications-sse';
const CHANNEL_NAME = 'lenote-notifications';

const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;
let stopLeader: (() => void) | null = null;

function emit(event: StreamEvent) {
  listeners.forEach(listener => listener(event));
}

function openEventSource(onEvent: (event: StreamEvent) => void) {
  const es = new EventSource('/api/notifications/stream');
  es.addEventListener('init', e => {
    const { unreadCount } = JSON.parse((e as MessageEvent).data) as { unreadCount: number };
    onEvent({ type: 'init', unreadCount });
  });
  es.addEventListener('notification', e => {
    onEvent({ type: 'notification', notification: JSON.parse((e as MessageEvent).data) as Notification });
  });
  return () => es.close();
}

function start() {
  const canShare = typeof BroadcastChannel !== 'undefined' && typeof navigator !== 'undefined' && 'locks' in navigator;
  if (!canShare) {
    // Old browsers: fall back to one connection per tab (still shared by subscribers in this tab).
    stopLeader = openEventSource(emit);
    return;
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = e => emit(e.data as StreamEvent);

  let release: (() => void) | null = null;
  let cancelled = false;
  const abort = new AbortController();

  navigator.locks.request(LOCK_NAME, { signal: abort.signal }, () => {
    if (cancelled) return;
    // This tab is the leader: hold the lock (and the connection) until stopped.
    return new Promise<void>(resolve => {
      const close = openEventSource(event => {
        emit(event);
        channel?.postMessage(event);
      });
      release = () => { close(); resolve(); };
    });
  }).catch(() => { /* aborted before acquiring: nothing to clean up */ });

  stopLeader = () => {
    cancelled = true;
    abort.abort();
    release?.();
  };
}

function stop() {
  stopLeader?.();
  stopLeader = null;
  channel?.close();
  channel = null;
}

/** Subscribe to notification events. Returns an unsubscribe function. */
export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}
