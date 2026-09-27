import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    article: { findMany: vi.fn(), count: vi.fn() },
    topic: { findMany: vi.fn() },
  },
}));

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getArticlesAction, type GetArticlesOptions } from '@/features/articles/actions/article';

const now = new Date(2026, 8, 26, 12);
const oldArticle = {
  id: 'old-article',
  title: 'Bài viết cũ',
  publishedAt: new Date(2026, 3, 30, 12),
  viewCount: 100,
  badges: [],
  _count: { likes: 1 },
  ratings: [],
};

describe('Khám phá: bộ lọc thời gian', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(db.article.findMany).mockResolvedValue([]);
    vi.mocked(db.topic.findMany).mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  it.each([{}, { timeframe: 'all' }] as GetArticlesOptions[])(
    'không loại bài quá 30 ngày với lựa chọn %j',
    async options => {
      vi.mocked(db.article.findMany).mockResolvedValue([oldArticle] as never);

      const result = await getArticlesAction(options);
      const rankingQuery = vi.mocked(db.article.findMany).mock.calls[0][0];

      expect(rankingQuery?.where).not.toHaveProperty('publishedAt');
      expect(rankingQuery?.where).toMatchObject({
        status: 'PUBLISHED',
        audience: { in: ['PUBLIC', 'MEMBERS', 'PREMIUM'] },
      });
      expect(result.articles.map(article => article.id)).toEqual(['old-article']);
      expect(result.total).toBe(1);
    },
  );

  it.each(['today', 'week', 'month', 'year'] as const)(
    'vẫn áp dụng bộ lọc %s khi được chọn',
    async timeframe => {
      const expected = new Date(now);
      if (timeframe === 'today') expected.setHours(0, 0, 0, 0);
      if (timeframe === 'week') expected.setDate(expected.getDate() - 7);
      if (timeframe === 'month') expected.setMonth(expected.getMonth() - 1);
      if (timeframe === 'year') expected.setFullYear(expected.getFullYear() - 1);

      await getArticlesAction({ timeframe });

      expect(db.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ publishedAt: { gte: expected } }),
      }));
    },
  );

  it('giữ nguyên lọc chủ đề khi bỏ giới hạn ngày', async () => {
    await getArticlesAction({ timeframe: 'all', topicId: 'topic-1' });
    const rankingQuery = vi.mocked(db.article.findMany).mock.calls[0][0];

    expect(rankingQuery?.where).toMatchObject({ topicId: 'topic-1' });
    expect(rankingQuery?.where).not.toHaveProperty('publishedAt');
  });

  it('vẫn phân trang tập bài viết cũ', async () => {
    const articles = [oldArticle, { ...oldArticle, id: 'another-old-article' }];
    vi.mocked(db.article.findMany)
      .mockResolvedValueOnce(articles as never)
      .mockResolvedValueOnce([articles[1]] as never);

    const result = await getArticlesAction({ timeframe: 'all', page: 2, limit: 1 });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(2);
    expect(result.articles.map(article => article.id)).toEqual(['another-old-article']);
    expect(db.article.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: { in: ['another-old-article'] } },
    }));
  });
});
