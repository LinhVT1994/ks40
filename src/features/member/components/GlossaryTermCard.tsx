'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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

interface GlossaryTermCardProps {
  term: Term;
  index: number;
  currentSearch?: string;
  currentLetter?: string;
}

// Helper component to highlight matching text
function HighlightText({ text, query }: { text: string, query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-primary dark:text-primary-light font-black">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function GlossaryTermCard({ term, index, currentSearch, currentLetter }: GlossaryTermCardProps) {
  const query = new URLSearchParams();
  if (currentSearch) query.set('search', currentSearch);
  if (currentLetter) query.set('letter', currentLetter);
  const queryString = query.toString();
  const href = `/glossary/${term.slug}${queryString ? `?${queryString}` : ''}`;

  return (
    <div>
      <Link
        href={href}
        className="group relative block p-5 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
              <HighlightText text={term.term} query={currentSearch || ''} />
            </h3>
            {term.topic && (
              <span
                className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                style={{ 
                  backgroundColor: `${term.topic.color ?? '#64748b'}10`, 
                  borderColor: `${term.topic.color ?? '#64748b'}20`,
                  color: term.topic.color ?? '#64748b' 
                }}
              >
                {term.topic.label}
              </span>
            )}
          </div>
          
          <p className="text-sm text-zinc-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
            <HighlightText text={term.shortDef} query={currentSearch || ''} />
          </p>
          
        </div>
      </Link>
    </div>
  );
}

export default React.memo(GlossaryTermCard);
