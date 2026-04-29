'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Hash } from 'lucide-react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface GlossaryAlphabetProps {
  currentLetter?: string;
  hasSearch?: boolean;
  isExpanded: boolean;
}

export default function GlossaryAlphabet({ currentLetter, hasSearch, isExpanded }: GlossaryAlphabetProps) {
  if (hasSearch) return null;

  return (
    <div className="w-full mb-12">
      {/* Collapsible Alphabet Row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden w-full"
          >
            <div className="pt-4 pb-8 flex items-center justify-center flex-wrap gap-x-5 gap-y-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-3xl">
              <Link
                href="/glossary"
                className={`relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  !currentLetter 
                    ? 'text-primary' 
                    : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Tất cả
                {!currentLetter && (
                  <motion.div layoutId="activeDot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
              
              <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 hidden sm:block" />

              {ALPHABET.map((l) => (
                <Link
                  key={l}
                  href={`/glossary?letter=${l}`}
                  className={`relative text-[13px] font-bold transition-all ${
                    currentLetter === l 
                      ? 'text-primary scale-125' 
                      : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {l}
                  {currentLetter === l && (
                    <motion.div layoutId="activeDot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
              
              <Link
                href="/glossary?letter=#"
                className={`relative text-[13px] font-bold transition-all ${
                  currentLetter === '#' 
                    ? 'text-primary scale-125' 
                    : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                {currentLetter === '#' && (
                  <motion.div layoutId="activeDot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
