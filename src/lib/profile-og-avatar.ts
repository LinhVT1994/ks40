import 'server-only';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_BYTES = 2 * 1024 * 1024;

export function allowedAvatarUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME || process.env.AZURE_STORAGE_CONNECTION_STRING?.match(/(?:^|;)AccountName=([a-z0-9]+)(?:;|$)/i)?.[1];
    const isAzureAvatar = account && url.hostname === `${account}.blob.core.windows.net` && url.pathname.startsWith(`/${process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads'}/avatars/`);
    if (!['lh3.googleusercontent.com', 'lh4.googleusercontent.com', 'lh5.googleusercontent.com', 'lh6.googleusercontent.com', 'avatars.githubusercontent.com'].includes(url.hostname) && !isAzureAvatar) return null;
    return url;
  } catch { return null; }
}

export async function loadProfileAvatar(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  try {
    let buffer: Buffer;
    if (/^\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/i.test(raw)) {
      const filename = path.join(process.cwd(), 'public', raw);
      if ((await stat(filename)).size > MAX_BYTES) return null;
      buffer = await readFile(filename);
    } else {
      const url = allowedAvatarUrl(raw);
      if (!url) return null;
      // Never follow redirects to an unvalidated host or private network.
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(3000) });
      if (!response.ok || !response.body || !/^image\/(png|jpeg|webp|gif)(;|$)/i.test(response.headers.get('content-type') ?? '') || Number(response.headers.get('content-length') || 0) > MAX_BYTES) {
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
          if (size > MAX_BYTES) return null;
          parts.push(value);
        }
      } finally { await reader.cancel(); }
      buffer = Buffer.concat(parts);
    }
    const png = await sharp(buffer, { limitInputPixels: 16_000_000 }).rotate().resize(280, 280, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch { return null; }
}
