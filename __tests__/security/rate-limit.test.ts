import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: { $queryRaw: vi.fn() } }));
import { db } from '@/lib/db';
import { allowAuthAttempt } from '@/lib/rate-limit';
beforeEach(() => vi.resetAllMocks());
it('rejects attempts above the per-account limit', async () => {
  vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([{ count: 11 }]);
  expect(await allowAuthAttempt('login', 'a@example.test')).toBe(false);
});
it('caps unique-identifier attacks before creating an account counter', async () => {
  vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ count: 601 }]);
  expect(await allowAuthAttempt('login', 'a@example.test')).toBe(false);
  expect(db.$queryRaw).toHaveBeenCalledTimes(1);
});
it('fails closed when the rate-limit store is unavailable', async () => {
  vi.mocked(db.$queryRaw).mockRejectedValue(new Error('offline'));
  expect(await allowAuthAttempt('forgot', 'a@example.test')).toBe(false);
});
it('allows a valid attempt without storing the raw email', async () => {
  vi.mocked(db.$queryRaw).mockResolvedValue([{ count: 1 }]);
  expect(await allowAuthAttempt('login', 'a@example.test')).toBe(true);
  expect(JSON.stringify(vi.mocked(db.$queryRaw).mock.calls)).not.toContain('a@example.test');
});
