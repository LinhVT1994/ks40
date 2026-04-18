'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { unstable_cache } from 'next/cache';
import { ArticleAudience, ArticleStatus, Prisma } from '@prisma/client';

// ── Types ──────────────────────────────────────────────────────

export type ArticleCard = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail: string | null;
  thumbnailPosition: string | null;
  cover: string | null;
  coverPosition: string | null;
  topic: { id: string; slug: string; label: string; emoji: string | null; color: string | null; parentId: string | null; parent?: { id: string; slug: string; label: string } | null };
  audience: ArticleAudience;
  badges: string[];
  readTime: number;
  viewCount: number;
  publishedAt: Date | null;
  author: { name: string; image: string | null; username: string | null };
  _count: { likes: number; comments: number; bookmarks: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
  avgRating?: number;
  ratingCount?: number;
};

export type ArticleFull = ArticleCard & {
  authorId: string;
  content: string;
  overview: string | null;
  objectives: string | null;
  audience: ArticleAudience;
  tags: { tag: { name: string; slug: string } }[];
  resources: { id: string; name: string; size: number; mimeType: string }[];
};

export type GetArticlesOptions = {
  topicId?: string;
  topicIds?: string[];
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  timeframe?: 'today' | 'week' | 'month' | 'year' | 'all';
};

// ── Helpers ────────────────────────────────────────────────────

function getAudienceFilter(role?: string): ArticleAudience[] {
  if (role === 'ADMIN')   return ['PUBLIC', 'MEMBERS', 'PREMIUM', 'PRIVATE'];
  if (role === 'PREMIUM') return ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  if (role === 'MEMBER')  return ['PUBLIC', 'MEMBERS'];
  return ['PUBLIC'];
}

// ── Discovery ranking cache ────────────────────────────────────
// Tính decay score một lần, cache 5 phút — mọi user dùng chung
// Chỉ lưu ID list, không lưu data user-specific (isLiked/isBookmarked)
const _getRankedDiscoveryIds = unstable_cache(
  async (
    _cacheKey: string,
    audienceFilter: ArticleAudience[],
    poolDate: Date | undefined,
    topicFilter: Prisma.ArticleWhereInput | undefined,
  ): Promise<string[]> => {
    const BADGE_BONUS: Record<string, number> = { HOT: 1, TRENDING: 1.5, FEATURED: 1 };
    const now = Date.now();

    const rows = await db.article.findMany({
      where: {
        status:   ArticleStatus.PUBLISHED,
        audience: { in: audienceFilter },
        ...topicFilter,
        ...(poolDate && { publishedAt: { gte: poolDate } }),
      },
      // Chỉ fetch fields cần cho scoring — nhẹ hơn nhiều
      select: { id: true, publishedAt: true, viewCount: true, badges: true, _count: { select: { likes: true } } },
    });

    return rows
      .map(a => {
        const ageHours   = (now - new Date(a.publishedAt ?? now).getTime()) / 3_600_000;
        const engagement = a._count.likes + a.viewCount / 100;
        const badge      = (a.badges as string[]).reduce((s, b) => s + (BADGE_BONUS[b] ?? 0), 0);
        return { id: a.id, score: (engagement + badge) / Math.pow(ageHours + 2, 1.5) };
      })
      .sort((a, b) => b.score - a.score)
      .map(a => a.id);
  },
  ['discovery-ranked'],
  { revalidate: 300 }, // 5 phút
);

// ── Actions ────────────────────────────────────────────────────

export async function getArticlesAction(options: GetArticlesOptions = {}) {
  const session  = await auth();
  const role     = (session?.user as { role?: string })?.role;
  const userId   = session?.user?.id;
  const { topicId, search, page = 1, limit = 12, timeframe = 'all' } = options;
  const activeSearch = search?.trim();
  const activeTag    = options.tag?.trim();

  // timeframe filtering
  let dateFilter: Prisma.ArticleWhereInput | undefined;
  if (timeframe !== 'all') {
    const now = new Date();
    let gteDate = new Date();
    if (timeframe === 'today') {
      gteDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      gteDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      gteDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      gteDate.setFullYear(now.getFullYear() - 1);
    }
    dateFilter = { publishedAt: { gte: gteDate } };
  }

  // List/search luôn hiển thị PUBLIC + MEMBERS + PREMIUM (không PRIVATE)
  // PRIVATE chỉ ADMIN mới truy cập được — bị loại ở mọi listing
  // Nội dung thực sự bị gate tại trang chi tiết bài viết
  const listFilter: ArticleAudience[] = role === 'ADMIN'
    ? ['PUBLIC', 'MEMBERS', 'PREMIUM', 'PRIVATE']
    : ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  const audienceFilter = listFilter;

  // topicId or topicIds filter — include all children if parentId is provided
  let topicFilter: Prisma.ArticleWhereInput | undefined;
  
  if (options.topicIds && options.topicIds.length > 0) {
    const children = await db.topic.findMany({ 
      where: { parentId: { in: options.topicIds } }, 
      select: { id: true } 
    });
    const allIds = [...options.topicIds, ...children.map(c => c.id)];
    topicFilter = { topicId: { in: allIds } };
  } else if (topicId) {
    const children = await db.topic.findMany({ where: { parentId: topicId }, select: { id: true } });
    if (children.length > 0) {
      topicFilter = { topicId: { in: [topicId, ...children.map(c => c.id)] } };
    } else {
      topicFilter = { topicId };
    }
  }

  const select = {
    id: true, title: true, slug: true, summary: true,
    thumbnail: true, thumbnailPosition: true, cover: true, coverPosition: true,
    topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
    audience: true, badges: true,
    readTime: true, viewCount: true, publishedAt: true,
    author:  { select: { name: true, image: true, username: true } },
    _count:  { select: { likes: true, comments: true, bookmarks: true } },
    ratings: { where: { hidden: false }, select: { score: true } },
    ...(userId && {
      likes:     { where: { userId }, select: { userId: true } },
      bookmarks: { where: { userId }, select: { userId: true } },
    }),
  };

  const where: Prisma.ArticleWhereInput = {
    status:   ArticleStatus.PUBLISHED,
    audience: { in: audienceFilter },
    ...topicFilter,
    ...dateFilter,
    ...(activeTag && { tags: { some: { tag: { slug: activeTag } } } }),
    ...(activeSearch && {
      OR: [
        { title:   { contains: activeSearch, mode: 'insensitive' } },
        { summary: { contains: activeSearch, mode: 'insensitive' } },
        { content: { contains: activeSearch, mode: 'insensitive' } },
      ],
    }),
  };

  const toCard = (a: any): ArticleCard => {
    const rScores = a.ratings ?? [];
    const ratingCount = rScores.length;
    const avgRating = ratingCount > 0
      ? Math.round((rScores.reduce((s: number, r: { score: number }) => s + r.score, 0) / ratingCount) * 100) / 100
      : 0;
    return {
      ...a,
      isLiked:      userId ? (a.likes?.length ?? 0) > 0 : false,
      isBookmarked: userId ? (a.bookmarks?.length ?? 0) > 0 : false,
      avgRating,
      ratingCount,
    };
  };

  // Search/tag/topic filter → sort mới nhất, không cần scoring
  if (activeSearch || activeTag) {
    const [rows, total] = await Promise.all([
      db.article.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * limit, take: limit, select }),
      db.article.count({ where }),
    ]);
    return { articles: rows.map(toCard), total, totalPages: Math.ceil(total / limit), page };
  }

  // Browse thuần → decay score với cached ranking
  const poolDate = new Date();
  poolDate.setDate(poolDate.getDate() - 30);
  const effectiveDate = timeframe !== 'all' ? (where.publishedAt as any)?.gte : poolDate;

  // Cache key theo audience + timeframe + topic filter
  const cacheKey = `${audienceFilter.join(',')}_${effectiveDate?.toISOString() ?? 'all'}_${topicId ?? ''}_${(options.topicIds ?? []).join(',')}`;
  const rankedIds = await _getRankedDiscoveryIds(cacheKey, audienceFilter, effectiveDate, topicFilter);

  const total = rankedIds.length;
  const skip  = (page - 1) * limit;
  const pageIds = rankedIds.slice(skip, skip + limit);

  if (pageIds.length === 0) return { articles: [], total, totalPages: Math.ceil(total / limit), page };

  // Chỉ fetch full data cho page slice — không load toàn bộ
  const rows = await db.article.findMany({
    where:  { id: { in: pageIds } },
    select,
  });

  // Giữ đúng thứ tự ranked
  const articleMap = new Map(rows.map(a => [a.id, a]));
  const articles = pageIds
    .map(id => articleMap.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map(toCard);

  return { articles, total, totalPages: Math.ceil(total / limit), page };
}

export async function getForYouArticlesAction(options: {
  limit?: number;
  page?: number;
  timeframe?: 'today' | 'week' | 'month' | 'year' | 'all';
  userId?: string;
  role?: string;
} = {}): Promise<{ articles: ArticleCard[]; total: number; totalPages: number; page: number }> {
  const { limit = 20, page = 1, timeframe = 'all' } = options;
  // Use passed-in userId/role if available — avoids duplicate auth() call from page
  let userId  = options.userId;
  let role    = options.role;
  if (userId === undefined) {
    const session = await auth();
    role    = (session?.user as { role?: string })?.role;
    userId  = session?.user?.id;
  }
  const rawAudience = getAudienceFilter(role).filter(a => a !== 'PRIVATE') as ArticleAudience[];
  const audienceFilter: ArticleAudience[] = rawAudience.includes('PREMIUM') ? rawAudience : [...rawAudience, 'PREMIUM'];

  // timeframe filtering
  let dateFilter: Prisma.ArticleWhereInput | undefined;
  if (timeframe !== 'all') {
    const now = new Date();
    let gteDate = new Date();
    if (timeframe === 'today') {
      gteDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      gteDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      gteDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      gteDate.setFullYear(now.getFullYear() - 1);
    }
    dateFilter = { publishedAt: { gte: gteDate } };
  }

  const baseWhere: Prisma.ArticleWhereInput = {
    status:   ArticleStatus.PUBLISHED,
    audience: { in: audienceFilter },
    ...dateFilter,
  };

  const selectFields = {
    id: true, title: true, slug: true, summary: true,
    thumbnail: true, thumbnailPosition: true, cover: true, coverPosition: true,
    topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
    audience: true, badges: true, readTime: true, viewCount: true, publishedAt: true,
    author:  { select: { name: true, image: true, username: true } },
    _count:  { select: { likes: true, comments: true, bookmarks: true } },
    ratings: { where: { hidden: false }, select: { score: true } },
    ...(userId && {
      likes:     { where: { userId }, select: { userId: true } },
      bookmarks: { where: { userId }, select: { userId: true } },
    }),
  } as const;

  // Không đăng nhập → fallback: badge + engagement
  if (!userId) {
    const rows = await db.article.findMany({
      where: baseWhere, take: limit * 2, select: selectFields,
    });
    const articles = rows
      .map(a => ({
        score: Math.log1p((a as { _count: { likes: number } })._count.likes) + Math.log1p(a.viewCount / 100),
        ...a,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score: _s, ...a }) => {
        const rScores = (a as { ratings?: { score: number }[] }).ratings ?? [];
        const ratingCount = rScores.length;
        const avgRating = ratingCount > 0 ? Math.round((rScores.reduce((s, r) => s + r.score, 0) / ratingCount) * 100) / 100 : 0;
        return { ...a, isLiked: false, isBookmarked: false, avgRating, ratingCount };
      }) as ArticleCard[];

    return {
      articles,
      total: articles.length,
      totalPages: 1,
      page: 1,
    };
  }

  // Lấy topics đang theo dõi và users đang follow song song
  const [followedTopics, followedUsers] = await Promise.all([
    (db as any).topicFollow.findMany({ where: { userId }, select: { topicId: true } }),
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
  ]);

  const followedTopicIds: string[] = followedTopics.map((f: { topicId: string }) => f.topicId);
  const followedUserIds: string[]  = followedUsers.map((f: { followingId: string }) => f.followingId);

  // Mở rộng topic: thêm child topics của các parent đang theo dõi
  if (followedTopicIds.length > 0) {
    const childTopics = await db.topic.findMany({
      where:  { parentId: { in: followedTopicIds } },
      select: { id: true },
    });
    followedTopicIds.push(...childTopics.map(c => c.id));
  }

  if (followedTopicIds.length === 0 && followedUserIds.length === 0) {
    return { articles: [], total: 0, totalPages: 0, page: 1 };
  }

  // Fetch toàn bộ bài từ followed topics/users rồi rank in-memory
  const followWhere: Prisma.ArticleWhereInput = {
    ...baseWhere,
    OR: [
      ...(followedTopicIds.length > 0 ? [{ topicId: { in: followedTopicIds } }] : []),
      ...(followedUserIds.length > 0  ? [{ authorId: { in: followedUserIds } }] : []),
    ],
  };

  const rows = await db.article.findMany({
    where:   followWhere,
    orderBy: { publishedAt: 'desc' },
    select:  selectFields,
  });

  const BADGE_BONUS: Record<string, number> = { HOT: 1, TRENDING: 1.5, FEATURED: 1 };

  // Sort: mới nhất trước, cùng ngày dùng score làm tiebreaker
  const ranked = rows
    .map(a => {
      const engagement = Math.log1p((a as { _count: { likes: number } })._count.likes) +
                         Math.log1p(a.viewCount / 100);
      const badge      = (a.badges as string[]).reduce((sum, b) => sum + (BADGE_BONUS[b] ?? 0), 0);
      return { ...a, _score: engagement + badge };
    })
    .sort((a, b) => {
      const aDay = a.publishedAt ? new Date(a.publishedAt).toDateString() : '';
      const bDay = b.publishedAt ? new Date(b.publishedAt).toDateString() : '';
      if (aDay !== bDay) return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
      return b._score - a._score;
    });

  const total  = ranked.length;
  const skip   = (page - 1) * limit;

  const articles = ranked.slice(skip, skip + limit).map(({ _score: _s, ...a }) => {
    const rScores = (a as { ratings?: { score: number }[] }).ratings ?? [];
    const ratingCount = rScores.length;
    const avgRating = ratingCount > 0
      ? Math.round((rScores.reduce((s, r) => s + r.score, 0) / ratingCount) * 100) / 100
      : 0;
    return {
      ...a,
      isLiked:      userId ? ((a as { likes?: { userId: string }[] }).likes?.length ?? 0) > 0 : false,
      isBookmarked: userId ? ((a as { bookmarks?: { userId: string }[] }).bookmarks?.length ?? 0) > 0 : false,
      avgRating,
      ratingCount,
    };
  }) as ArticleCard[];

  return { articles, total, totalPages: Math.ceil(total / limit), page };
}

// ── Cached article content (no auth — per slug+role) ──────────
const _getArticleContentCached = unstable_cache(
  async (slug: string, role: string) => {
    const audienceFilter = getAudienceFilter(role === 'GUEST' ? undefined : role);

    const article = await db.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED, audience: { in: audienceFilter } },
      include: {
        author:      { select: { id: true, name: true, image: true, username: true } },
        tags:        { include: { tag: { select: { name: true, slug: true } } } },
        resources:   { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: 'asc' } },
        _count:      { select: { likes: true, comments: true, bookmarks: true } },
        topic:       { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
        nextArticle: { select: { id: true, title: true, slug: true, summary: true, thumbnail: true, cover: true, topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } }, readTime: true, author: { select: { name: true, image: true, username: true } }, _count: { select: { likes: true } } } },
      },
    });

    if (!article) return null;
    return { ...article, isLiked: false, isBookmarked: false } as ArticleFull;
  },
  ['article-content'],
  { revalidate: 3600 },
);

// Dùng cho page render — role từ session của page, không gọi auth() thêm
export async function getArticleBySlugStaticAction(slug: string, role?: string) {
  return _getArticleContentCached(slug, role ?? 'GUEST');
}

// Trạng thái tương tác của user (isLiked/isBookmarked) — chỉ gọi khi đã có userId
export async function getArticleUserInteractionAction(articleId: string, userId: string) {
  const article = await db.article.findUnique({
    where:  { id: articleId },
    select: {
      likes:     { where: { userId }, select: { userId: true } },
      bookmarks: { where: { userId }, select: { userId: true } },
    },
  });
  return {
    isLiked:      (article?.likes?.length ?? 0) > 0,
    isBookmarked: (article?.bookmarks?.length ?? 0) > 0,
  };
}

// Lấy slug tất cả bài PUBLIC/MEMBERS/PREMIUM đã publish — dùng cho generateStaticParams
// PRIVATE bị loại vì noindex, không cần pre-render
export async function getPublishedArticleSlugsAction() {
  const articles = await db.article.findMany({
    where:  { status: ArticleStatus.PUBLISHED, audience: { in: [ArticleAudience.PUBLIC, ArticleAudience.MEMBERS, ArticleAudience.PREMIUM] } },
    select: { slug: true },
  });
  return articles.map(a => ({ slug: a.slug }));
}

export async function getArticleBySlugAction(slug: string) {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  const userId  = session?.user?.id;

  const audienceFilter = getAudienceFilter(role);

  const article = await db.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED, audience: { in: audienceFilter } },
    include: {
      author:      { select: { id: true, name: true, image: true, username: true } },
      tags:        { include: { tag: { select: { name: true, slug: true } } } },
      resources:   { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: 'asc' } },
      _count:      { select: { likes: true, comments: true, bookmarks: true } },
      topic:       { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
      nextArticle: { select: { id: true, title: true, slug: true, summary: true, thumbnail: true, cover: true, topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } }, readTime: true, author: { select: { name: true, image: true, username: true } }, _count: { select: { likes: true } } } },
      ...(userId && {
        likes:     { where: { userId } },
        bookmarks: { where: { userId } },
      }),
    },
  });

  if (!article) return null;

  return {
    ...article,
    isLiked:      userId ? article.likes?.length > 0 : false,
    isBookmarked: userId ? article.bookmarks?.length > 0 : false,
  } as ArticleFull;
}

// Returns truncated article for SEO metadata + content gate (no auth check, skips PRIVATE)
export async function getArticlePreviewAction(slug: string) {
  const article = await db.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED, audience: { not: ArticleAudience.PRIVATE } },
    select: {
      id: true, title: true, slug: true, summary: true,
      thumbnail: true, cover: true, audience: true,
      publishedAt: true, updatedAt: true, readTime: true,
      topic: { select: { id: true, slug: true, label: true, emoji: true, color: true, parentId: true, parent: { select: { id: true, slug: true, label: true } } } },
      author:    { select: { name: true, image: true } },
      tags:      { include: { tag: { select: { name: true, slug: true } } } },
      content:   true,
    },
  });
  if (!article) return null;

  // Truncate to ~50% of character length to preserve whitespaces and specific markdown nuances (newlines, etc)
  const length = article.content.length;
  if (length > 100) {
    const halfLen = Math.floor(length * 0.5);
    const cutPos  = article.content.lastIndexOf(' ', halfLen);
    const preview = article.content.slice(0, cutPos > 0 ? cutPos : halfLen) + '\n\n...';
    return { ...article, content: preview };
  }
  
  return { ...article, content: article.content };
}

export async function incrementViewAction(articleId: string): Promise<void> {
  await db.article.update({
    where: { id: articleId },
    data:  { viewCount: { increment: 1 } },
  });
}
export type SeriesNavItem = { title: string; slug: string; seriesOrder: number };

export async function getSeriesContextAction(seriesId: string, currentArticleId: string) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const audienceFilter = getAudienceFilter(role);

  const [series, articles] = await Promise.all([
    db.series.findUnique({ where: { id: seriesId }, select: { id: true, title: true, slug: true } }),
    db.article.findMany({
      where: { seriesId, status: ArticleStatus.PUBLISHED, audience: { in: audienceFilter } },
      orderBy: { seriesOrder: 'asc' },
      select: { id: true, title: true, slug: true, seriesOrder: true },
    }),
  ]);

  if (!series || articles.length === 0) return null;

  const idx = articles.findIndex(a => a.id === currentArticleId);
  const current = idx >= 0 ? articles[idx] : null;
  const prev = idx > 0 ? articles[idx - 1] : null;
  const next = idx < articles.length - 1 ? articles[idx + 1] : null;

  return {
    series,
    articles: articles as SeriesNavItem[],
    currentIndex: idx,
    total: articles.length,
    prev: prev as SeriesNavItem | null,
    next: next as SeriesNavItem | null,
    currentOrder: current?.seriesOrder ?? null,
  };
}

export async function getArticleNavigationAction(publishedAt: Date | null) {
  if (!publishedAt) return { prev: null, next: null };

  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const audienceFilter = getAudienceFilter(role);

  const [prev, next] = await Promise.all([
    db.article.findFirst({
      where: {
        status: ArticleStatus.PUBLISHED,
        audience: { in: audienceFilter },
        publishedAt: { lt: publishedAt },
      },
      orderBy: { publishedAt: 'desc' },
      select: { 
        id: true, title: true, slug: true, thumbnail: true, summary: true,
        author: { select: { name: true, username: true } }
      },
    }),
    db.article.findFirst({
      where: {
        status: ArticleStatus.PUBLISHED,
        audience: { in: audienceFilter },
        publishedAt: { gt: publishedAt },
      },
      orderBy: { publishedAt: 'asc' },
      select: { 
        id: true, title: true, slug: true, thumbnail: true, summary: true,
        author: { select: { name: true, username: true } }
      },
    }),
  ]);

  return { prev, next };
}
// role truyền từ ngoài vào — KHÔNG gọi auth() bên trong unstable_cache
const _getPopularTagsCached = unstable_cache(
  async (limit: number, role: string) => {
    const audienceFilter = getAudienceFilter(role === 'GUEST' ? undefined : role);

    const tags = await db.tag.findMany({
      where: {
        articles: {
          some: {
            article: {
              status: ArticleStatus.PUBLISHED,
              audience: { in: audienceFilter },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            articles: {
              where: {
                article: {
                  status: ArticleStatus.PUBLISHED,
                  audience: { in: audienceFilter },
                },
              },
            },
          },
        },
      },
      take: limit,
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
    });

    return tags.map(t => ({
      id:   t.id,
      name: t.name,
      slug: t.slug,
      count: t._count.articles,
    }));
  },
  ['popular-tags'],
  { revalidate: 600 } // 10 minutes
);

export async function getPopularTagsAction(limit = 12) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? 'GUEST';
  return _getPopularTagsCached(limit, role);
}
