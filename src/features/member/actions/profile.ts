'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleStatus } from '@prisma/client';

export async function getPublicProfileAction(identifier: string) {
  // 1. Try finding by ID first (most stable)
  let user = await db.user.findUnique({
    where: { id: identifier },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
      githubUrl: true,
      youtubeUrl: true,
      createdAt: true,
      _count: {
        select: {
          articles: { where: { status: ArticleStatus.PUBLISHED } },
        },
      },
    },
  });

  // 2. If not found, try finding by username
  if (!user) {
    user = await db.user.findUnique({
      where: { username: identifier },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        githubUrl: true,
        youtubeUrl: true,
        createdAt: true,
        _count: {
          select: {
            articles: { where: { status: ArticleStatus.PUBLISHED } },
          },
        },
      },
    });
  }

  if (!user) return null;

  const articles = await db.article.findMany({
    where: { authorId: user.id, status: ArticleStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, summary: true,
      thumbnail: true, thumbnailPosition: true,
      topic: { select: { id: true, slug: true, label: true, emoji: true, color: true } },
      badges: true, readTime: true,
      viewCount: true, publishedAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
  const totalLikes = articles.reduce((s, a) => s + a._count.likes, 0);

  return { user, articles, totalViews, totalLikes };
}

const ARTICLES_PER_PAGE = 9;

export async function getProfileArticlesAction(userId: string, page: number = 1, limit: number = ARTICLES_PER_PAGE) {
  try {
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where: { authorId: userId, status: ArticleStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, title: true, slug: true, summary: true,
          thumbnail: true, thumbnailPosition: true,
          topic: { select: { id: true, slug: true, label: true, emoji: true, color: true } },
          badges: true, readTime: true,
          viewCount: true, publishedAt: true,
          _count: { select: { likes: true, comments: true } },
        },
        skip,
        take: limit,
      }),
      db.article.count({ where: { authorId: userId, status: ArticleStatus.PUBLISHED } }),
    ]);

    return {
      success: true,
      data: articles,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching profile articles:', error);
    return { success: false, data: [], total: 0, totalPages: 0 };
  }
}

export async function updateProfileAction(data: {
  name?: string;
  bio?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  youtubeUrl?: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const user = await db.user.update({
      where: { id: userId },
      data,
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Lỗi cập nhật hồ sơ' };
  }
}
