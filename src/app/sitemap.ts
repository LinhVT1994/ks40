import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${SITE_URL}/login`,    changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic article routes (exclude PRIVATE)
  const articles = await db.article.findMany({
    where:  { status: 'PUBLISHED', audience: { not: 'PRIVATE' } },
    select: { slug: true, updatedAt: true, audience: true, authorId: true },
    orderBy: { publishedAt: 'desc' },
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map(a => ({
    url:             `${SITE_URL}/article/${a.slug}`,
    lastModified:    a.updatedAt,
    changeFrequency: 'weekly',
    priority:        a.audience === 'PUBLIC' ? 0.8 : 0.6,
  }));

  // Topic routes — only enabled topics that có ít nhất 1 published non-private article
  const topics = await db.topic.findMany({
    where: {
      enabled:  true,
      articles: { some: { status: 'PUBLISHED', audience: { not: 'PRIVATE' } } },
    },
    select: { slug: true },
  });

  const topicRoutes: MetadataRoute.Sitemap = topics.map(t => ({
    url:             `${SITE_URL}/topic/${t.slug}`,
    changeFrequency: 'weekly',
    priority:        0.6,
  }));

  // Profile routes — chỉ tác giả có bài public (đã lấy từ articles ở trên)
  const authorIds = Array.from(new Set(articles.map(a => a.authorId))).filter(Boolean);
  const profileRoutes: MetadataRoute.Sitemap = authorIds.map(id => ({
    url:             `${SITE_URL}/profile/${id}`,
    changeFrequency: 'weekly',
    priority:        0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...topicRoutes, ...profileRoutes];
}
