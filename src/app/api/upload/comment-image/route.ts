import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'comments');
const MAX_SIZE   = 2 * 1024 * 1024; // 2 MB / ảnh — comment không cần ảnh lớn
const ALLOWED    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ảnh quá lớn (tối đa 2MB)' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPEG, PNG, WebP, GIF' }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type === 'image/webp' ? 'webp'
    : file.type === 'image/png'  ? 'png'
    : file.type === 'image/gif'  ? 'gif'
    : 'jpg';

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/comments/${filename}` });
}
