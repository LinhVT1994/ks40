'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlossaryHeroProps {
  defaultValue?: string;
  currentLetter?: string;
  isAlphabetOpen: boolean;
  onToggleAlphabet: () => void;
}

export default function GlossaryHero({ 
  defaultValue = '', 
  currentLetter, 
  isAlphabetOpen,
  onToggleAlphabet 
}: GlossaryHeroProps) {
  const [isSearching, setIsSearching] = React.useState(!!defaultValue);

  return (
    <section className="relative pt-16 pb-12 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-display font-heavy text-zinc-800 dark:text-white leading-[1.1] tracking-tight">
            Thuật ngữ
          </h1>
          <p className="text-zinc-500 dark:text-slate-300 text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Hệ thống hóa các định nghĩa chuyên ngành giúp bạn nắm bắt nhanh chóng nội dung bài viết và tài liệu.
          </p>
        </motion.div>

        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => {
                setIsSearching(!isSearching);
                if (isAlphabetOpen) onToggleAlphabet();
              }}
              className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 ${
                isSearching 
                  ? 'border-primary/30 bg-primary/5 text-primary' 
                  : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {defaultValue ? `Đang tìm: ${defaultValue}` : 'Tìm kiếm'}
              </span>
            </button>

            {/* Alphabet Trigger */}
            <button
              onClick={() => {
                onToggleAlphabet();
                if (isSearching) setIsSearching(false);
              }}
              className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 ${
                isAlphabetOpen || currentLetter
                  ? 'border-primary/30 bg-primary/5 text-primary' 
                  : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                 <span className="text-[10px] font-black">A-Z</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {currentLetter ? `Chữ cái: ${currentLetter}` : 'Bảng chữ cái'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isAlphabetOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Revealable Search Input */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-full max-w-xl mt-8"
              >
                <form method="GET" className="relative">
                  <div className="relative flex items-center bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full overflow-hidden focus-within:border-primary/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-sm">
                    <div className="pl-5 text-zinc-400 shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      autoFocus
                      name="search"
                      defaultValue={defaultValue}
                      placeholder="Nhập thuật ngữ cần tìm..."
                      className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-sm outline-none text-zinc-800 dark:text-white placeholder:text-zinc-400"
                    />
                    <div className="pr-2 shrink-0">
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-zinc-800 dark:bg-white/10 text-white text-xs font-bold rounded-full hover:bg-primary transition-all whitespace-nowrap"
                      >
                        Tìm kiếm
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

