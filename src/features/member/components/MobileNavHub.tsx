'use client';

import React from 'react';
import Link from 'next/link';
import { List, BookOpen, ChevronLeft, Maximize2, Timer } from 'lucide-react';

interface MobileNavHubProps {
  bookSlug: string;
  progress: number;
  onToggleSyllabus: () => void;
  onToggleTOC: () => void;
}

export default function MobileNavHub({
  bookSlug,
  progress,
  onToggleSyllabus,
  onToggleTOC,
}: MobileNavHubProps) {
  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[90vw] max-w-md">
      {/* Glassmorphic Hub Container */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-zinc-300/60 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden">
        
        {/* Top Progress Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-zinc-100 dark:bg-white/5">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="flex items-center justify-around p-3">
          {/* Back Button */}
          <Link 
            href={`/books/${bookSlug}`}
            className="flex flex-col items-center gap-1 p-2 text-zinc-500 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Back</span>
          </Link>

          <div className="w-px h-8 bg-zinc-200/60 dark:bg-white/10" />

          {/* TOC Toggle */}
          <button 
            onClick={onToggleTOC}
            className="flex flex-col items-center gap-1 p-2 text-zinc-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <List className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">TOC</span>
          </button>

          {/* Syllabus Toggle */}
          <button 
            onClick={onToggleSyllabus}
            className="flex flex-col items-center gap-1 p-2 text-zinc-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Syllabus</span>
          </button>
        </div>
      </div>
    </div>
  );
}
