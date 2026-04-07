'use client';

import React, { useState } from 'react';
import { Search, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import BookCard from '@/features/member/components/BookCard';
import { ArticleAudience } from '@prisma/client';

type Book = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  description: string | null;
  audience: ArticleAudience;
  author: { name: string; image: string | null };
  _count: { chapters: number };
  createdAt: Date;
};

export default function BooksListClient({ books }: { books: Book[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (books.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] py-32 px-6 text-center">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
          <div className="w-28 h-28 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 -rotate-3 transition-transform hover:rotate-0 duration-500">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <Sparkles className="absolute -top-6 -right-6 w-8 h-8 text-amber-400 animate-bounce delay-150" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-primary/10">
          Coming Soon
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white font-display mb-6 tracking-tight">
          Lộ trình đang được <span className="text-primary italic">biên soạn</span>
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Các giáo trình chuyên sâu chuẩn kỹ sư đang được đội ngũ KS4.0 tinh chỉnh để mang lại chất lượng tốt nhất. Hãy đón chờ những siêu phẩm sắp ra mắt nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative pt-0 pb-20 px-0 overflow-hidden bg-slate-50 dark:bg-slate-900/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="w-full text-center relative z-10 pt-20 md:pt-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-primary/10">
            <Sparkles className="w-3.5 h-3.5" /> Book Library
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white font-display leading-[1.1] mb-8">
            Lộ trình học <span className="text-primary italic">chuyên sâu</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400 mb-14 leading-relaxed px-6">
            Hệ thống các chương trình đào tạo dài hơi, được thiết kế theo dạng Book giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao một cách có hệ thống.
          </p>

          <div className="max-w-xl mx-auto px-6">
            <div className="relative group">
              {/* Subtle outer glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              
              <div className="relative flex items-center">
                <Search className="w-5 h-5 absolute left-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm cuốn sách, lộ trình..."
                  className="w-full pl-14 pr-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full outline-none focus:border-primary/30 dark:focus:border-primary/30 focus:ring-4 focus:ring-primary/5 dark:text-white shadow-lg shadow-slate-200/20 dark:shadow-none transition-all placeholder:text-slate-400 text-base font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 max-w-[1600px] mx-auto pt-24">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Kết quả: <span className="text-slate-900 dark:text-white">{filtered.length}</span> cuốn sách
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-32">
          {filtered.map((book, i) => (
            <div key={book.id} className="animate-in fade-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
              <BookCard book={book as any} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-white/10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Không tìm thấy kết quả nào</h3>
              <p className="text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc nhé!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
