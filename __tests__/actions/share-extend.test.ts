import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { sharedPackage: { findUnique: vi.fn(), update: vi.fn() } } }));
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { extendSharedPackageAction } from '@/features/admin/actions/share';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-27T00:00:00Z').getTime();
const setSession = (role?: string) => vi.mocked(auth).mockResolvedValue(role ? { user: { id: 'u', role } } as never : null as never);
const setExpiry = (expiresAt: Date | null) => vi.mocked(db.sharedPackage.findUnique).mockResolvedValue({ expiresAt } as never);

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  setSession('ADMIN');
});

describe('extendSharedPackageAction', () => {
  it.each([undefined, 'MEMBER', 'PREMIUM'])('denies %s', async role => {
    setSession(role);
    await expect(extendSharedPackageAction('p', '7d')).rejects.toThrow('Unauthorized');
    expect(db.sharedPackage.update).not.toHaveBeenCalled();
  });
  it('extends an active package from its current expiry', async () => {
    setExpiry(new Date(NOW + 3 * DAY));
    const res = await extendSharedPackageAction('p', '7d');
    expect(res).toEqual({ success: true, expiresAt: new Date(NOW + 10 * DAY) });
    expect(db.sharedPackage.update).toHaveBeenCalledWith({ where: { id: 'p' }, data: { expiresAt: new Date(NOW + 10 * DAY) } });
  });
  it('extends an expired package from now', async () => {
    setExpiry(new Date(NOW - 5 * DAY));
    expect(await extendSharedPackageAction('p', '1d')).toEqual({ success: true, expiresAt: new Date(NOW + DAY) });
  });
  it('removes the expiry for never', async () => {
    setExpiry(new Date(NOW + DAY));
    expect(await extendSharedPackageAction('p', 'never')).toEqual({ success: true, expiresAt: null });
  });
  it('rejects unknown options and missing packages', async () => {
    expect(await Reflect.apply(extendSharedPackageAction, null, ['p', '9999d'])).toEqual({ success: false });
    expect(await Reflect.apply(extendSharedPackageAction, null, ['p', '__proto__'])).toEqual({ success: false });
    setExpiry(null);
    vi.mocked(db.sharedPackage.findUnique).mockResolvedValue(null);
    expect(await extendSharedPackageAction('missing', '7d')).toEqual({ success: false });
    expect(db.sharedPackage.update).not.toHaveBeenCalled();
  });
});
