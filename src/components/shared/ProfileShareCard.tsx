import React from 'react';
import { cardText, profileInitials, type ProfileCardData } from '@/lib/profile-og';
import { SITE_URL } from '@/lib/seo';

const ink = '#38332d';
const clay = '#b96c4d';

/** Satori-compatible, code-native illustration: no browser layout or remote assets. */
export default function ProfileShareCard({ user, avatar }: { user: ProfileCardData; avatar: string | null }) {
  const name = cardText(user.name, 'Thành viên Lenote', 64);
  const bio = cardText(user.bio, 'Một góc nhỏ để học hỏi, ghi chép và chia sẻ những điều có ích.', 100);
  const handle = user.username ? cardText(user.username, '', 34) : null;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f2eee5', color: ink, fontFamily: 'BeVietnam', padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', height: '100%', border: '1px solid #ddd5c7', borderRadius: 24, background: '#fbf8f1', padding: '38px 52px', overflow: 'hidden' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          {Array.from({ length: 16 }, (_, row) => Array.from({ length: 30 }, (_, col) => <circle key={`${row}-${col}`} cx={col * 40 + 12} cy={row * 40 + 12} r="0.8" fill="#d8cdbb" opacity="0.38" />))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="34" height="36" viewBox="0 0 34 36"><path d="M5 5 Q16 1 29 5 L28 30 Q18 27 6 31 Z M11 4 L11 29 M16 12 L24 11 M16 17 L23 17" fill="none" stroke={clay} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: 'Gentium', fontSize: 35, letterSpacing: -1 }}>Lenote</span>
          </div>
          <span style={{ fontSize: 15, color: '#877c6b', letterSpacing: 3 }}>MỖI NGƯỜI, MỘT GÓC TRI THỨC</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 58, paddingBottom: 10 }}>
          <div style={{ display: 'flex', position: 'relative', width: 262, height: 276, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', display: 'flex', width: 240, height: 240, borderRadius: 120, background: '#ead8c4', left: 18, top: 25 }} />
            <div style={{ display: 'flex', width: 228, height: 228, borderRadius: 114, overflow: 'hidden', background: '#efe3d1', justifyContent: 'center', alignItems: 'center', color: clay, fontFamily: 'Gentium', fontSize: 88 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders embedded image bytes. */}
              {avatar ? <img src={avatar} alt="" width={228} height={228} /> : profileInitials(name)}
            </div>
            <svg width="262" height="276" viewBox="0 0 262 276" style={{ position: 'absolute', left: 0, top: 0 }}>
              <path d="M128 10 C290 7 296 254 141 263 C-18 275 -35 24 128 10 Z" fill="none" stroke={clay} strokeWidth="2.2" strokeLinecap="round" />
              <path d="M104 17 C263 -7 289 241 144 253 C5 277 -20 38 104 17" fill="none" stroke={clay} strokeWidth="1.1" opacity="0.55" />
              <path d="M225 17 L228 32 L243 36 L228 40 L223 55 L220 40 L207 36 L220 32 Z" fill="#fbf8f1" stroke={clay} strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: 690, justifyContent: 'center' }}>
            <span style={{ fontSize: 20, color: clay, marginBottom: 14 }}>{handle ? `@${handle}` : 'Góc tri thức cá nhân'}</span>
            <div style={{ display: 'flex', fontFamily: 'Gentium', fontSize: name.length > 35 ? 52 : name.length > 23 ? 62 : 76, lineHeight: 1.05, letterSpacing: -1.5, maxHeight: 164, overflow: 'hidden', wordBreak: 'break-word' }}>{name}</div>
            <svg width="176" height="16" viewBox="0 0 176 16" style={{ marginTop: 14, marginBottom: 16 }}><path d="M2 9 Q71 2 173 8 M8 13 Q82 6 165 12" fill="none" stroke={clay} strokeWidth="2" strokeLinecap="round" opacity="0.6" /></svg>
            <div style={{ display: 'flex', fontSize: 23, color: '#807565', lineHeight: 1.5, maxHeight: 74, overflow: 'hidden', wordBreak: 'break-word', maxWidth: 650 }}>{bio}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2dacd', paddingTop: 22 }}>
          <span style={{ fontFamily: 'Gentium', fontSize: 23, color: '#8a7a66', width: 520 }}>Ghi lại điều hay. Chia sẻ điều đáng nhớ.</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, color: clay, fontSize: 16, width: 480 }}>
            <span style={{ maxWidth: 426, overflow: 'hidden', whiteSpace: 'nowrap' }}>{`${new URL(SITE_URL).host}${handle ? `/@${handle}` : ''}`}</span>
            <svg width="28" height="20" viewBox="0 0 28 20" style={{ flexShrink: 0 }}><path d="M1 11 Q12 8 25 10 M18 3 L26 10 L18 18" fill="none" stroke={clay} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
