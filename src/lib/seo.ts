/**
 * Centralized SEO constants. KHÔNG tạo fallback URL ở chỗ khác —
 * mọi file (layout, sitemap, robots, generateMetadata, JSON-LD) đều phải import từ đây.
 */

export const SITE_URL  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';
export const SITE_NAME = 'Lenote';
export const SITE_DESCRIPTION =
  'Lenote — Nền tảng học tập công nghệ tinh tế. Chia sẻ tri thức chuyên sâu về System Design, AI/ML, DevOps và phát triển sự nghiệp IT dành cho cộng đồng kỹ sư phần mềm Việt Nam.';
export const SITE_KEYWORDS = [
  'Lenote',
  'Lenote.dev',
  'chia sẻ tri thức công nghệ',
  'kỹ sư phần mềm chia sẻ',
  'system design chuyên sâu',
  'kiến trúc phần mềm',
  'digital garden tiếng Việt',
  'second brain cho lập trình viên',
  'phát triển sự nghiệp IT',
  'bài học chuyên sâu AI ML',
  'blog công nghệ tinh tế',
  'tư duy lập trình viên',
  'senior developer tips',
  'viết lách công nghệ',
  'cộng đồng lập trình Việt Nam',
  'hướng dẫn DevOps thực chiến',
];
