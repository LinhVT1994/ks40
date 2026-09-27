import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin', '/api/', '/settings', '/history', '/bookmarks', '/notifications', '/write', '/onboarding'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
