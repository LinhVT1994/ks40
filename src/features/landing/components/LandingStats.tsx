'use client';

import React from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'Bài viết tri thức', value: '25k+', suffix: 'Khám phá' },
  { label: 'Chủ đề chuyên sâu', value: '450+', suffix: 'Kết nối' },
  { label: 'Thành viên tinh hoa', value: '10k+', suffix: 'Phát triển' },
  { label: 'Độc giả hàng tháng', value: '150k+', suffix: 'Lan tỏa' },
];

export default function LandingStats() {
  return (
    <section className="py-20 relative bg-zinc-50/50 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: "rgba(59, 130, 246, 0.05)",
              }}
              className="p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/[0.02] flex flex-col items-center justify-center text-center transition-all duration-300 cursor-default"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="text-4xl sm:text-5xl font-black text-zinc-800 dark:text-white mb-3 font-display"
              >
                {stat.value}
              </motion.div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                {stat.suffix}
              </div>
              <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-slate-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-t from-transparent via-primary/20 to-transparent" />
    </section>
  );
}
