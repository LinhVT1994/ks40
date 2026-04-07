'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;   // px
  className?: string;
}

function fallbackUrl(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=e2e8f0&color=0f172a&size=128`;
}

export default function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  const sizeStyle = { width: size, height: size, minWidth: size };

  if (!src || errored) {
    // Try ui-avatars, but if that also fails → icon fallback
    return (
      <img
        src={fallbackUrl(name)}
        alt={name ?? 'avatar'}
        style={sizeStyle}
        className={`rounded-full object-cover border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${className}`}
        onError={e => {
          // ui-avatars failed → show icon placeholder
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute('hidden');
        }}
      />
    );
  }

  return (
    <>
      <img
        src={src}
        alt={name ?? 'avatar'}
        style={sizeStyle}
        className={`rounded-full object-cover border border-slate-200 dark:border-white/10 ${className}`}
        onError={() => setErrored(true)}
      />
      {/* Icon fallback — shown only if ui-avatars also fails */}
      <div
        hidden
        style={sizeStyle}
        className={`rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 ${className}`}
      >
        <User className="text-slate-400" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    </>
  );
}
