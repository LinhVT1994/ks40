'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Search, X, Clock, Tag, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArticlesAction, type ArticleCard } from '@/features/articles/actions/article';
import { motion, AnimatePresence } from 'framer-motion';


export default function HeaderSearch() {
  const router = useRouter();
  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<ArticleCard[]>([]);
  const [open,      setOpen]      = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    startTransition(async () => {
      try {
        const result = await getArticlesAction({ search: q, limit: 5, isQuickSearch: true });
        setResults(result?.articles || []);
        setOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const isExpanded = open || query.length > 0 || isFocused;

  return (
    <div ref={wrapperRef} className="relative flex items-center justify-end">
      <motion.div 
        initial={false}
        animate={{ 
          width: isExpanded ? '400px' : '250px',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`relative flex items-center bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full overflow-visible transition-shadow duration-300 ${
          isExpanded ? 'shadow-lg shadow-primary/5 ring-2 ring-primary/20 border-primary/30 bg-white dark:bg-zinc-900/40' : 'hover:bg-zinc-200/50 dark:hover:bg-white/10'
        }`}
      >
        <div className={`absolute left-3.5 pointer-events-none transition-colors duration-300 ${isExpanded ? 'text-primary' : 'text-zinc-500'}`}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { 
            setIsFocused(true);
            if (results.length > 0) setOpen(true); 
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={isExpanded ? 'Tìm kiếm tài liệu, bài viết... (Enter)' : 'Tìm kiếm...'}
          className={`w-full bg-transparent pl-10 pr-10 py-2.5 text-sm outline-none text-zinc-800 dark:text-white placeholder:text-zinc-500 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-70'}`}
        />

        {query && (
          <button onClick={handleClear} className="absolute right-3 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-[calc(100%+12px)] right-0 w-[150%] min-w-[320px] max-w-[800px] bg-surface border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl z-[1100] overflow-hidden origin-top-right"
            >
              {results.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/5">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Kết quả ({results.length})</span>
                  </div>
                  <div className="py-2">
                    {results.map(article => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        onClick={() => { setOpen(false); setQuery(''); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg shrink-0 bg-zinc-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-zinc-300 font-bold"
                          style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                        >
                          {!article.thumbnail && article.title[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Tag className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-500">{article.topic.label}</span>
                            <span className="text-zinc-300 dark:text-white/20">·</span>
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-500">{article.readTime} phút</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/5">
                    <Link
                      href={`/search?q=${encodeURIComponent(query.trim())}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Xem tất cả kết quả cho "{query}" →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-zinc-500">
                  Không tìm thấy kết quả nào cho "<span className="font-semibold text-zinc-600 dark:text-slate-300">{query}</span>"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
