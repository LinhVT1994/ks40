'use client';

import React, { useState, useMemo } from 'react';
import GlossaryExplorer from './GlossaryExplorer';
import GlossaryTermCard from './GlossaryTermCard';
import MemberContainer from '@/components/layout/MemberContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface GlossaryClientViewProps {
  initialTerms: any[];
}

export default function GlossaryClientView({ initialTerms }: GlossaryClientViewProps) {
  const [search, setSearch] = useState('');
  const [letter, setLetter] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const filteredTerms = useMemo(() => {
    const s = debouncedSearch.toLowerCase().trim();
    return initialTerms.filter(t => {
      const matchesSearch = !s || 
        t.term.toLowerCase().includes(s) ||
        t.shortDef.toLowerCase().includes(s);
      
      const matchesLetter = !letter || (
        letter === '#' 
          ? !ALPHABET.includes(t.term[0].toUpperCase())
          : t.term[0].toUpperCase() === letter
      );

      return matchesSearch && matchesLetter;
    });
  }, [initialTerms, debouncedSearch, letter]);

  const grouped = useMemo(() => {
    return filteredTerms.reduce<Record<string, any[]>>((acc, t) => {
      const first = t.term[0].toUpperCase();
      const key = ALPHABET.includes(first) ? first : '#';
      acc[key] = acc[key] ?? [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [filteredTerms]);

  const letters = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b));
  }, [grouped]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <GlossaryExplorer 
        search={search} 
        onSearchChange={setSearch}
        letter={letter} 
        onLetterChange={setLetter}
      />

      <MemberContainer>
        <div className="max-w-4xl mx-auto pb-24 px-4">
          <AnimatePresence mode="wait">
            {filteredTerms.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-300 dark:text-slate-700">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 dark:text-slate-400 font-medium italic">Không tìm thấy thuật ngữ nào khớp với yêu cầu của bạn.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-16"
              >
                {letters.map(l => (
                  <div key={l} className="relative group/section">
                    <div className="flex items-center gap-6 mb-10 py-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm transition-colors">
                      <h2 className="text-5xl font-display font-heavy text-primary/10 dark:text-primary/5 group-hover/section:text-primary/30 transition-colors duration-500">
                        {l}
                      </h2>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                      {grouped[l].map((t, i) => (
                        <GlossaryTermCard key={t.id} term={t} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MemberContainer>
    </div>
  );
}
