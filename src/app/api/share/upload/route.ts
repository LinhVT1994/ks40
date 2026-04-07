import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleAudience } from '@prisma/client';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'shared');
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')        // xoá dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'd') // đ đặc biệt
    .replace(/[^a-z0-9\s-]/g, '')           // bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')                   // khoảng trắng → -
    .replace(/-+/g, '-');                   // gộp nhiều -
}

function buildSlug(title: string) {
  const base = slugify(title).slice(0, 60);
  const ts = Date.now().toString(36);
  return `${base}-${ts}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const title       = (formData.get('title') as string)?.trim();
  const customSlug  = (formData.get('slug') as string | null)?.trim() || null;
  const description = (formData.get('description') as string | null)?.trim() || undefined;
  const expiresIn   = (formData.get('expiresIn') as string | null) ?? 'never';
  const audience    = (formData.get('audience') as ArticleAudience | null) ?? ArticleAudience.PUBLIC;
  const rawFiles    = formData.getAll('files') as File[];

  if (!title) return NextResponse.json({ error: 'Thiếu tiêu đề' }, { status: 400 });
  if (rawFiles.length === 0) return NextResponse.json({ error: 'Chưa có file nào' }, { status: 400 });

  await mkdir(UPLOAD_DIR, { recursive: true });

  const savedFiles: { name: string; url: string; size: number; mimeType: string }[] = [];

  for (const file of rawFiles) {
    if (file.size > MAX_SIZE) continue; // bỏ qua file quá lớn
    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    savedFiles.push({
      name:     file.name,
      url:      `/uploads/shared/${filename}`,
      size:     file.size,
      mimeType: file.type || 'application/octet-stream',
    });
  }

  if (savedFiles.length === 0) return NextResponse.json({ error: 'Không có file hợp lệ' }, { status: 400 });

  // Dùng custom slug nếu có, không thì tự tạo từ title + timestamp
  let slug = customSlug ?? buildSlug(title);
  // Đảm bảo unique
  while (await db.sharedPackage.findUnique({ where: { slug } })) {
    slug = buildSlug(title); // fallback sang auto nếu custom bị trùng
  }

  const expiresAt = expiresIn !== 'never'
    ? new Date(Date.now() + ({ '1d': 1, '7d': 7, '30d': 30 }[expiresIn] ?? 7) * 24 * 60 * 60 * 1000)
    : null;

  const pkg = await db.sharedPackage.create({
    data: {
      slug, title, description, audience, expiresAt,
      uploadedById: user.id!,
      files: { create: savedFiles },
    },
  });

  return NextResponse.json({ slug: pkg.slug, url: `/shared/docs/${pkg.slug}` });
}
