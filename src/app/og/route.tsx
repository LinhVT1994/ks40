import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  SYSTEM_DESIGN: { bg: '#eff6ff', text: '#2563eb' },
  AI_ML:         { bg: '#f5f3ff', text: '#7c3aed' },
  DEVOPS:        { bg: '#fff7ed', text: '#ea580c' },
  BLOCKCHAIN:    { bg: '#fffbeb', text: '#d97706' },
  FRONTEND:      { bg: '#f0f9ff', text: '#0284c7' },
  BACKEND:       { bg: '#f0fdf4', text: '#16a34a' },
  OTHER:         { bg: '#f8fafc', text: '#64748b' },
};

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design',
  AI_ML:         'AI / ML',
  DEVOPS:        'DevOps',
  BLOCKCHAIN:    'Blockchain',
  FRONTEND:      'Frontend',
  BACKEND:       'Backend',
  OTHER:         'Khác',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title    = searchParams.get('title')    ?? 'Lenote.dev';
  const author   = searchParams.get('author')   ?? '';
  const category = searchParams.get('category') ?? 'OTHER';

  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER;
  const label = CATEGORY_LABELS[category] ?? category;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '60px 72px',
          backgroundColor: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top — site name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 16,
          }}>L</div>
          <span style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600 }}>Lenote.dev</span>
        </div>

        {/* Middle — title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            fontSize: 14, fontWeight: 700,
            padding: '6px 14px', borderRadius: 999,
            backgroundColor: color.bg, color: color.text,
          }}>
            {label}
          </span>
          <div style={{
            fontSize: title.length > 60 ? 36 : title.length > 40 ? 42 : 52,
            fontWeight: 800, color: '#f1f5f9',
            lineHeight: 1.2, maxWidth: 900,
          }}>
            {title}
          </div>
        </div>

        {/* Bottom — author + divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {author && (
            <span style={{ color: '#64748b', fontSize: 16 }}>
              Tác giả: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{author}</span>
            </span>
          )}
          <div style={{ width: 120, height: 3, backgroundColor: '#6366f1', borderRadius: 999, marginLeft: 'auto' }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
