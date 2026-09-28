import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: { user: { findFirst: vi.fn() } } }));
vi.mock('@/lib/profile-og-avatar', () => ({ loadProfileAvatar: vi.fn().mockResolvedValue(null) }));
import { db } from '@/lib/db';
import { GET } from '@/app/og/profile/[id]/route';

beforeEach(() => vi.clearAllMocks());
it.each(['../secret', 'https://localhost', 'a'.repeat(81)])('rejects invalid card identifier %s', async id => {
  const result = await GET(new Request('https://example.test'), { params: Promise.resolve({ id }) });
  expect(result.status).toBe(404);
  expect(db.user.findFirst).not.toHaveBeenCalled();
});
it('queries only public fields of active profiles and returns 404 for unavailable users', async () => {
  vi.mocked(db.user.findFirst).mockResolvedValue(null);
  const result = await GET(new Request('https://example.test'), { params: Promise.resolve({ id: 'user-1' }) });
  expect(result.status).toBe(404);
  expect(db.user.findFirst).toHaveBeenCalledWith({ where: { id: 'user-1', status: 'ACTIVE' }, select: { id: true, name: true, username: true, bio: true, image: true, coverImage: true } });
});
