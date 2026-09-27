import { expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: {
  article: { findMany: vi.fn().mockResolvedValue([]) }, topic: { findMany: vi.fn().mockResolvedValue([]) },
  glossaryTerm: { findMany: vi.fn().mockResolvedValue([{ slug: 'published-term', updatedAt: new Date(0) }]) },
  user: { findMany: vi.fn().mockResolvedValue([]) },
} }));
import { db } from '@/lib/db';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { GET as seed } from '@/app/api/seed-dummy/route';
import { SITE_URL } from '@/lib/seo';

it('only requests published glossary terms and excludes auth pages from sitemap', async () => {
  const map = await sitemap();
  expect(db.glossaryTerm.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED' } }));
  expect(map.map(entry => entry.url)).toContain(`${SITE_URL}/glossary/published-term`);
  expect(map.map(entry => entry.url)).not.toContain(`${SITE_URL}/login`);
  expect(map.map(entry => entry.url)).not.toContain(`${SITE_URL}/register`);
  expect(map.find(entry => entry.url === SITE_URL)?.lastModified).toBeUndefined();
});
it('does not block search crawling before crawlers can see noindex', () => {
  expect(JSON.stringify(robots().rules)).not.toContain('/search');
  expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
});
it('never executes the former public data seeder', () => {
  expect(seed().status).toBe(404);
});
