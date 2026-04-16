import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { uploadToAzure, isAzureConfigured } from '@/lib/azure-storage';
import { db } from '@/lib/db';

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

  const filename = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  try {
    let url = '';
    if (isAzureConfigured()) {
      url = await uploadToAzure(buffer, filename, file.type);
    } else {
      const localDir  = path.join(UPLOAD_DIR, 'avatars');
      const localName = path.basename(filename);
      await mkdir(localDir, { recursive: true });
      await writeFile(path.join(localDir, localName), buffer);
      url = `/uploads/avatars/${localName}`;
    }

    // Update avatar immediately in DB
    await db.user.update({
      where: { id: userId },
      data: { image: url }
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Lỗi server khi lưu ảnh' }, { status: 500 });
  }
}
