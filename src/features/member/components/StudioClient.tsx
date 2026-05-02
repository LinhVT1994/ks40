'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Presentation, Search, Calendar, ChevronRight, LayoutGrid, List as ListIcon, Sparkles } from 'lucide-react';
import SlideshowGenerator from '@/features/sns/components/SlideshowGenerator';
import { format } from 'date-fns';

interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  summary: string | null;
  content: string;
  author: {
    name: string | null;
    image: string | null;
  };
  updatedAt: Date;
}

interface StudioClientProps {
  articles: Article[];
}

export default function StudioClient({ articles }: StudioClientProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Creator Tools</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black dark:text-white tracking-tight">
              Slideshow Studio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              Biến tri thức của bạn thành những bộ Slide triệu view.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-white/10 text-primary' : 'text-zinc-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-white/10 text-primary' : 'text-zinc-400'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài viết của bạn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-lg outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white shadow-sm"
          />
        </div>

        {/* Article List */}
        {filteredArticles.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-4'}>
            {filteredArticles.map((article) => (
              <motion.div 
                key={article.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 ${viewMode === 'list' ? 'flex flex-row items-center p-6' : 'flex flex-col'}`}
              >
                {/* Thumbnail */}
                <div className={`${viewMode === 'list' ? 'w-24 h-24 rounded-2xl' : 'aspect-video w-full'} bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden shrink-0`}>
                  {article.thumbnail ? (
                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <Presentation className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    {format(article.updatedAt, 'dd MMM, yyyy')}
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mb-8 flex-1">
                    {article.summary}
                  </p>
                  
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all shadow-lg shadow-black/5"
                  >
                    THIẾT KẾ SLIDE <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-white/10">
            <Presentation className="w-20 h-20 mx-auto text-zinc-200 dark:text-zinc-800 mb-6" />
            <h3 className="text-2xl font-bold dark:text-white mb-2">Chưa tìm thấy bài viết nào</h3>
            <p className="text-zinc-500">Hãy thử tìm kiếm với từ khóa khác hoặc viết bài mới nhé.</p>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <SlideshowGenerator 
            title={selectedArticle.title}
            overview={selectedArticle.summary || ''}
            content={selectedArticle.content}
            authorName={selectedArticle.author.name || 'Anonymous'}
            authorImage={selectedArticle.author.image || undefined}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
