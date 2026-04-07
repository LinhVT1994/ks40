import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ks40.academy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE_URL}/login`,    changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic article routes (exclude PRIVATE)
  const articles = await db.article.findMany({
    where:  { status: 'PUBLISHED', audience: { not: 'PRIVATE' } },
    select: { slug: true, updatedAt: true, audience: true },
    orderBy: { publishedAt: 'desc' },
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map(a => ({
    url:             `${BASE_URL}/article/${a.slug}`,
    lastModified:    a.updatedAt,
    changeFrequency: 'weekly',
    priority:        a.audience === 'PUBLIC' ? 0.8 : 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
