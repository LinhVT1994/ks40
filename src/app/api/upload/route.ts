import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { uploadToAzure, isAzureConfigured } from '@/lib/azure-storage';

const log = logger.child({ module: 'api/upload' });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE   = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session  = await auth();
  const userId   = session?.user?.id;
  const role     = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite;

  if (role !== 'ADMIN' && !canWrite) {
    log.warn({ userId }, 'Upload bị từ chối: không có quyền');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_SIZE) {
    log.warn({ userId, fileSize: file.size }, 'Upload thất bại: file quá lớn');
    return NextResponse.json({ error: `File quá lớn (tối đa 50MB). File hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB` }, { status: 400 });
  }

  const mimeType = file.type.toLowerCase();
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/x-gif'];
  
  if (!allowed.includes(mimeType) && !file.name.toLowerCase().endsWith('.gif')) {
    log.warn({ userId, fileType: file.type }, 'Upload thất bại: định dạng không hỗ trợ');
    return NextResponse.json({ error: 'Chỉ chấp nhận JPEG, PNG, WebP, GIF' }, { status: 400 });
  }

  const isGif = mimeType === 'image/gif' || mimeType === 'image/x-gif' || file.name.toLowerCase().endsWith('.gif');

  const ext = mimeType === 'image/webp' ? 'webp'
    : mimeType === 'image/png'  ? 'png'
    : isGif  ? 'gif'
    : 'jpg';

  const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  try {
    if (isAzureConfigured()) {
      // ── Azure Blob Storage (production) ───────────────────────────
      const url = await uploadToAzure(buffer, filename, file.type);
      log.info({ userId, fileType: file.type, fileSize: file.size, filename }, 'Upload Azure thành công');
      return NextResponse.json({ url });
    } else {
      // ── Local filesystem (dev fallback) ───────────────────────────
      const localDir  = path.join(UPLOAD_DIR, 'images');
      const localName = path.basename(filename);
      await mkdir(localDir, { recursive: true });
      await writeFile(path.join(localDir, localName), buffer);
      log.info({ userId, fileType: file.type, fileSize: file.size, filename: localName }, 'Upload local thành công');
      return NextResponse.json({ url: `/uploads/images/${localName}` });
    }
  } catch (err) {
    log.error({ err, userId, fileType: file.type }, 'Upload thất bại');
    return NextResponse.json({ error: 'Lỗi server khi lưu file' }, { status: 500 });
  }
}
