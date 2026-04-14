'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3.5rem] bg-white dark:bg-gradient-to-br dark:from-indigo-600 dark:via-primary dark:to-emerald-600 p-12 lg:p-20 overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black border border-zinc-200 dark:border-white/10"
        >
          {/* Abstract blobs — hidden on mobile for performance */}
          <div className="hidden md:block absolute -top-24 -right-24 w-96 h-96 bg-primary/10 dark:bg-white/20 rounded-full blur-[60px]" />
          <div className="hidden md:block absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-400/20 rounded-full blur-[60px]" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-white/20 backdrop-blur-md mb-8 border border-zinc-200 dark:border-white/20"
            >
              <Sparkles className="w-4 h-4 text-primary dark:text-white" />
              <span className="text-xs font-black text-zinc-600 dark:text-white uppercase tracking-[0.2em]">Sẵn sàng chưa?</span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-6xl font-black mb-8 font-display leading-tight"
            >
              <span className="text-zinc-900 dark:text-white">BẮT ĐẦU </span>
              <span className="bg-gradient-to-r from-indigo-600 via-primary to-emerald-600 bg-clip-text text-transparent italic">HÀNH TRÌNH</span>
              <br />
              <span className="text-zinc-900 dark:text-white">CHINH PHỤC TRI THỨC</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-zinc-500 dark:text-white/80 max-w-xl mx-auto mb-12 text-lg font-medium leading-relaxed"
            >
              Gia nhập cộng đồng hơn 10,000+ người đang sử dụng Lenote để tối ưu hóa việc học tập và làm việc mỗi ngày.
            </motion.p>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.5 }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.98 }}
               className="relative group/btn w-fit mx-auto"
            >
              <Link 
                href="/register"
                className="relative px-12 py-5 bg-zinc-900 dark:bg-white text-white dark:text-primary rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-3 overflow-hidden group/link"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-primary/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] transition-transform pointer-events-none" />
                
                <span className="relative z-10">Gia nhập ngay bây giờ</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              
              {/* External glow */}
              <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-3xl -z-10" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
