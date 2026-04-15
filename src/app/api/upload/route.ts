import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'api/upload' });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const role = (session?.user as { role?: string })?.role;
  const canWrite = (session?.user as { canWrite?: boolean })?.canWrite;

  if (role !== 'ADMIN' && !canWrite) {
    log.warn({ userId }, 'Upload bị từ chối: không có quyền');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_SIZE) {
    log.warn({ userId, fileSize: file.size, fileType: file.type }, 'Upload thất bại: file quá lớn');
    return NextResponse.json({ error: 'File quá lớn (tối đa 10MB)' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    log.warn({ userId, fileType: file.type }, 'Upload thất bại: định dạng không hỗ trợ');
    return NextResponse.json({ error: 'Chỉ chấp nhận JPEG, PNG, WebP, GIF' }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type === 'image/webp' ? 'webp'
    : file.type === 'image/png' ? 'png'
    : file.type === 'image/gif' ? 'gif'
    : 'jpg';

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    log.info({ userId, fileType: file.type, fileSize: file.size, filename }, 'Upload thành công');
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    log.error({ err, userId, fileType: file.type, fileSize: file.size }, 'Upload thất bại: lỗi ghi file');
    return NextResponse.json({ error: 'Lỗi server khi lưu file' }, { status: 500 });
  }
}
