import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextAuthConfig } from 'next-auth';
const captured = vi.hoisted(() => ({ config: null as NextAuthConfig | null }));
vi.mock('next-auth', () => ({ default: (config: NextAuthConfig) => { captured.config = config; return {}; } }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn(), upsert: vi.fn() } } }));
vi.mock('@/lib/rate-limit', () => ({ allowAuthAttempt: vi.fn() }));
import { db } from '@/lib/db';
import '@/auth';

const activeUser = { id: 'u1', name: 'User', role: 'MEMBER', status: 'ACTIVE', password: 'hash-one', onboarding: { completedAt: null, skippedAt: null } };
async function jwt(args: unknown) { return captured.config!.callbacks!.jwt!(args as never); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(db.user.findUnique).mockResolvedValue(activeUser as never);
});
describe('session revocation', () => {
  it.each(['LOCKED', 'deleted', 'database-error'])('fails closed for %s', async scenario => {
    const token = await jwt({ token: { email: 'test@example.test' }, user: { email: 'test@example.test' } });
    if (scenario === 'database-error') vi.mocked(db.user.findUnique).mockRejectedValue(new Error('unavailable'));
    else vi.mocked(db.user.findUnique).mockResolvedValue(scenario === 'deleted' ? null : { ...activeUser, status: 'LOCKED' } as never);
    expect(await jwt({ token })).toBeNull();
  });
  it('invalidates existing JWTs after a password change', async () => {
    const token = await jwt({ token: { email: 'test@example.test' }, user: { email: 'test@example.test' } });
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...activeUser, password: 'hash-two' } as never);
    expect(await jwt({ token })).toBeNull();
  });
  it('does not trust session.update input', async () => {
    const token = await jwt({ token: { email: 'test@example.test' }, user: { email: 'test@example.test' } });
    const updated = await jwt({ token, trigger: 'update', session: { role: 'ADMIN', onboardingDone: true } });
    expect(updated).toMatchObject({ role: 'MEMBER', onboardingDone: false });
  });
  it('refreshes roles without waiting for a cache interval', async () => {
    const token = await jwt({ token: { email: 'test@example.test' }, user: { email: 'test@example.test' } });
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...activeUser, role: 'PREMIUM' } as never);
    expect(await jwt({ token })).toMatchObject({ role: 'PREMIUM' });
  });
  it('uses an absolute 24h lifetime when remember-me is disabled', async () => {
    expect(await jwt({ token: { remember: false, sessionStartedAt: Date.now() / 1000 - 86401, iat: Date.now() / 1000 } })).toBeNull();
  });
  it('rejects old JWTs without a credential version', async () => {
    expect(await jwt({ token: { email: 'test@example.test' } })).toBeNull();
  });
  it('denies Google login for locked accounts or unverified email', async () => {
    const signIn = captured.config!.callbacks!.signIn!;
    expect(await signIn({ account: { provider: 'google' }, user: { email: 'test@example.test' }, profile: { email_verified: false } } as never)).toBe(false);
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...activeUser, status: 'LOCKED' } as never);
    expect(await signIn({ account: { provider: 'google' }, user: { email: 'test@example.test' }, profile: { email_verified: true } } as never)).toBe(false);
    expect(db.user.upsert).not.toHaveBeenCalled();
  });
});
