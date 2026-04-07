'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
} from '../actions/notification';
import type { Notification } from '@prisma/client';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();
  // Track whether we've already received the SSE init count
  // so we don't overwrite it with the (potentially stale) DB fetch result
  const sseInitReceived = useRef(false);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    getNotificationsAction()
      .then(({ notifications, unreadCount }) => {
        setNotifications(notifications);
        // Only set unread count from DB if SSE init hasn't arrived yet
        if (!sseInitReceived.current) {
          setUnreadCount(unreadCount);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── SSE connection ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const es = new EventSource('/api/notifications/stream');

    es.addEventListener('init', (e) => {
      const { unreadCount } = JSON.parse(e.data) as { unreadCount: number };
      sseInitReceived.current = true;
      setUnreadCount(unreadCount);
    });

    es.addEventListener('notification', (e) => {
      const notif = JSON.parse(e.data) as Notification;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((c) => c + 1);
    });

    return () => es.close();
  }, []);

  // ── Actions (optimistic) ──────────────────────────────────────
  const markRead = (id: string) => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => {
      const wasUnread = notifications.some((n) => n.id === id && !n.read);
      return wasUnread ? Math.max(0, c - 1) : c;
    });
    startTransition(() => markAsReadAction(id));
  };

  const markAllRead = () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    startTransition(() => markAllAsReadAction());
  };

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
