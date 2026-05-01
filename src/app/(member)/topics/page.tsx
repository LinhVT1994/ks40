'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import MemberContainer from '@/components/layout/MemberContainer';
import Link from 'next/link';
import { ChevronRight, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function TopicsExplorerPage() {
  const [topicsTree, setTopicsTree] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data on client
  useEffect(() => {
    getTopicTreeAction().then(data => {
      setTopicsTree(data);
      setIsLoading(false);
    });
  }, []);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) {
      return topicsTree.filter(t => t.enabled && (t.children?.some((c: any) => c.enabled) || (t._count?.articles ?? 0) > 0));
    }

    const query = searchQuery.toLowerCase();
    return topicsTree
      .filter(t => t.enabled)
      .map(parent => {
        const matchingChildren = (parent.children ?? []).filter((c: any) => 
          c.enabled && c.label.toLowerCase().includes(query)
        );
        const parentMatches = parent.label.toLowerCase().includes(query);

        if (parentMatches || matchingChildren.length > 0) {
          return {
            ...parent,
            children: matchingChildren.length > 0 ? matchingChildren : (parentMatches ? parent.children : [])
          };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [topicsTree, searchQuery]);

  // Calculate total topics (parents + children)
  const totalCount = useMemo(() => {
    return filteredTree.reduce((acc, parent) => {
      const childrenCount = (parent.children ?? []).filter((c: any) => c.enabled).length;
      return acc + 1 + childrenCount;
    }, 0);
  }, [filteredTree]);

  return (
    <MemberContainer>
      <div className="mt-24 sm:mt-32 mb-40 px-4 md:px-8 max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-display font-black text-zinc-800 dark:text-white leading-[1.1] tracking-tight"
          >
            Chủ đề
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 dark:text-slate-400 mt-6 text-lg max-w-xl mx-auto leading-relaxed font-medium"
          >
            Hệ thống hóa tri thức theo từng khối lĩnh vực để bạn dễ dàng bao quát toàn bộ nội dung.
          </motion.p>
        </div>

        {/* Client Search Bar with Expand Effect */}
        <motion.div 
          initial={false}
          animate={{ 
            maxWidth: (isFocused || searchQuery) ? '480px' : '320px',
            opacity: 1
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="mx-auto mb-32 relative group w-full"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 -z-10" />
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isFocused || searchQuery ? 'text-primary' : 'text-zinc-500'}`} />
            <input
              ref={inputRef}
              type="text"
              placeholder={isFocused || searchQuery ? "Tìm kiếm chủ đề tri thức..." : "Tìm chủ đề..."}
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-10 bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm pl-12 pr-10 rounded-full outline-none transition-all duration-300 dark:text-white placeholder:text-zinc-500 ${
                isFocused || searchQuery ? 'ring-2 ring-primary/20 border-primary/30 shadow-lg shadow-primary/5 bg-white dark:bg-zinc-900/40' : 'hover:bg-zinc-200/50 dark:hover:bg-white/10'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {(isFocused || searchQuery) && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-3 flex items-center justify-between px-2"
              >
                <div className="min-h-[1rem]">
                  {searchQuery && (
                    <p className="text-[11px] font-medium text-primary">
                      Đang lọc theo: "{searchQuery}"
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isLoading 
                    ? 'Đang tải dữ liệu...' 
                    : searchQuery 
                      ? `Tìm thấy ${totalCount} kết quả` 
                      : `${totalCount} chủ đề`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Grid Layout */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 bg-zinc-100 dark:bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-20 items-start">
            <AnimatePresence mode='popLayout'>
              {filteredTree.map((parent) => {
                const children = (parent.children ?? []).filter((c: any) => c.enabled);
                const color = parent.color || '#64748b';
                
                return (
                  <motion.div 
                    layout
                    key={parent.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col group relative"
                  >
                    {/* Background Glow */}
                    <div 
                        className="absolute -inset-6 bg-gradient-to-br from-white/50 to-white/30 dark:from-white/[0.03] dark:to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                        style={{ background: `radial-gradient(circle at 0% 0%, ${color}10, transparent 70%)` }}
                    />
                    {/* Clickable Header */}
                    <Link 
                      href={`/topic/${parent.slug}`}
                      className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5 hover:border-primary/50 transition-all group/head"
                    >
                      <div 
                        className="w-1.5 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <h2 className="text-xl font-display font-bold text-zinc-800 dark:text-white group-hover/head:text-primary transition-colors flex items-baseline">
                        <span className="flex-1">
                          <HighlightText text={parent.label} query={searchQuery} />
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover/head:opacity-100 group-hover/head:translate-x-1 transition-all ml-2" />
                      </h2>
                    </Link>

                    <div className="flex flex-col gap-y-4 px-1">
                      {children.map((child: any) => (
                        <Link
                          key={child.id}
                          href={`/topic/${child.slug}`}
                          className="text-[15px] font-medium text-zinc-500 dark:text-slate-300 hover:text-zinc-800 dark:hover:text-white transition-all hover:translate-x-1 w-fit flex items-baseline group/item"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-200 dark:text-white/20 group-hover/item:text-primary transition-all opacity-0 group-hover/item:opacity-100 -ml-5 group-hover/item:ml-0 mr-2" />
                          <span>
                            <HighlightText text={child.label} query={searchQuery} />
                            <span className="text-[11px] text-zinc-500 dark:text-slate-300 font-normal opacity-60 ml-1.5">({child._count?.articles ?? 0})</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filteredTree.length === 0 && !isLoading && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="p-5 bg-zinc-100 dark:bg-white/5 rounded-full">
              <Search className="w-10 h-10 text-zinc-400" />
            </div>
            <p className="text-zinc-500 font-medium">Không tìm thấy chủ đề nào khớp với "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-primary font-bold hover:underline"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        <div className="mt-40 pt-16 border-t border-zinc-200 dark:border-white/5 text-center">
            <p className="text-zinc-500 dark:text-slate-300 font-medium text-sm">
                Bạn không tìm thấy chủ đề phù hợp? <Link href="/search" className="text-primary hover:underline font-bold transition-all underline-offset-4 decoration-2">Khám phá qua Tìm kiếm</Link>
            </p>
        </div>
      </div>
    </MemberContainer>
  );
}
