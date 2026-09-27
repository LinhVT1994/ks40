import { createHash } from 'node:crypto';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export type ProfileCardData = { id: string; name: string | null; username: string | null; bio: string | null; image: string | null };

export function cardText(value: string | null, fallback: string, limit: number) {
  const text = (value || fallback).normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
  const chars = Array.from(text);
  return chars.length > limit ? chars.slice(0, limit - 1).join('').trimEnd() + '…' : text;
}

export function profileInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return [words[0], ...(words.length > 1 ? [words.at(-1)!] : [])].map(word => Array.from(word)[0]).join('').toLocaleUpperCase('vi');
}

export function profileMetadata(user: ProfileCardData): Metadata {
  const name = cardText(user.name, 'Thành viên Lenote', 80);
  const description = cardText(user.bio, `Khám phá góc tri thức và những chia sẻ của ${name} trên ${SITE_NAME}.`, 180);
  const url = `${SITE_URL}/@${encodeURIComponent(user.username || user.id)}`;
  // Changes to public profile fields give social crawlers a fresh image URL.
  const version = createHash('sha256').update(JSON.stringify([user.name, user.username, user.bio, user.image])).digest('hex').slice(0, 12);
  const image = { url: `${SITE_URL}/og/profile/${encodeURIComponent(user.id)}?v=${version}`, width: 1200, height: 630, type: 'image/png', alt: `${name} — Góc tri thức trên Lenote` };
  return {
    title: name, description, alternates: { canonical: url },
    openGraph: { title: `${name} | ${SITE_NAME}`, description, type: 'profile', url, siteName: SITE_NAME, locale: 'vi_VN', images: [image] },
    twitter: { card: 'summary_large_image', title: `${name} | ${SITE_NAME}`, description, images: [{ url: image.url, alt: image.alt }] },
  };
}
