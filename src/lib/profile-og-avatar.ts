import 'server-only';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type ImageFolder = 'avatars' | 'covers';

const MAX_BYTES: Record<ImageFolder, number> = { avatars: 2 * 1024 * 1024, covers: 5 * 1024 * 1024 };
const GOOGLE_GITHUB_HOSTS = ['lh3.googleusercontent.com', 'lh4.googleusercontent.com', 'lh5.googleusercontent.com', 'lh6.googleusercontent.com', 'avatars.githubusercontent.com'];

function allowedImageUrl(raw: string, folder: ImageFolder): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME || process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/(?:^|;)AccountName=([a-z0-9]+)(?:;|$)/i)?.[1];
    const isAzureImage = account && url.hostname === `${account}.blob.core.windows.net` && url.pathname.startsWith(`/${process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads'}/${folder}/`);
    // Social-provider avatars are only valid as avatars, never as covers.
    const isProviderAvatar = folder === 'avatars' && GOOGLE_GITHUB_HOSTS.includes(url.hostname);
    if (!isProviderAvatar && !isAzureImage) return null;
    return url;
  } catch { return null; }
}

export function allowedAvatarUrl(raw: string): URL | null {
  return allowedImageUrl(raw, 'avatars');
}

export function allowedCoverUrl(raw: string): URL | null {
  return allowedImageUrl(raw, 'covers');
}

/** Load a stored avatar/cover from local uploads or an allow-listed host and return it as a PNG data URL. */
async function loadProfileImage(raw: string | null, folder: ImageFolder, width: number, height: number): Promise<string | null> {
  if (!raw) return null;
  const maxBytes = MAX_BYTES[folder];
  try {
    let buffer: Buffer;
    if (new RegExp(`^/uploads/${folder}/[a-zA-Z0-9_-]+\\.(png|jpe?g|webp|gif)$`, 'i').test(raw)) {
      const filename = path.join(process.cwd(), 'public', raw);
      if ((await stat(filename)).size > maxBytes) return null;
      buffer = await readFile(filename);
    } else {
      const url = allowedImageUrl(raw, folder);
      if (!url) return null;
      // Never follow redirects to an unvalidated host or private network.
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(3000) });
      if (!response.ok || !response.body || !/^image\/(png|jpeg|webp|gif)(;|$)/i.test(response.headers.get('content-type') ?? '') || Number(response.headers.get('content-length') || 0) > maxBytes) {
        await response.body?.cancel();
        return null;
      }
      const reader = response.body.getReader();
      const parts: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > maxBytes) return null;
          parts.push(value);
        }
      } finally { await reader.cancel(); }
      buffer = Buffer.concat(parts);
    }
    const png = await sharp(buffer, { limitInputPixels: 40_000_000 }).rotate().resize(width, height, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch { return null; }
}

export function loadProfileAvatar(raw: string | null) {
  return loadProfileImage(raw, 'avatars', 280, 280);
}

export function loadProfileCover(raw: string | null) {
  return loadProfileImage(raw, 'covers', 1136, 250);
}
