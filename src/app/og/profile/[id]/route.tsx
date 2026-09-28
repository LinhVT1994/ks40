import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/db';
import { loadProfileAvatar, loadProfileCover } from '@/lib/profile-og-avatar';
import { DEFAULT_COVER_BACKGROUND, resolveCover } from '@/lib/profile-covers';
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
  const user = await db.user.findFirst({ where: { id, status: 'ACTIVE' }, select: { id: true, name: true, username: true, bio: true, image: true, coverImage: true } });
  if (!user) return new Response(null, { status: 404 });
  const cover = resolveCover(user.coverImage);
  const [[serif, sans], avatar, coverPhoto] = await Promise.all([
    loadFonts(),
    loadProfileAvatar(user.image),
    cover.kind === 'image' ? loadProfileCover(cover.url) : Promise.resolve(null),
  ]);
  // An uploaded cover that can't be loaded falls back to the default preset.
  const coverBackground = coverPhoto ? null : (cover.kind === 'preset' ? cover.background : DEFAULT_COVER_BACKGROUND);
  return new ImageResponse(<ProfileShareCard user={user} avatar={avatar} coverPhoto={coverPhoto} coverBackground={coverBackground} />, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Gentium', data: serif, weight: 400, style: 'normal' },
      { name: 'BeVietnam', data: sans, weight: 400, style: 'normal' },
    ],
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300', 'X-Content-Type-Options': 'nosniff' },
  });
}
