'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Facebook, Link2, Linkedin, Mail, Share2, Twitter } from 'lucide-react';

interface ShareMenuProps {
  title?: string;
  url?: string;
  trigger: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export default function ShareMenu({ title, url, trigger, align = 'right', className = '' }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title ?? (typeof document !== 'undefined' ? document.title : '');

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  };

  const tryNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        setOpen(false);
        return;
      } catch {
        // user cancelled — fall through to menu
      }
    }
    setOpen(o => !o);
  };

  const encoded = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const items: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }[] = [
    {
      label: copied ? 'Đã sao chép' : 'Sao chép liên kết',
      icon: copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />,
      onClick: handleCopy,
    },
    {
      label: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      label: 'X (Twitter)',
      icon: <Twitter className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin className="w-4 h-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
    {
      label: 'Email',
      icon: <Mail className="w-4 h-4" />,
      href: `mailto:?subject=${encodedTitle}&body=${encoded}`,
    },
  ];

  const alignClass =
    align === 'left' ? 'left-0' :
    align === 'center' ? 'left-1/2 -translate-x-1/2' :
    'right-0';

  return (
    <div ref={menuRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={tryNativeShare}
        aria-label="Chia sẻ"
        className="contents"
      >
        {trigger}
      </button>

      {open && (
        <div
          className={`absolute ${alignClass} top-full mt-2 z-50 w-56 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150`}
          role="menu"
        >
          <div className="px-3 py-2 flex items-center gap-2 text-[10px] font-black text-zinc-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            <Share2 className="w-3 h-3" /> Chia sẻ
          </div>
          <div className="flex flex-col">
            {items.map(item => {
              const content = (
                <>
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {item.icon}
                  </span>
                  <span className="text-[13px] font-semibold text-zinc-700 dark:text-slate-300">{item.label}</span>
                </>
              );
              const cls = 'group flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors';
              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                  >
                    {content}
                  </a>
                );
              }
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`${cls} text-left`}
                  role="menuitem"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
