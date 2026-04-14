'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Hữu Toàn',
    role: 'Senior FE Developer @ VNG',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop',
    content: 'Lộ trình cực kỳ chi tiết! Những phần giải thích về JS Engine và Performance thực sự đã giúp mình lấp đầy những khoảng trống kiến thức mà bấy lâu nay mình chỉ làm theo bản năng.',
    rating: 5
  },
  {
    id: '2',
    name: 'Minh Thư',
    role: 'Frontend Dev @ Techcombank',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    content: 'Nhờ nắm vững các concept trong khóa học, mình đã tự tin hơn hẳn khi phỏng vấn các vị trí Senior. Đặc biệt là phần Next.js Server Components được trình bày rất trực quan và dễ hiểu.',
    rating: 5
  },
  {
    id: '3',
    name: 'Quốc Bảo',
    role: 'Web Developer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    content: 'Mọi thắc mắc đều được anh tác giả giải đáp rất nhanh. Tài liệu bổ trợ và các ví dụ thực tế giúp mình áp dụng được ngay vào dự án đang làm tại công ty. Rất đáng giá!',
    rating: 5
  }
];

export default function TestimonialsCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth * 0.85 + 24;
        const index = Math.round(scrollLeft / width);
        if (index !== activeSlide) setActiveSlide(index);
      }
    };

    const timer = setInterval(() => {
      if (scrollRef.current && window.innerWidth < 1024) {
        const nextSlide = (activeSlide + 1) % TESTIMONIALS.length;
        const width = scrollRef.current.offsetWidth * 0.85 + 24;
        scrollRef.current.scrollTo({ left: nextSlide * width, behavior: 'smooth' });
      }
    }, 6000);

    const currentRef = scrollRef.current;
    currentRef?.addEventListener('scroll', handleScroll);
    return () => {
      currentRef?.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, [activeSlide]);

  return (
    <section className="px-5 md:px-12 py-20 md:py-32 bg-zinc-50 dark:bg-slate-950/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block">
        <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[60px] dark:opacity-30" />
        <div className="absolute bottom-[-10%] right-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[60px] dark:opacity-20" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-primary/10 backdrop-blur-md mb-8">
            <Users className="w-3.5 h-3.5" /> Trusted by Thousands
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-800 dark:text-white font-display mb-6 md:mb-8 tracking-tight">Member nói gì?</h2>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Hơn 2,500 thành viên đã tin tưởng và gặt hái thành công cùng lộ trình học tập chuyên sâu này.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 pb-12 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="w-[85vw] md:w-full shrink-0 snap-center snap-always p-8 md:p-10 bg-white dark:bg-white/[0.02] border border-zinc-300/60 dark:border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group relative">
              <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-10">
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-primary to-blue-500 ring-4 ring-primary/5">
                  <Image src={t.avatar} alt={t.name} fill sizes="64px" className="object-cover rounded-xl" />
                </div>
                <div>
                  <h5 className="text-lg md:text-xl font-black text-zinc-800 dark:text-white tracking-tight">{t.name}</h5>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.role}</p>
                </div>
              </div>

              <p className="text-base md:text-lg text-zinc-600 dark:text-slate-400 leading-relaxed font-medium italic">
                &ldquo;{t.content}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* Dot Indicators for Mobile Carousel */}
        <div className="flex lg:hidden justify-center gap-2.5 mt-8 relative z-10">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (scrollRef.current) {
                  const width = scrollRef.current.offsetWidth * 0.85 + 24;
                  scrollRef.current.scrollTo({ left: i * width, behavior: 'smooth' });
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                activeSlide === i
                  ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'
                  : 'w-1.5 bg-zinc-300 dark:bg-white/10 hover:bg-zinc-500'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
