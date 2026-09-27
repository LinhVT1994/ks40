import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { cardText, profileInitials, profileMetadata } from '@/lib/profile-og';
import { allowedAvatarUrl, loadProfileAvatar } from '@/lib/profile-og-avatar';
import { SITE_URL } from '@/lib/seo';

const user = { id: 'user-1', name: 'Nguyễn Minh Anh', username: 'minhanh', bio: 'Ghi chép và chia sẻ.', image: null };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('profile share metadata', () => {
  it('uses a dedicated absolute PNG card instead of the raw avatar', () => {
    const data = profileMetadata(user);
    expect(data.openGraph).toMatchObject({ type: 'profile', url: `${SITE_URL}/@minhanh`, images: [{ url: expect.stringMatching(/\/og\/profile\/user-1\?v=[a-f0-9]+$/), width: 1200, height: 630, type: 'image/png' }] });
    expect(data.twitter).toMatchObject({ card: 'summary_large_image' });
  });
  it('changes the card URL when profile text changes', () => {
    expect(profileMetadata(user).openGraph?.images).not.toEqual(profileMetadata({ ...user, bio: 'Updated' }).openGraph?.images);
  });
  it('falls back for absent username, name, bio and avatar', () => {
    expect(profileMetadata({ ...user, name: null, username: null, bio: null }).alternates).toEqual({ canonical: `${SITE_URL}/@user-1` });
    expect(cardText(null, 'Thành viên Lenote', 64)).toBe('Thành viên Lenote');
    expect(profileInitials('Nguyễn Minh Anh')).toBe('NA');
  });
  it('bounds long text without splitting surrogate pairs', () => {
    expect(Array.from(cardText('🙂'.repeat(100), '', 10))).toHaveLength(10);
    expect(cardText('  Ghi\nchép   mỗi ngày ', '', 50)).toBe('Ghi chép mỗi ngày');
  });
});

describe('avatar fetch boundary', () => {
  it.each(['http://127.0.0.1/avatar', 'https://127.0.0.1/avatar', 'https://localhost/avatar', 'https://lh3.googleusercontent.com.evil.test/avatar', 'https://user:password@lh3.googleusercontent.com/avatar', 'https://lh3.googleusercontent.com:444/avatar', 'data:image/png;base64,anything', '/uploads/avatars/../../.env'])('rejects untrusted input %s', async value => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(allowedAvatarUrl(value)).toBeNull();
    expect(await loadProfileAvatar(value)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('allows only the configured Azure account and avatar prefix', () => {
    vi.stubEnv('AZURE_STORAGE_ACCOUNT_NAME', 'testaccount');
    vi.stubEnv('AZURE_STORAGE_CONTAINER_NAME', 'uploads');
    expect(allowedAvatarUrl('https://testaccount.blob.core.windows.net/uploads/avatars/a.png')).not.toBeNull();
    expect(allowedAvatarUrl('https://other.blob.core.windows.net/uploads/avatars/a.png')).toBeNull();
    expect(allowedAvatarUrl('https://testaccount.blob.core.windows.net/uploads/files/secret.png')).toBeNull();
  });
  it('does not follow redirects and falls back on image errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('redirect'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await loadProfileAvatar('https://lh3.googleusercontent.com/avatar')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'error' }));
  });
  it('rejects oversized streamed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { 'content-type': 'image/png' } })));
    expect(await loadProfileAvatar('https://lh3.googleusercontent.com/avatar')).toBeNull();
  });
});
