import { EventEmitter } from 'events';

// Đảm bảo eventBus là Singleton và tương thích với Next.js Hot Reload (HMR)
const globalForEvents = global as unknown as { eventBus?: EventEmitter };

export const eventBus = globalForEvents.eventBus || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.eventBus = eventBus;
}

// Định nghĩa mã tên sự kiện an toàn
export const EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  ARTICLE_PUBLISHED: 'ARTICLE_PUBLISHED',
  COMMENT_POSTED: 'COMMENT_POSTED',
  USER_UPGRADED: 'USER_UPGRADED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  RATING_POSTED: 'RATING_POSTED',
} as const;
