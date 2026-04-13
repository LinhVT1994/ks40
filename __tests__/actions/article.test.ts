/**
 * Unit Tests: createArticleAction
 * Kế hoạch: U1, U6, U7 từ article_creation_test_plan.md
 *
 * Mocking:
 *  - @/auth          → mock session
 *  - @/lib/db        → mock Prisma client
 *  - @/lib/events/bus→ mock event bus
 *  - next/cache      → mock revalidatePath
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    article: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/events/bus', () => ({
  eventBus: { emit: vi.fn() },
  EVENTS:   { ARTICLE_PUBLISHED: 'article.published' },
}));

// ── Imports (sau mock) ─────────────────────────────────────────────────────

import { auth }           from '@/auth';
import { db }             from '@/lib/db';
import { eventBus }       from '@/lib/events/bus';
import { revalidatePath } from 'next/cache';
import { createArticleAction } from '@/features/admin/actions/article';
import type { ArticleFormData } from '@/features/admin/actions/article';
import { ArticleAudience, ArticleStatus } from '@prisma/client';

// ── Helpers ────────────────────────────────────────────────────────────────

const ADMIN_SESSION = {
  user: { id: 'admin-001', name: 'Admin Test', role: 'ADMIN' },
};

const VALID_DATA: ArticleFormData = {
  title:    'Hướng dẫn DevOps cơ bản',
  slug:     'huong-dan-devops-co-ban',
  summary:  'Bài viết giới thiệu DevOps',
  content:  'Nội dung bài viết chi tiết về DevOps...',
  topicId: 'topic-devops',
  badges:   [],
  audience: ArticleAudience.MEMBERS,
  status:   ArticleStatus.PUBLISHED,
  tags:     ['devops', 'ci-cd'],
};

const MOCK_ARTICLE = {
  id:     'article-abc',
  slug:   VALID_DATA.slug,
  title:  VALID_DATA.title,
  status: ArticleStatus.PUBLISHED,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('createArticleAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // U1: Happy path – tạo bài viết thành công, status PUBLISHED
  // ─────────────────────────────────────────────────────────────────────────
  it('U1: tạo bài viết thành công với status PUBLISHED', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(null); // slug chưa tồn tại
    vi.mocked(db.tag.upsert).mockResolvedValueOnce({ id: 'tag-1', name: 'devops', slug: 'devops' });
    vi.mocked(db.tag.upsert).mockResolvedValueOnce({ id: 'tag-2', name: 'ci-cd',  slug: 'ci-cd'  });
    vi.mocked(db.article.create).mockResolvedValue(MOCK_ARTICLE as never);

    // Act
    const result = await createArticleAction(VALID_DATA);

    // Assert
    expect(result).toEqual({ success: true, id: 'article-abc' });

    // DB được gọi đúng
    expect(db.article.findUnique).toHaveBeenCalledWith({ where: { slug: VALID_DATA.slug } });
    expect(db.article.create).toHaveBeenCalledOnce();

    // Event được emit vì status = PUBLISHED
    expect(eventBus.emit).toHaveBeenCalledWith('article.published', expect.objectContaining({
      articleId:  'article-abc',
      slug:       VALID_DATA.slug,
      title:      VALID_DATA.title,
      actorId:    'admin-001',
      authorName: 'Admin Test',
    }));

    // Cache bị invalidate
    expect(revalidatePath).toHaveBeenCalledWith('/admin/documents');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // U6: Slug đã tồn tại → trả về lỗi
  // ─────────────────────────────────────────────────────────────────────────
  it('U6: trả về lỗi khi slug đã tồn tại', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(MOCK_ARTICLE as never); // slug đã có

    // Act
    const result = await createArticleAction(VALID_DATA);

    // Assert
    expect(result).toEqual({ success: false, error: 'Slug đã tồn tại.' });

    // Không tạo article mới
    expect(db.article.create).not.toHaveBeenCalled();
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // U7: Không phải ADMIN → throw Unauthorized
  // ─────────────────────────────────────────────────────────────────────────
  it('U7: throw lỗi khi không phải ADMIN', async () => {
    // Arrange – user không có role ADMIN
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-999', role: 'MEMBER' },
    } as never);

    // Act & Assert
    await expect(createArticleAction(VALID_DATA)).rejects.toThrow('Unauthorized');

    // Không truy vấn DB
    expect(db.article.findUnique).not.toHaveBeenCalled();
    expect(db.article.create).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // U2: Status SCHEDULED → không emit event
  // ─────────────────────────────────────────────────────────────────────────
  it('U2: không emit event khi status là SCHEDULED', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(db.article.findUnique).mockResolvedValue(null);
    vi.mocked(db.tag.upsert).mockResolvedValue({ id: 'tag-1', name: 'devops', slug: 'devops' });
    vi.mocked(db.article.create).mockResolvedValue({
      ...MOCK_ARTICLE,
      status: ArticleStatus.SCHEDULED,
    } as never);

    const scheduledData: ArticleFormData = {
      ...VALID_DATA,
      status:      ArticleStatus.SCHEDULED,
      publishedAt: '2026-04-01T00:00:00Z',
    };

    // Act
    const result = await createArticleAction(scheduledData);

    // Assert
    expect(result.success).toBe(true);
    expect(eventBus.emit).not.toHaveBeenCalled(); // Không emit vì chưa publish
  });
});
