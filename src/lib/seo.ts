/**
 * Centralized SEO constants. KHÔNG tạo fallback URL ở chỗ khác —
 * mọi file (layout, sitemap, robots, generateMetadata, JSON-LD) đều phải import từ đây.
 */

export const SITE_URL  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';
export const SITE_NAME = 'Lenote';
export const SITE_DESCRIPTION =
  'Lenote — Nền tảng học tập công nghệ — System Design, AI/ML, DevOps, Frontend, Backend.';
