'use client';

import Image from 'next/image';
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

  const containerStyle = { width: size, height: size, minWidth: size };

  // If no src or explicit error, use ui-avatars fallback
  const imageSrc = (!src || errored) ? fallbackUrl(name) : src;

  return (
    <div 
      style={containerStyle} 
      className={`relative rounded-full overflow-hidden border border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5 shrink-0 ${className}`}
    >
      <Image
        src={imageSrc}
        alt={name ?? 'avatar'}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => {
          if (!errored) setErrored(true);
        }}
        unoptimized
      />
      {/* Icon fallback — strictly hidden unless both src and ui-avatars fail (extremely rare) */}
      {errored && !imageSrc.includes('ui-avatars.com') && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-white/5">
          <User className="text-zinc-500" style={{ width: size * 0.5, height: size * 0.5 }} />
        </div>
      )}
    </div>
  );
}
