'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Edit3, Send } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Khám phá tri thức',
    description: 'Sàng lọc qua "nhiễu" để tìm thấy những kiến thức chất lượng nhất từ cộng đồng chuyên gia.',
    step: '01'
  },
  {
    icon: Edit3,
    title: 'Đúc kết & Ghi chép',
    description: 'Tổ chức suy nghĩ trong không gian "Zen" tối giản, giúp bạn ghi nhớ và thấu hiểu sâu sắc hơn.',
    step: '02'
  },
  {
    icon: Send,
    title: 'Lan tỏa giá trị',
    description: 'Chia sẻ những góc nhìn độc đáo của bạn và cùng cộng đồng xây dựng mạng lưới tri thức mạnh mẽ.',
    step: '03'
  }
];

export default function LandingProcess() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4"
          >
            Hành trình trải nghiệm
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-black text-zinc-800 dark:text-white mb-6 font-display"
          >
            QUY TRÌNH <span className="text-primary italic">TỐI GIẢN</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/5 to-transparent -translate-y-12" />
          
          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              className="relative p-10 rounded-[3rem] bg-zinc-50 dark:bg-white/[0.03] border border-white/5 transition-all duration-500 group cursor-default"
            >
              <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-primary/20 z-10 group-hover:scale-110 transition-transform">
                {idx + 1}
              </div>

              {/* Icon Container */}
              <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 shadow-2xl flex items-center justify-center mb-10 z-10 group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-primary/20">
                <step.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
                
                {/* Luminous indicator */}
                <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-4 relative z-10 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-zinc-500 dark:text-slate-400 leading-relaxed text-sm max-w-xs relative z-10">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
