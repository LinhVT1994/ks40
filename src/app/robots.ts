import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:    ['/article/', '/profile/', '/topic/', '/explore/', '/topics/', '/glossary/'],
        disallow: ['/admin/', '/api/', '/settings/', '/history/', '/bookmarks/', '/notifications/', '/write/', '/search/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
