import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ks40.academy';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow:     ['/', '/article/', '/profile/'],
      disallow:  ['/admin/', '/api/', '/settings/', '/history/', '/bookmarks/', '/notifications/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
