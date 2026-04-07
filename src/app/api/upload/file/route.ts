import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED: Record<string, string> = {
  'application/zip':                                                        'zip',
  'application/x-zip-compressed':                                           'zip',
  'application/x-zip':                                                      'zip',
  'application/pdf':                                                        'pdf',
  'application/msword':                                                     'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx',
  'application/vnd.ms-excel':                                               'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':      'xlsx',
  'text/plain':                                                             'txt',
  'application/x-tar':                                                      'tar',
  'application/gzip':                                                       'gz',
  'application/x-rar-compressed':                                           'rar',
  'application/x-7z-compressed':                                            '7z',
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File quá lớn (tối đa 100MB)' }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: 'Định dạng không được hỗ trợ' }, { status: 400 });

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({
    url:      `/uploads/${filename}`,
    name:     file.name,
    size:     file.size,
    mimeType: file.type,
  });
}
