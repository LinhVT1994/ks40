/**
 * Unit Tests: Article Rating Actions
 * R1–R12 from article-rating-plan.md
 *
 * Mocking:
 *  - @/auth            → mock session
 *  - @/lib/db          → mock Prisma client
 *  - @/lib/events/bus  → mock event bus
 *  - next/cache        → mock revalidatePath
 *  - notification      → mock createNotificationAction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    articleRating: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      upsert:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn(),
    },
    article: {
      findUnique: vi.fn(),
    },
    readHistory: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/events/bus', () => ({
  eventBus: { emit: vi.fn() },
  EVENTS:   { RATING_POSTED: 'RATING_POSTED' },
}));

vi.mock('@/features/notifications/actions/notification', () => ({
  createNotificationAction: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────

import { auth }           from '@/auth';
import { db }             from '@/lib/db';
import { eventBus }       from '@/lib/events/bus';
import { revalidatePath } from 'next/cache';
import { createNotificationAction } from '@/features/notifications/actions/notification';
import {
  upsertRatingAction,
  deleteRatingAction,
  getArticleRatingSummaryAction,
  toggleHideRatingAction,
} from '@/features/articles/actions/rating';

// ── Helpers ───────────────────────────────────────────────────────────────

const USER_SESSION = {
  user: { id: 'user-001', name: 'Test User', role: 'MEMBER' },
};

const AUTHOR_SESSION = {
  user: { id: 'author-001', name: 'Author', role: 'MEMBER' },
};

const ADMIN_SESSION = {
  user: { id: 'admin-001', name: 'Admin', role: 'ADMIN' },
};

const MOCK_ARTICLE = {
  authorId: 'author-001',
  title:    'Bài viết test',
  slug:     'bai-viet-test',
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe('upsertRatingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // R1: Upsert thành công với user đủ điều kiện
  it('R1: tạo rating thành công khi user đủ điều kiện (đọc ≥70%, không phải author)', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.85 } as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue(null); // chưa rate
    vi.mocked(db.articleRating.upsert).mockResolvedValue({} as never);

    const result = await upsertRatingAction('article-001', 4, 'Bài viết hay');

    expect(result).toEqual({ success: true });
    expect(db.articleRating.upsert).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith('/article/bai-viet-test');
  });

  // R2: Reject khi chưa login
  it('R2: trả lỗi khi chưa đăng nhập', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await upsertRatingAction('article-001', 4);

    expect(result.success).toBe(false);
    expect(db.articleRating.upsert).not.toHaveBeenCalled();
  });

  // R3: Reject khi user là author
  it('R3: trả lỗi khi user là tác giả bài viết', async () => {
    vi.mocked(auth).mockResolvedValue(AUTHOR_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);

    const result = await upsertRatingAction('article-001', 4);

    expect(result.success).toBe(false);
    expect(result.error).toContain('chính mình');
    expect(db.articleRating.upsert).not.toHaveBeenCalled();
  });

  // R4: Reject khi progress < 70
  it('R4: trả lỗi khi chưa đọc đủ 70%', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.50 } as never);

    const result = await upsertRatingAction('article-001', 4);

    expect(result.success).toBe(false);
    expect(result.error).toContain('70%');
    expect(db.articleRating.upsert).not.toHaveBeenCalled();
  });

  // R5: Reject khi score ngoài [1,5]
  it('R5: trả lỗi khi score ngoài phạm vi [1,5]', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);

    const result0 = await upsertRatingAction('article-001', 0);
    expect(result0.success).toBe(false);

    const result6 = await upsertRatingAction('article-001', 6);
    expect(result6.success).toBe(false);

    const resultFloat = await upsertRatingAction('article-001', 3.5);
    expect(resultFloat.success).toBe(false);

    expect(db.articleRating.upsert).not.toHaveBeenCalled();
  });

  // R6: Reject khi review > 300 ký tự
  it('R6: trả lỗi khi review vượt quá 300 ký tự', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.80 } as never);

    const longReview = 'a'.repeat(301);
    const result = await upsertRatingAction('article-001', 4, longReview);

    expect(result.success).toBe(false);
    expect(result.error).toContain('300');
    expect(db.articleRating.upsert).not.toHaveBeenCalled();
  });

  // R7: Update rating cũ → KHÔNG emit notification
  it('R7: update rating cũ thì không gửi notification mới', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.90 } as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue({ score: 3 } as never); // đã tồn tại
    vi.mocked(db.articleRating.upsert).mockResolvedValue({} as never);

    const result = await upsertRatingAction('article-001', 5);

    expect(result).toEqual({ success: true });
    expect(db.articleRating.upsert).toHaveBeenCalledOnce();
    expect(eventBus.emit).not.toHaveBeenCalled();
    expect(createNotificationAction).not.toHaveBeenCalled();
  });

  // R8: Insert rating mới → EMIT notification
  it('R8: tạo rating mới thì gửi notification cho author', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.75 } as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue(null); // mới
    vi.mocked(db.articleRating.upsert).mockResolvedValue({} as never);

    const result = await upsertRatingAction('article-001', 4, 'Rất hay');

    expect(result).toEqual({ success: true });
    expect(eventBus.emit).toHaveBeenCalledWith('RATING_POSTED', expect.objectContaining({
      articleId: 'article-001',
      score: 4,
      raterName: 'Test User',
    }));
    expect(createNotificationAction).toHaveBeenCalledWith(
      'author-001',
      'RATING',
      expect.stringContaining('4 sao'),
      expect.objectContaining({
        link: '/article/bai-viet-test',
      }),
    );
  });
});

describe('deleteRatingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // R9: Delete rating của chính user thành công
  it('R9: xóa đánh giá của chính mình thành công', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue({ userId: 'user-001', articleId: 'article-001', score: 4 } as never);
    vi.mocked(db.articleRating.delete).mockResolvedValue({} as never);
    vi.mocked(db.article.findUnique).mockResolvedValue({ slug: 'bai-viet-test' } as never);

    const result = await deleteRatingAction('article-001');

    expect(result).toEqual({ success: true });
    expect(db.articleRating.delete).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith('/article/bai-viet-test');
  });

  // R10: Delete rating không tồn tại → fail
  it('R10: trả lỗi khi không tìm thấy đánh giá', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue(null);

    const result = await deleteRatingAction('article-001');

    expect(result.success).toBe(false);
    expect(db.articleRating.delete).not.toHaveBeenCalled();
  });
});

describe('getArticleRatingSummaryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // R11: Trả đúng distribution + avg
  it('R11: trả đúng distribution và average score', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    vi.mocked(db.articleRating.findMany).mockResolvedValue([
      { score: 5 }, { score: 5 }, { score: 4 }, { score: 3 }, { score: 1 },
    ] as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue(null);
    vi.mocked(db.article.findUnique).mockResolvedValue({ authorId: 'author-001' } as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue({ progress: 0.80 } as never);

    const result = await getArticleRatingSummaryAction('article-001');

    expect(result.totalCount).toBe(5);
    expect(result.averageScore).toBe(3.6); // (5+5+4+3+1)/5
    expect(result.distribution).toEqual([1, 0, 1, 1, 2]); // 1★=1, 2★=0, 3★=1, 4★=1, 5★=2
  });

  // R12: canRate.reason = 'is_author' khi user là tác giả
  it('R12: canRate trả reason is_author khi user là tác giả', async () => {
    vi.mocked(auth).mockResolvedValue(AUTHOR_SESSION as never);
    vi.mocked(db.articleRating.findMany).mockResolvedValue([] as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue(null);
    vi.mocked(db.article.findUnique).mockResolvedValue({ authorId: 'author-001' } as never);
    vi.mocked(db.readHistory.findUnique).mockResolvedValue(null);

    const result = await getArticleRatingSummaryAction('article-001');

    expect(result.canRate.eligible).toBe(false);
    expect(result.canRate.reason).toBe('is_author');
  });
});

describe('toggleHideRatingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin có thể ẩn/hiện rating', async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(db.articleRating.findUnique).mockResolvedValue({ hidden: false } as never);
    vi.mocked(db.articleRating.update).mockResolvedValue({} as never);
    vi.mocked(db.article.findUnique).mockResolvedValue({ slug: 'test' } as never);

    const result = await toggleHideRatingAction('user-001', 'article-001');
    expect(result).toEqual({ success: true });
  });

  it('non-admin không thể ẩn rating', async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);

    const result = await toggleHideRatingAction('user-001', 'article-001');
    expect(result.success).toBe(false);
    expect(result.error).toContain('quyền');
  });
});
