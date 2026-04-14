import Image from 'next/image';
import React from 'react';
import { Play, Layers, Users, Clock, Share2, Bookmark, Star } from 'lucide-react';

export type BookHeroProps = {
  book: {
    title: string;
    description: string | null;
    cover: string | null;
    author: { name: string; image?: string | null; role?: string };
    _count: { chapters: number };
    createdAt: Date;
  };
};

export default function BookHero({ book }: BookHeroProps) {
  return (
    <section className="relative pt-44 pb-24 px-6 overflow-hidden min-h-[700px] flex items-center">
      {/* Background Layered Effect */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {book.cover && (
          <>
            <Image
              src={book.cover}
              alt=""
              fill
              priority
              className="w-full h-full object-cover scale-125 blur-3xl md:blur-[80px] opacity-30 dark:opacity-40"
            />
            <div className="absolute inset-0 bg-zinc-50/40 dark:bg-slate-950/60" />

            {/* Gradient Orbs — hidden on mobile */}
            <div className="hidden md:block absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[60px]" />
            <div className="hidden md:block absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[60px]" />

            {/* Glass Overlays */}
            <div className="absolute inset-0 backdrop-blur-xl md:backdrop-blur-[40px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/50 to-zinc-50 dark:via-slate-950/50 dark:to-slate-950" />
          </>
        )}
      </div>

      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10 px-6 lg:px-12">
        {/* Cover Image Side (Enhanced 3D) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
           <div className="relative group [perspective:2000px]">
              {/* Stacked Pages Effect (Behind the cover) */}
              <div className="absolute inset-0 w-64 md:w-85 aspect-[3/4.2] bg-white dark:bg-slate-800 rounded-r-lg shadow-xl translate-x-2 translate-y-1 rotate-y-15 opacity-60" />
              <div className="absolute inset-0 w-64 md:w-85 aspect-[3/4.2] bg-zinc-100 dark:bg-slate-700 rounded-r-lg shadow-lg translate-x-1 translate-y-0.5 rotate-y-12 opacity-80" />
              
              {/* Actual Book Cover */}
              <div className="relative w-64 md:w-85 aspect-[3/4.2] rounded-r-2xl overflow-hidden shadow-[30px_50px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[30px_50px_100px_-20px_rgba(0,0,0,0.5)] border-l-[12px] border-zinc-800/10 dark:border-white/5 transform [transform-style:preserve-3d] rotate-y-15 group-hover:rotate-y-5 transition-all duration-1000 ease-out">
                {book.cover ? (
                  <Image src={book.cover} alt={book.title} fill priority sizes="(max-width: 768px) 256px, 340px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-slate-800 flex items-center justify-center text-zinc-500">
                    <Layers className="w-20 h-20" />
                  </div>
                )}
                
                {/* Gloss effect on cover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
              
              {/* Floating badges */}
              <div className="absolute -bottom-8 -right-8 p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 transform hover:scale-110 transition-transform">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                       <Layers className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Chapters</div>
                       <div className="text-xl font-black text-zinc-800 dark:text-white leading-none">{book._count.chapters}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Side */}
        <div className="lg:col-span-7 text-center lg:text-left space-y-10">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-primary/10 backdrop-blur-md">
                 <Star className="w-3.5 h-3.5 fill-current" /> Premium Learning Path
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-zinc-800 dark:text-white font-display leading-[1] tracking-tight">
                {book.title}
              </h1>
              
              <p className="text-xl text-zinc-600 dark:text-slate-400 leading-relaxed max-w-2xl font-medium">
                {book.description || 'Cuốn sách này cung cấp một lộ trình học tập toàn diện, được thiết kế để giúp bạn nắm vững kiến thức một cách chuyên sâu nhất.'}
              </p>
           </div>

           {/* Meta Info Bar */}
           <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10 py-8 border-y border-zinc-300/60 dark:border-white/5">
              <div className="flex items-center gap-4">
                 <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-lg ring-4 ring-primary/5">
                    {book.author.image ? <Image src={book.author.image} alt="" fill sizes="48px" className="object-cover" /> : <div className="w-full h-full bg-zinc-200 dark:bg-slate-800 flex items-center justify-center font-bold text-zinc-500">?</div>}
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Tác giả</div>
                    <div className="text-base font-black text-zinc-800 dark:text-white tracking-tight">{book.author.name}</div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 shadow-sm flex items-center justify-center text-zinc-500">
                     <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Cập nhật</div>
                    <div className="text-base font-black text-zinc-800 dark:text-white tracking-tight">{new Intl.DateTimeFormat('vi-VN').format(book.createdAt)}</div>
                  </div>
              </div>
              
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 shadow-sm flex items-center justify-center text-zinc-500">
                     <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Member</div>
                    <div className="text-base font-black text-zinc-800 dark:text-white tracking-tight">2.5k+</div>
                  </div>
              </div>
           </div>

           {/* Actions */}
           <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
              <button className="flex items-center gap-4 px-10 py-5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] text-lg font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-zinc-800/20 dark:shadow-white/5 group">
                 <Play className="w-6 h-6 fill-current group-hover:text-primary transition-colors" /> Bắt đầu ngay
              </button>
              
              <div className="flex items-center gap-3">
                 <button className="p-5 rounded-[1.5rem] bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 text-zinc-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm group" title="Lưu vào bookshelf">
                    <Bookmark className="w-6 h-6 group-hover:fill-current" />
                 </button>
                 <button className="p-5 rounded-[1.5rem] bg-white dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 text-zinc-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm group" title="Chia sẻ">
                    <Share2 className="w-6 h-6" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
