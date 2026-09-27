import 'server-only';
import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';

const PRIVATE_ROOT = path.join(process.cwd(), 'storage', 'private');
const PRIVATE_CONTAINER = process.env.AZURE_PRIVATE_CONTAINER_NAME ?? 'private-documents';
const KEY = /^(files|shared)\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

function service() {
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connection) throw new Error('Storage unavailable');
  return BlobServiceClient.fromConnectionString(connection);
}

export async function storePrivateFile(buffer: Buffer, group: 'files' | 'shared', extension: string, mime: string) {
  const key = `${group}/${randomUUID()}.${extension}`;
  if (!KEY.test(key)) throw new Error('Invalid storage key');
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    if (PRIVATE_CONTAINER === (process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads')) throw new Error('Private and public containers must differ');
    const container = service().getContainerClient(PRIVATE_CONTAINER);
    await container.createIfNotExists();
    if ((await container.getProperties()).blobPublicAccess) throw new Error('Private container has public access');
    await container.getBlockBlobClient(key).uploadData(buffer, { blobHTTPHeaders: { blobContentType: mime, blobContentDisposition: 'attachment' } });
    return `azure-private:${key}`;
  }
  await mkdir(path.join(PRIVATE_ROOT, group), { recursive: true });
  await writeFile(path.join(PRIVATE_ROOT, key), buffer, { flag: 'wx', mode: 0o600 });
  return `private:${key}`;
}

// Only call AFTER authorizing the associated article/package. No arbitrary fetch/SSRF.
export async function downloadStoredFile(file: { url: string; name: string }) {
  let body: ReadableStream;
  let size: number | undefined;
  if (file.url.startsWith('azure-private:') || file.url.startsWith('https://')) {
    const client = service();
    let containerName = PRIVATE_CONTAINER;
    let key = file.url.slice('azure-private:'.length);
    if (file.url.startsWith('https://')) {
      // Compatibility for existing Azure documents; migration must revoke their public URLs.
      const url = new URL(file.url);
      containerName = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads';
      const expected = client.getContainerClient(containerName).url;
      if (url.search || !file.url.startsWith(`${expected}/`)) throw new Error('Unsupported legacy URL');
      key = decodeURIComponent(file.url.slice(expected.length + 1));
    }
    if (!KEY.test(key)) throw new Error('Invalid storage key');
    const result = await client.getContainerClient(containerName).getBlobClient(key).download();
    if (!result.readableStreamBody) throw new Error('Empty download');
    body = Readable.toWeb(result.readableStreamBody as Readable) as ReadableStream;
    size = result.contentLength;
  } else {
    const legacy = file.url.startsWith('/uploads/');
    const key = legacy ? file.url.slice('/uploads/'.length) : file.url.startsWith('private:') ? file.url.slice('private:'.length) : '';
    if (!KEY.test(key)) throw new Error('Invalid storage key');
    const location = path.join(legacy ? path.join(process.cwd(), 'public', 'uploads') : PRIVATE_ROOT, key);
    size = (await stat(location)).size;
    body = Readable.toWeb(createReadStream(location)) as ReadableStream;
  }
  const safeName = encodeURIComponent(file.name.replace(/[\r\n]/g, '')).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);
  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="download"; filename*=UTF-8''${safeName}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'X-Robots-Tag': 'noindex, nofollow',
  });
  if (size !== undefined) headers.set('Content-Length', String(size));
  return new Response(body, { headers });
}
