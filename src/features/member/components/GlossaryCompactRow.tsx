'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Term {
  id: string;
  term: string;
  slug: string;
  shortDef: string;
  topic?: {
    id: string;
    label: string;
    color: string | null;
  } | null;
}

interface GlossaryCompactRowProps {
  term: Term;
  index: number;
}

export default function GlossaryCompactRow({ term, index }: GlossaryCompactRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      <Link
        href={`/glossary/${term.slug}`}
        className="group flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-all px-4 -mx-4 sm:mx-0 sm:rounded-2xl"
      >
        <div className="sm:w-1/3 shrink-0">
          <h3 className="text-xl font-display font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-3">
            {term.term}
            {term.topic && (
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: term.topic.color ?? '#64748b' }}
              />
            )}
          </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-between gap-6">
          <p className="text-[13px] font-medium text-zinc-500 dark:text-slate-300 group-hover:text-zinc-800 dark:group-hover:text-white leading-relaxed line-clamp-2 sm:line-clamp-1 transition-colors">
            {term.shortDef}
          </p>
          
          <div className="hidden sm:flex items-center gap-4 shrink-0">
             {term.topic && (
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                 {term.topic.label}
               </span>
             )}
             <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 group-hover:border-primary group-hover:text-primary transition-all group-hover:scale-110">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
