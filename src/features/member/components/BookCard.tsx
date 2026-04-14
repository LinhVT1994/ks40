import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { Book, Users, Layers, ChevronRight, Star } from 'lucide-react';

export type BookCardProps = {
  book: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover: string | null;
    audience: 'PUBLIC' | 'MEMBERS' | 'PREMIUM';
    author: { name: string; image?: string | null };
    _count: { chapters: number };
  };
};

const AUDIENCE_LABELS: Record<string, { label: string; className: string }> = {
  PUBLIC:  { label: 'Public',   className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  MEMBERS: { label: 'Members',  className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  PREMIUM: { label: 'Premium',  className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link 
      href={`/books/${book.slug}`}
      className="group relative flex flex-col h-full bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500"
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-white/5">
        {book.cover ? (
          <Image 
            src={book.cover} 
            alt={book.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-white/10">
            <Book className="w-16 h-16" />
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="absolute top-4 left-4 flex gap-2">
           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${AUDIENCE_LABELS[book.audience].className}`}>
              {AUDIENCE_LABELS[book.audience].label}
           </span>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
           <div className="flex items-center gap-1.5 backdrop-blur-md bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{book._count.chapters} Chapters</span>
           </div>
           {book.audience === 'PREMIUM' && (
              <div className="p-1.5 rounded-full bg-amber-500 border border-white/40 shadow-lg animate-pulse">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-white font-display group-hover:text-primary transition-colors leading-tight mb-2">
            {book.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
            {book.description || 'Khám phá kiến thức chuyên sâu thông qua lộ trình được thiết kế bài bản và khoa học.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-zinc-300 dark:border-white/10">
               {book.author.image ? (
                 <Image 
                   src={book.author.image} 
                   alt={book.author.name} 
                   fill 
                   sizes="32px"
                   className="object-cover" 
                 />
               ) : (
                 <Users className="w-4 h-4 text-zinc-500" />
               )}
            </div>
            <span className="text-xs font-bold text-zinc-600 dark:text-slate-300">{book.author.name}</span>
          </div>
          
          <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-500 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
