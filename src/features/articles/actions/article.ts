'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ArticleAudience, ArticleCategory, ArticleStatus, Prisma } from '@prisma/client';

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
  category: ArticleCategory;
  audience: ArticleAudience;
  badges: string[];
  readTime: number;
  viewCount: number;
  publishedAt: Date | null;
  author: { name: string; image: string | null };
  _count: { likes: number; comments: number; bookmarks: number };
  isLiked?: boolean;
  isBookmarked?: boolean;
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
  category?: ArticleCategory;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
};

// ── Helpers ────────────────────────────────────────────────────

function getAudienceFilter(role?: string): ArticleAudience[] {
  if (role === 'ADMIN')   return ['PUBLIC', 'MEMBERS', 'PREMIUM', 'PRIVATE'];
  if (role === 'PREMIUM') return ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  if (role === 'MEMBER')  return ['PUBLIC', 'MEMBERS'];
  return ['PUBLIC'];
}

// ── Actions ────────────────────────────────────────────────────

export async function getArticlesAction(options: GetArticlesOptions = {}) {
  const session  = await auth();
  const role     = (session?.user as { role?: string })?.role;
  const userId   = session?.user?.id;
  const { category, search, page = 1, limit = 12 } = options;
  const activeSearch = search?.trim();
  const activeTag    = options.tag?.trim();

  // Browsing & searching: always show PUBLIC/MEMBERS/PREMIUM (not PRIVATE)
  // PREMIUM shown to all so users can discover and be upsold at read-time
  const accessFilter  = getAudienceFilter(role).filter(a => a !== 'PRIVATE') as ArticleAudience[];
  const browseFilter: ArticleAudience[] = accessFilter.includes('PREMIUM') ? accessFilter : [...accessFilter, 'PREMIUM'];
  const searchFilter: ArticleAudience[] = ['PUBLIC', 'MEMBERS', 'PREMIUM'];
  const audienceFilter = (activeSearch || activeTag) ? searchFilter : browseFilter;

  const where: Prisma.ArticleWhereInput = {
    status:      ArticleStatus.PUBLISHED,
    audience:    { in: audienceFilter },
    ...(category && { category }),
    ...(activeTag && {
      tags: {
        some: {
          tag: { slug: activeTag }
        }
      }
    }),
    ...(activeSearch && {
      OR: [
        { title:   { contains: activeSearch, mode: 'insensitive' } },
        { summary: { contains: activeSearch, mode: 'insensitive' } },
        { content: { contains: activeSearch, mode: 'insensitive' } },
      ],
    }),
  };

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, title: true, slug: true, summary: true,
        thumbnail: true, thumbnailPosition: true, cover: true, coverPosition: true,
        category: true, audience: true, badges: true,
        readTime: true, viewCount: true, publishedAt: true,
        author:  { select: { name: true, image: true } },
        _count:  { select: { likes: true, comments: true, bookmarks: true } },
        ...(userId && {
          likes:     { where: { userId }, select: { userId: true } },
          bookmarks: { where: { userId }, select: { userId: true } },
        }),
      },
    }),
    db.article.count({ where }),
  ]);

  return {
    articles: articles.map(a => ({
      ...a,
      isLiked:      userId ? ((a as { likes?: { userId: string }[] }).likes?.length ?? 0) > 0 : false,
      isBookmarked: userId ? ((a as { bookmarks?: { userId: string }[] }).bookmarks?.length ?? 0) > 0 : false,
    })) as ArticleCard[],
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

export async function getForYouArticlesAction(limit = 20): Promise<ArticleCard[]> {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  const userId  = session?.user?.id;
  const rawAudience = getAudienceFilter(role).filter(a => a !== 'PRIVATE') as ArticleAudience[];
  const audienceFilter: ArticleAudience[] = rawAudience.includes('PREMIUM') ? rawAudience : [...rawAudience, 'PREMIUM'];

  const baseWhere: Prisma.ArticleWhereInput = {
    status:   ArticleStatus.PUBLISHED,
    audience: { in: audienceFilter },
  };

  const selectFields = {
    id: true, title: true, slug: true, summary: true,
    thumbnail: true, thumbnailPosition: true, cover: true, coverPosition: true,
    category: true, audience: true, badges: true, readTime: true, viewCount: true, publishedAt: true,
    author:  { select: { name: true, image: true } },
    _count:  { select: { likes: true, comments: true, bookmarks: true } },
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
    return rows
      .map(a => ({
        score: Math.log1p((a as { _count: { likes: number } })._count.likes) + Math.log1p(a.viewCount / 100),
        ...a,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score: _s, ...a }) => ({
        ...a,
        isLiked:      false,
        isBookmarked: false,
      })) as ArticleCard[];
  }

  // Lấy lịch sử đọc (30 ngày), lịch sử like, và category onboarding
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [readHistory, likedArticles, onboarding] = await Promise.all([
    db.readHistory.findMany({
      where:   { userId, readAt: { gte: since } },
      select:  { article: { select: { category: true } } },
    }),
    db.like.findMany({
      where:  { userId },
      select: { article: { select: { category: true } } },
    }),
    db.userOnboarding.findUnique({
      where:  { userId },
      select: { interestedCategories: true },
    }),
  ]);

  // Tính điểm ưu tiên theo category
  const catScore: Partial<Record<ArticleCategory, number>> = {};

  // Onboarding categories — seed ban đầu
  for (const c of onboarding?.interestedCategories ?? []) {
    catScore[c] = (catScore[c] ?? 0) + 1;
  }
  for (const r of readHistory) {
    const c = r.article.category;
    catScore[c] = (catScore[c] ?? 0) + 1;
  }
  for (const l of likedArticles) {
    const c = l.article.category;
    catScore[c] = (catScore[c] ?? 0) + 2; // like có trọng số cao hơn
  }

  // Fetch pool bài viết (nhiều hơn để có đủ để rank)
  const rows = await db.article.findMany({
    where:   baseWhere,
    take:    limit * 4,
    orderBy: { publishedAt: 'desc' },
    select:  selectFields,
  });

  const BADGE_BONUS: Record<string, number> = { HOT: 1, TRENDING: 1.5, FEATURED: 1 };

  const scored = rows.map(a => {
    const pref       = catScore[a.category] ?? 0;
    const engagement = Math.log1p((a as { _count: { likes: number } })._count.likes) +
                       Math.log1p(a.viewCount / 100);
    const badge      = (a.badges as string[]).reduce((sum, b) => sum + (BADGE_BONUS[b] ?? 0), 0);
    return { ...a, _score: pref * 2 + engagement + badge };
  });

  scored.sort((a, b) => b._score - a._score);

  return scored.slice(0, limit).map(({ _score: _s, ...a }) => ({
    ...a,
    isLiked:      (a as { likes?: { userId: string }[] }).likes?.length ? true : false,
    isBookmarked: (a as { bookmarks?: { userId: string }[] }).bookmarks?.length ? true : false,
  })) as ArticleCard[];
}

export async function getArticleBySlugAction(slug: string) {
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  const userId  = session?.user?.id;

  const audienceFilter = getAudienceFilter(role);

  const article = await db.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED, audience: { in: audienceFilter } },
    include: {
      author:      { select: { name: true, image: true } },
      tags:        { include: { tag: { select: { name: true, slug: true } } } },
      resources:   { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: 'asc' } },
      _count:      { select: { likes: true, comments: true, bookmarks: true } },
      nextArticle: { select: { id: true, title: true, slug: true, summary: true, thumbnail: true, cover: true, category: true, readTime: true, author: { select: { name: true, image: true } }, _count: { select: { likes: true } } } },
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
      publishedAt: true, updatedAt: true, readTime: true, category: true,
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
        author: { select: { name: true } }
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
        author: { select: { name: true } }
      },
    }),
  ]);

  return { prev, next };
}
export async function getPopularTagsAction(limit = 12) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const audienceFilter = getAudienceFilter(role);

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
}
