import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@/lib/notifications', () => ({ createNotificationAction: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  tag: { create: vi.fn() }, occupationOption: { delete: vi.fn() },
  glossaryTerm: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn(), findUnique: vi.fn() },
  article: { findFirst: vi.fn(), findUnique: vi.fn() },
} }));
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createTagAction } from '@/features/admin/actions/taxonomy';
import { deleteOccupationOptionAction } from '@/features/admin/actions/occupation';
import { getGlossaryTermsAction, getGlossaryTermByIdAction } from '@/features/admin/actions/glossary';
import { getArticleBySlugStaticAction, getArticleUserInteractionAction } from '@/features/articles/actions/article';
import { getSiteConfigAction, setSiteConfigAction } from '@/features/admin/actions/config';

const setSession = (role?: string) => vi.mocked(auth).mockResolvedValue(role ? { user: { id: 'current-user', role } } as never : null as never);
beforeEach(() => {
  vi.resetAllMocks();
  setSession();
  vi.mocked(db.glossaryTerm.findMany).mockResolvedValue([]);
  vi.mocked(db.glossaryTerm.count).mockResolvedValue(0);
  vi.mocked(db.glossaryTerm.groupBy).mockResolvedValue([]);
});
describe('server action boundaries', () => {
  it.each([undefined, 'MEMBER', 'PREMIUM'])('denies admin actions for %s', async role => {
    setSession(role);
    await expect(createTagAction('injected')).rejects.toThrow('Unauthorized');
    await expect(deleteOccupationOptionAction('id')).rejects.toThrow('Unauthorized');
    await expect(getGlossaryTermByIdAction('draft')).rejects.toThrow('Unauthorized');
    await expect(getSiteConfigAction('site_announcement')).rejects.toThrow('Unauthorized');
    await expect(setSiteConfigAction('site_announcement', {})).rejects.toThrow('Unauthorized');
    expect(db.tag.create).not.toHaveBeenCalled();
    expect(db.occupationOption.delete).not.toHaveBeenCalled();
    expect(db.glossaryTerm.findUnique).not.toHaveBeenCalled();
  });
  it('ignores forged glossary admin flag and draft filter', async () => {
    await getGlossaryTermsAction({ isAdmin: true, status: 'DRAFT', limit: 10000 });
    expect(db.glossaryTerm.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED' }), take: 100 }));
    expect(db.glossaryTerm.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED' } }));
  });
  it('gets article role from session, not a forged extra argument', async () => {
    await Reflect.apply(getArticleBySlugStaticAction, null, ['secret', 'ADMIN']);
    expect(db.article.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED', audience: { in: ['PUBLIC'] } }) }));
  });
  it('does not let a guest query another user interactions', async () => {
    expect(await Reflect.apply(getArticleUserInteractionAction, null, ['article', 'victim'])).toEqual({ isLiked: false, isBookmarked: false });
    expect(db.article.findUnique).not.toHaveBeenCalled();
  });
  it('uses the signed-in user for interaction lookups', async () => {
    setSession('MEMBER');
    await Reflect.apply(getArticleUserInteractionAction, null, ['article', 'victim']);
    expect(db.article.findUnique).toHaveBeenCalledWith(expect.objectContaining({ select: expect.objectContaining({ likes: { where: { userId: 'current-user' }, select: { userId: true } } }) }));
  });
  it('does not allow configuration actions to overwrite internal rate limits', async () => {
    setSession('ADMIN');
    await expect(setSiteConfigAction('rate-limit:login:global', {})).rejects.toThrow('Invalid configuration key');
  });
});
