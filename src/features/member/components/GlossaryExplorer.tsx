'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { Search, ChevronDown, Hash, Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import GlossarySubmissionModal from './GlossarySubmissionModal';
import type { TopicItem } from '@/features/admin/actions/topic';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface GlossaryExplorerProps {
  search?: string;
  letter?: string;
  topics: TopicItem[];
}

export default function GlossaryExplorer({ 
  search: initialSearch = '', 
  letter: initialLetter = '',
  topics
}: GlossaryExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(!initialLetter);
  const [isAlphabetOpen, setIsAlphabetOpen] = useState(!!initialLetter);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(search, 500);

  // Sync search to URL
  useEffect(() => {
    if (debouncedSearch === initialSearch) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }
    params.delete('page'); // Reset to page 1
    
    startTransition(() => {
      router.push(`/glossary?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch, router, searchParams, initialSearch]);

  const toggleSearch = () => {
    const next = !isSearching;
    setIsSearching(next);
    if (next) {
      setIsAlphabetOpen(false);
      updateUrl({ letter: '' });
    }
  };

  const toggleAlphabet = () => {
    const next = !isAlphabetOpen;
    setIsAlphabetOpen(next);
    if (next) {
      setIsSearching(false);
      setSearch('');
      updateUrl({ search: '' });
    }
  };

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    params.delete('page');
    
    startTransition(() => {
      router.push(`/glossary?${params.toString()}`, { scroll: false });
    });
  };

  // Sync loading state to document for CSS targeting
  useEffect(() => {
    if (isPending) {
      document.body.classList.add('glossary-loading');
    } else {
      document.body.classList.remove('glossary-loading');
    }
    return () => document.body.classList.remove('glossary-loading');
  }, [isPending]);

  return (
    <div className="space-y-0 relative">
      <style jsx global>{`
        .glossary-loading [data-glossary-list] {
          opacity: 0.5;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative pt-32 pb-8 overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-display font-heavy text-zinc-800 dark:text-white leading-[1.1] tracking-tight">
              Thuật ngữ
            </h1>
            <p className="text-zinc-500 dark:text-slate-300 text-lg max-w-xl mx-auto leading-relaxed font-medium">
              Hệ thống hóa các định nghĩa chuyên ngành giúp bạn nắm bắt nhanh chóng nội dung bài viết và tài liệu.
            </p>
          </div>

          {/* Ultra-Compact Segmented Pill */}
          <div className="flex flex-col items-center gap-4">
            <div className="md:hidden flex justify-center w-full max-w-[280px]">
              <button
                onClick={() => setIsSubmissionOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-500/80 hover:text-amber-500 transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                <span>Đóng góp</span>
              </button>
            </div>
            
            <div className="inline-flex items-center p-1 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-full shadow-sm">
              <button
                onClick={toggleSearch}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                  isSearching 
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/10' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {search ? 'Đang tìm' : 'Tìm kiếm'}
                </span>
              </button>

              <div className="w-px h-4 bg-zinc-200 dark:bg-white/10 mx-1" />

              <button
                onClick={toggleAlphabet}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                  isAlphabetOpen || initialLetter
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/10' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <span className="text-[10px] font-black tracking-tighter">A-Z</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {initialLetter ? `Chữ: ${initialLetter}` : 'Bảng chữ'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAlphabetOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="hidden md:flex items-center">
                <div className="w-px h-4 bg-zinc-200 dark:bg-white/10 mx-1" />
                <button
                  onClick={() => setIsSubmissionOpen(true)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 whitespace-nowrap text-amber-500 hover:bg-amber-500/5"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Đóng góp
                  </span>
                </button>
              </div>
            </div>

            {/* Expandable Areas */}
            <div className="w-full min-h-[100px]">
              <AnimatePresence mode="wait">
                {isSearching && (
                  <motion.div 
                    key="search-area"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="pt-8 relative"
                  >
                    <motion.div 
                      initial={false}
                      animate={{ 
                        maxWidth: (isInputFocused || search) ? '480px' : '320px',
                      }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="mx-auto relative group w-full"
                    >
                      <div className="relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isInputFocused || search ? 'text-primary' : 'text-zinc-500'}`} />
                        <input
                          ref={inputRef}
                          type="text"
                          value={search}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={isInputFocused || search ? "Nhập thuật ngữ cần tìm..." : "Tìm thuật ngữ..."}
                          className={`w-full h-10 bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm pl-12 pr-10 rounded-full outline-none transition-all duration-300 dark:text-white placeholder:text-zinc-500 ${
                            isInputFocused || search ? 'ring-2 ring-primary/20 border-primary/30 shadow-lg shadow-primary/5 bg-white dark:bg-zinc-900/40' : 'hover:bg-zinc-200/50 dark:hover:bg-white/10'
                          }`}
                        />
                        {search && (
                          <button 
                            onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {search && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 right-0 mt-3 flex items-center justify-start px-2"
                          >
                            <p className="text-[11px] font-medium text-primary">
                              Đang lọc theo: "{search}"
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}

                {isAlphabetOpen && (
                  <motion.div 
                    key="alphabet-area"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full"
                  >
                    <div className="pt-10 pb-4 flex items-center justify-center flex-wrap gap-x-6 gap-y-5">
                      <button
                        onClick={() => updateUrl({ letter: '' })}
                        className={`relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                          !initialLetter 
                            ? 'text-primary' 
                            : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        Tất cả
                        {!initialLetter && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                      
                      <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 hidden sm:block" />

                      {ALPHABET.map((l) => (
                        <button
                          key={l}
                          onClick={() => updateUrl({ letter: l === initialLetter ? '' : l })}
                          className={`relative text-[13px] font-bold transition-all ${
                            initialLetter === l 
                              ? 'text-primary scale-125' 
                              : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {l}
                          {initialLetter === l && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => updateUrl({ letter: initialLetter === '#' ? '' : '#' })}
                        className={`relative text-[13px] font-bold transition-all ${
                          initialLetter === '#' 
                            ? 'text-primary scale-125' 
                            : 'text-zinc-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Hash className="w-4 h-4" />
                        {initialLetter === '#' && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <GlossarySubmissionModal 
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        topics={topics}
      />
    </div>
  );
}
