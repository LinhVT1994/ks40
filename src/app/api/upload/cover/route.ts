import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { uploadToAzure, isAzureConfigured } from '@/lib/azure-storage';
import { db } from '@/lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE   = 5 * 1024 * 1024; // 5 MB — covers are wide images

// Detect the real type from magic bytes instead of trusting the client-sent MIME.
function sniffImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

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
    return NextResponse.json({ error: 'Ảnh quá lớn (tối đa 5MB)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type   = sniffImageType(buffer);
  if (!type) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPEG, PNG, WebP' }, { status: 400 });
  }

  const filename = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${type.ext}`;

  try {
    let url = '';
    if (isAzureConfigured()) {
      url = await uploadToAzure(buffer, filename, type.mime);
    } else {
      const localDir  = path.join(UPLOAD_DIR, 'covers');
      const localName = path.basename(filename);
      await mkdir(localDir, { recursive: true });
      await writeFile(path.join(localDir, localName), buffer);
      url = `/uploads/covers/${localName}`;
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { coverImage: url },
      select: { id: true, username: true },
    });
    revalidatePath('/me');
    revalidatePath(`/@${user.username || user.id}`);

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Cover upload error:', err);
    return NextResponse.json({ error: 'Lỗi server khi lưu ảnh' }, { status: 500 });
  }
}
