import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/private-files', () => ({ downloadStoredFile: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { resource: { findUnique: vi.fn() }, sharedFile: { findUnique: vi.fn() } } }));
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { downloadStoredFile } from '@/lib/private-files';
import { GET } from '@/app/api/download/[kind]/[id]/route';
const request = (kind = 'resource') => GET(new Request('https://example.test'), { params: Promise.resolve({ kind, id: 'file1' }) });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth).mockResolvedValue(null as never);
  vi.mocked(downloadStoredFile).mockResolvedValue(new Response('file'));
});
describe('download authorization at the byte-serving endpoint', () => {
  it.each(['MEMBERS', 'PREMIUM', 'PRIVATE'])('denies guests for %s', async audience => {
    vi.mocked(db.resource.findUnique).mockResolvedValue({ article: { audience, status: 'PUBLISHED' } } as never);
    expect((await request()).status).toBe(404);
    expect(downloadStoredFile).not.toHaveBeenCalled();
  });
  it('denies published premium files to regular members', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role: 'MEMBER' } } as never);
    vi.mocked(db.resource.findUnique).mockResolvedValue({ article: { audience: 'PREMIUM', status: 'PUBLISHED' } } as never);
    expect((await request()).status).toBe(404);
  });
  it('denies public files belonging to drafts', async () => {
    vi.mocked(db.resource.findUnique).mockResolvedValue({ article: { audience: 'PUBLIC', status: 'DRAFT' } } as never);
    expect((await request()).status).toBe(404);
  });
  it('serves published public files', async () => {
    vi.mocked(db.resource.findUnique).mockResolvedValue({ article: { audience: 'PUBLIC', status: 'PUBLISHED' } } as never);
    expect((await request()).status).toBe(200);
    expect(downloadStoredFile).toHaveBeenCalledOnce();
  });
  it('checks package expiry even for a previously copied URL', async () => {
    vi.mocked(db.sharedFile.findUnique).mockResolvedValue({ package: { audience: 'PUBLIC', expiresAt: new Date(0) } } as never);
    expect((await request('shared')).status).toBe(404);
    expect(downloadStoredFile).not.toHaveBeenCalled();
  });
  it('checks shared-package audience', async () => {
    vi.mocked(db.sharedFile.findUnique).mockResolvedValue({ package: { audience: 'PRIVATE', expiresAt: null } } as never);
    expect((await request('shared')).status).toBe(404);
  });
  it('rejects unknown download kinds', async () => {
    expect((await request('unknown')).status).toBe(404);
  });
});
