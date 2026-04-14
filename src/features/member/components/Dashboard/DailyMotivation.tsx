'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const QUOTES = [
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "The path to mastery is simplicity.", author: "Zen Proverb" },
  { text: "Clean code always looks like it was written by someone who cares.", author: "Michael Feathers" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Abelson & Sussman" },
  { text: "Be a student as long as you still have something to learn, and this will mean all your life.", author: "Henry L. Doherty" }
];

export default function DailyMotivation() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const quote = useMemo(() => {
    if (!mounted) return null;
    // Stable random selection based on current date
    const day = new Date().getDate();
    return QUOTES[day % QUOTES.length];
  }, [mounted]);

  if (!mounted || !quote) return null;

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4 px-6 opacity-60 hover:opacity-100 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-2 delay-1000">
      <div className="w-12 h-px bg-zinc-200 dark:bg-white/10" />
      <div className="flex flex-col items-center text-center max-w-lg">
        <Quote className="w-4 h-4 text-primary opacity-30 mb-4" />
        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-slate-400 italic leading-relaxed">
          "{quote.text}"
        </p>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-3">
          — {quote.author}
        </span>
      </div>
    </div>
  );
}
