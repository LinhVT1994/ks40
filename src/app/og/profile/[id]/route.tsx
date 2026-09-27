import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/db';
import { loadProfileAvatar } from '@/lib/profile-og-avatar';
import ProfileShareCard from '@/components/shared/ProfileShareCard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let fonts: Promise<Buffer[]> | undefined;
function loadFonts() {
  return fonts ??= Promise.all([
    readFile(path.join(process.cwd(), 'src/assets/fonts/GentiumBookPlus-Regular.ttf')),
    readFile(path.join(process.cwd(), 'src/assets/fonts/BeVietnamPro-Regular.ttf')),
  ]).catch(error => { fonts = undefined; throw error; });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return new Response(null, { status: 404 });
  // Public fields only. Never accept arbitrary text/image URLs in the request.
  const user = await db.user.findFirst({ where: { id, status: 'ACTIVE' }, select: { id: true, name: true, username: true, bio: true, image: true } });
  if (!user) return new Response(null, { status: 404 });
  const [[serif, sans], avatar] = await Promise.all([loadFonts(), loadProfileAvatar(user.image)]);
  return new ImageResponse(<ProfileShareCard user={user} avatar={avatar} />, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Gentium', data: serif, weight: 400, style: 'normal' },
      { name: 'BeVietnam', data: sans, weight: 400, style: 'normal' },
    ],
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300', 'X-Content-Type-Options': 'nosniff' },
  });
}
