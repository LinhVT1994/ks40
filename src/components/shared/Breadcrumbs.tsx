'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: {
    label: string;
    href?: string;
  }[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center flex-wrap gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 ${className}`}
    >
      <Link 
        href="/" 
        className="flex items-center gap-1 hover:text-primary transition-colors group"
      >
        <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Trang chủ</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-white/10 shrink-0" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-primary transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-400 dark:text-slate-500 whitespace-nowrap truncate max-w-[150px] sm:max-w-[300px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
