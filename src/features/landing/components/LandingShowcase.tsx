'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SHOWCASE_ITEMS = [
  {
    title: 'Tương lai của Trí tuệ nhân tạo trong năm 2026',
    topic: 'Công nghệ',
    views: '12.5k',
    time: '8 phút đọc',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    title: 'Nghệ thuật Minimalism trong tư duy hiện đại',
    topic: 'Lối sống',
    views: '8.2k',
    time: '5 phút đọc',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    title: 'Xây dựng hệ thống học tập trọn đời',
    topic: 'Phát triển bản thân',
    views: '15k',
    time: '12 phút đọc',
    gradient: 'from-orange-500 to-rose-600'
  }
];

export default function LandingShowcase() {
  return (
    <section className="py-24 relative bg-zinc-50/30 dark:bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-5xl font-black text-zinc-800 dark:text-white mb-6 font-display"
            >
              NỘI DUNG <span className="text-primary italic">TINH HOA</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 dark:text-slate-400 text-lg"
            >
              Khám phá hàng ngàn bài viết chất lượng cao được đúc kết từ những người dẫn đầu trong mọi lĩnh vực.
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link 
              href="/explore"
              className="group flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
            >
              Khám phá tất cả bài viết 
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SHOWCASE_ITEMS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ 
                y: -12, 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(59, 130, 246, 0.4)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.15), 0 0 25px rgba(59, 130, 246, 0.15)"
              }}
              className="relative p-6 rounded-[2.5rem] bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 transition-all duration-500 group cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
            >
              <div className="aspect-[16/10] rounded-[1.5rem] bg-zinc-100 dark:bg-white/5 overflow-hidden mb-8 group-hover:shadow-2xl transition-all duration-500 relative">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                   <div className="p-1 px-3 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Article Preview</div>
                </div>
                {/* Visual Gradient Mask for the image area */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity duration-700`} />
              </div>
              
              {/* Content area */}
              <div className="flex flex-col flex-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white text-[10px] font-black uppercase tracking-widest mb-4 w-fit transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                  <Tag className="w-3 h-3" />
                  {item.topic}
                </div>
                
                <h3 className="text-2xl font-black text-zinc-800 dark:text-white mb-6 font-display line-clamp-3 leading-tight group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-white/10 text-zinc-400 dark:text-white/60 text-[10px] font-black uppercase tracking-widest">
                  <span>{item.views} lượt xem</span>
                  <span>{item.time}</span>
                </div>
              </div>

              {/* Luminous Glow on Hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-purple opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
