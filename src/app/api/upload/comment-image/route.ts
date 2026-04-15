import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { uploadToAzure, isAzureConfigured } from '@/lib/azure-storage';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE   = 2 * 1024 * 1024; // 2 MB
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

  const ext = file.type === 'image/webp' ? 'webp'
    : file.type === 'image/png'  ? 'png'
    : file.type === 'image/gif'  ? 'gif'
    : 'jpg';

  const filename = `comments/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  try {
    if (isAzureConfigured()) {
      const url = await uploadToAzure(buffer, filename, file.type);
      return NextResponse.json({ url });
    } else {
      const localDir  = path.join(UPLOAD_DIR, 'comments');
      const localName = path.basename(filename);
      await mkdir(localDir, { recursive: true });
      await writeFile(path.join(localDir, localName), buffer);
      return NextResponse.json({ url: `/uploads/comments/${localName}` });
    }
  } catch (err) {
    console.error('Comment image upload error:', err);
    return NextResponse.json({ error: 'Lỗi server khi lưu ảnh' }, { status: 500 });
  }
}
