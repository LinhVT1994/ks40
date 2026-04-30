import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title  = searchParams.get('title')  ?? 'Lenote.dev';
  const author = searchParams.get('author') ?? '';
  const label  = searchParams.get('topic')  ?? '';
  const color  = searchParams.get('color')  ?? '#64748b';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '80px 100px',
          backgroundColor: '#080a16',
          backgroundImage: 'radial-gradient(circle at 0% 0%, #3b82f615 0%, transparent 50%), radial-gradient(circle at 100% 100%, #a855f715 0%, transparent 50%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top — site name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 24,
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          }}>L</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '0.05em' }}>LENOTE</span>
            <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Deep Tech & Knowledge</span>
          </div>
        </div>

        {/* Middle — title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, justifyContent: 'center' }}>
          {label && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, backgroundColor: color, borderRadius: 999 }} />
                <span style={{
                    fontSize: 18, fontWeight: 700,
                    color, textTransform: 'uppercase', letterSpacing: '0.1em'
                }}>
                    {label}
                </span>
            </div>
          )}
          <div style={{
            fontSize: title.length > 60 ? 42 : title.length > 40 ? 52 : 64,
            fontWeight: 900, color: 'white',
            lineHeight: 1.1, maxWidth: 1000,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {title}
          </div>
        </div>

        {/* Bottom — author + branding */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>Tác giả</span>
            <span style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700 }}>{author || 'Lenote Team'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#3b82f6' }} />
             <span style={{ color: '#3b82f6', fontSize: 16, fontWeight: 700 }}>lenote.dev</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
