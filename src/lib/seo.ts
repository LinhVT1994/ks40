/**
 * Centralized SEO constants. KHÔNG tạo fallback URL ở chỗ khác —
 * mọi file (layout, sitemap, robots, generateMetadata, JSON-LD) đều phải import từ đây.
 */

export const SITE_URL  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';
export const SITE_NAME = 'Lenote';
export const SITE_DESCRIPTION =
  'Nền tảng chia sẻ tri thức và kinh nghiệm đa góc nhìn. Từ những bài học chuyên môn sâu sắc đến những câu chuyện đời sống, cùng nhau lưu giữ và lan tỏa giá trị mỗi ngày.';
export const SITE_KEYWORDS = [
  'Lenote',
  'digital garden',
  'second brain',
  'chia sẻ tri thức',
  'kinh nghiệm sống',
  'bài học chuyên môn',
  'lan tỏa giá trị',
  'phát triển bản thân',
  'tư duy lập trình viên',
  'phát triển sự nghiệp IT',
  'blog công nghệ',
  'kỹ sư chia sẻ',
  'system design chuyên sâu',
  'viết lách công nghệ',
  'kiến trúc phần mềm',
  'senior developer',
];
