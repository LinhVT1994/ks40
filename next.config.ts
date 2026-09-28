import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next 16 blocks dev assets/HMR for non-localhost origins; allow loopback IP, LAN IP and our domain.
  allowedDevOrigins: ['127.0.0.1', '192.168.1.60', 'lenote.dev', '*.lenote.dev'],
  outputFileTracingIncludes: { '/og/profile/*': ['./src/assets/fonts/*.ttf'] },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next hydration and the existing analytics snippet currently use inline scripts.
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com`,
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https: ${process.env.NODE_ENV === 'development' ? 'ws: wss:' : ''}`,
      "frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "media-src 'self' blob: https:",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ].join('; ');
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
    ] }];
  },
  output: 'standalone',
  images: {
    localPatterns: [
      { pathname: '/*' },
      { pathname: '/uploads/images/**' },
      { pathname: '/uploads/avatars/**' },
      { pathname: '/uploads/comments/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Azure Blob Storage
      { protocol: 'https', hostname: '**.blob.core.windows.net' },
    ],
  },
};

export default nextConfig;
