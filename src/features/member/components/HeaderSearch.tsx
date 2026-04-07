'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Search, X, Clock, Tag, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArticlesAction, type ArticleCard } from '@/features/articles/actions/article';

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design', AI_ML: 'AI/ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

export default function HeaderSearch() {
  const router = useRouter();
  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<ArticleCard[]>([]);
  const [open,      setOpen]      = useState(false);
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
      const { articles } = await getArticlesAction({ search: q, limit: 5 });
      setResults(articles);
      setOpen(true);
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

  const isExpanded = open || query.length > 0;

  return (
    <div ref={wrapperRef} className="flex items-center justify-center flex-1 px-4 max-w-2xl relative">
      <div className={`relative flex items-center transition-all duration-500 ease-in-out bg-white/10 dark:bg-white/5 border border-slate-200/20 dark:border-white/10 rounded-full overflow-visible ${
        isExpanded ? 'w-full shadow-lg shadow-primary/5 ring-2 ring-primary/20' : 'w-[250px] hover:w-[270px] hover:bg-white/20 dark:hover:bg-white/10'
      }`}>
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={isExpanded ? 'Tìm kiếm tài liệu, bài viết... (Enter)' : 'Tìm kiếm...'}
          className={`w-full bg-transparent pl-10 pr-10 py-2 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-500 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-70'}`}
        />

        {query && (
          <button onClick={handleClear} className="absolute right-3 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kết quả ({results.length})</span>
              </div>
              <div className="py-2">
                {results.map(article => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    onClick={() => { setOpen(false); setQuery(''); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 bg-slate-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-slate-300 font-bold"
                      style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
                    >
                      {!article.thumbnail && article.title[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[article.category]}</span>
                        <span className="text-slate-300 dark:text-white/20">·</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">{article.readTime} phút</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5">
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
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Không tìm thấy kết quả nào cho "<span className="font-semibold text-slate-600 dark:text-slate-300">{query}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
