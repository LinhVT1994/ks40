'use client';

import { useEffect, useState } from 'react';

type Heading = { level: number; text: string; id: string };

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-slate-500 mb-4">
        Mục lục
      </p>

      <nav className="flex flex-col gap-0.5 max-h-[50vh] overflow-y-auto">
        {headings.map(({ id, text, level }) => {
          const isActive = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={e => {
                e.preventDefault();
                const el = document.getElementById(id);
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY - 90;
                window.scrollTo({ top, behavior: 'smooth' });
              }}
              className={`text-[13px] leading-snug line-clamp-2 transition-all duration-150 rounded-lg cursor-pointer py-2 px-3 ${
                level === 1 ? 'font-bold' : ''
              } ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              {text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
