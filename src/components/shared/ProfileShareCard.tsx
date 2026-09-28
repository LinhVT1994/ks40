import React from 'react';
import { cardText, profileInitials, type ProfileCardData } from '@/lib/profile-og';
import { SITE_URL } from '@/lib/seo';

const ink = '#38332d';
const clay = '#b96c4d';
const paper = '#fbf8f1';
const COVER_H = 250;

type Props = {
  user: ProfileCardData;
  avatar: string | null;
  /** Uploaded cover as an embedded PNG data URL. */
  coverPhoto?: string | null;
  /** CSS background for a preset cover (used when there's no photo). */
  coverBackground?: string | null;
};

/** Satori-compatible share card mirroring the profile page: cover wall, overlapping avatar, name and bio. */
export default function ProfileShareCard({ user, avatar, coverPhoto = null, coverBackground = null }: Props) {
  const name = cardText(user.name, 'Thành viên Lenote', 64);
  const bio = cardText(user.bio, 'Một góc nhỏ để học hỏi, ghi chép và chia sẻ những điều có ích.', 120);
  const handle = user.username ? cardText(user.username, '', 34) : null;
  const nameSize = name.length > 35 ? 44 : name.length > 23 ? 52 : 60;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f2eee5', color: ink, fontFamily: 'BeVietnam', padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', height: '100%', border: '1px solid #ddd5c7', borderRadius: 24, background: paper, overflow: 'hidden' }}>
        {/* Cover wall */}
        <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: 1136, height: COVER_H, background: coverBackground ?? '#ead8c4' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders embedded image bytes. */}
          {coverPhoto && <img src={coverPhoto} alt="" width={1136} height={COVER_H} style={{ width: 1136, height: COVER_H, objectFit: 'cover' }} />}
        </div>
        {/* Soft fade from the wall into the paper */}
        <div style={{ display: 'flex', position: 'absolute', left: 0, top: COVER_H - 90, width: 1136, height: 90, backgroundImage: `linear-gradient(to bottom, rgba(251,248,241,0), ${paper})` }} />

        {/* Brand chips sitting on the wall */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '26px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 14px', borderRadius: 999, background: 'rgba(251,248,241,0.88)' }}>
            <svg width="28" height="30" viewBox="0 0 34 36"><path d="M5 5 Q16 1 29 5 L28 30 Q18 27 6 31 Z M11 4 L11 29 M16 12 L24 11 M16 17 L23 17" fill="none" stroke={clay} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: 'Gentium', fontSize: 28, letterSpacing: -0.5 }}>Lenote</span>
          </div>
          <span style={{ display: 'flex', fontSize: 13, color: '#6f6557', letterSpacing: 3, padding: '9px 16px', borderRadius: 999, background: 'rgba(251,248,241,0.88)' }}>MỖI NGƯỜI, MỘT GÓC TRI THỨC</span>
        </div>

        {/* Identity: avatar overlapping the wall, text beside it */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 36, padding: '0 52px', marginTop: 68 }}>
          <div style={{ display: 'flex', width: 212, height: 212, borderRadius: 106, background: paper, padding: 8, flexShrink: 0, boxShadow: '0 10px 30px rgba(56,51,45,0.18)' }}>
            <div style={{ display: 'flex', width: 196, height: 196, borderRadius: 98, overflow: 'hidden', background: '#efe3d1', justifyContent: 'center', alignItems: 'center', color: clay, fontFamily: 'Gentium', fontSize: 80 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders embedded image bytes. */}
              {avatar ? <img src={avatar} alt="" width={196} height={196} /> : profileInitials(name)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: 760, paddingBottom: 8 }}>
            <span style={{ fontSize: 19, color: clay, marginBottom: 6 }}>{handle ? `@${handle}` : 'Góc tri thức cá nhân'}</span>
            <div style={{ display: 'flex', fontFamily: 'Gentium', fontSize: nameSize, lineHeight: 1.08, letterSpacing: -1.2, maxHeight: nameSize * 2.2, overflow: 'hidden', wordBreak: 'break-word' }}>{name}</div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '18px 52px 0', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 23, color: '#7a6f60', lineHeight: 1.5, maxHeight: 70, overflow: 'hidden', wordBreak: 'break-word', borderLeft: `3px solid ${clay}`, paddingLeft: 18, opacity: 0.95 }}>{bio}</div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2dacd', margin: '0 52px', padding: '18px 0 24px' }}>
          <span style={{ fontFamily: 'Gentium', fontSize: 21, color: '#8a7a66', width: 520 }}>Ghi lại điều hay. Chia sẻ điều đáng nhớ.</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, color: clay, fontSize: 16, width: 480 }}>
            <span style={{ maxWidth: 426, overflow: 'hidden', whiteSpace: 'nowrap' }}>{`${new URL(SITE_URL).host}${handle ? `/@${handle}` : ''}`}</span>
            <svg width="28" height="20" viewBox="0 0 28 20" style={{ flexShrink: 0 }}><path d="M1 11 Q12 8 25 10 M18 3 L26 10 L18 18" fill="none" stroke={clay} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
