'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, MessageSquare, AlertCircle, Coffee, CheckCircle2 } from 'lucide-react';

export default function LandingComparison() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="py-24 relative bg-white dark:bg-[#020617] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-black text-zinc-800 dark:text-white mb-6 font-display"
          >
            TỪ <span className="text-zinc-500">HỖN LOẠN</span> ĐẾN <span className="text-primary italic">TĨNH LẶNG</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 dark:text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Internet hiện nay là một cuộc chiến giành giật sự chú ý. Lenote là nơi duy nhất trả lại cho bạn quyền làm chủ tâm trí.
          </motion.p>
        </div>

        <div 
          className="relative h-[600px] rounded-[3rem] overflow-hidden border border-zinc-300 dark:border-white/10 shadow-2xl cursor-ew-resize group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Background: Digital Noise */}
          <div className="absolute inset-0 bg-zinc-100 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-8 opacity-20 dark:opacity-10 rotate-12 scale-150">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  {i % 3 === 0 ? <Bell className="w-10 h-10 text-red-500" /> : 
                   i % 3 === 1 ? <Mail className="w-10 h-10 text-blue-500" /> : 
                   <MessageSquare className="w-10 h-10 text-primary" />}
                   <div className="h-2 w-16 bg-zinc-500 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-zinc-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-slate-600 font-bold uppercase tracking-widest italic">Sự xao nhãng bủa vây</p>
                </div>
            </div>
          </div>

          {/* Foreground: Zen Focus (Moving Divider) */}
          <motion.div 
            className="absolute inset-0 bg-white dark:bg-slate-950 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] overflow-hidden"
            initial={{ clipPath: 'inset(0 0 0 50%)' }}
            animate={{ clipPath: isHovered ? 'inset(0 0 0 20%)' : 'inset(0 0 0 50%)' }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            {/* The "Zen" Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <div className="max-w-md">
                <motion.div
                   animate={{ y: [0, -5, 0] }}
                   transition={{ duration: 3, repeat: Infinity }}
                   className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-10"
                >
                  <Coffee className="w-8 h-8 text-primary" />
                </motion.div>
                
                <h3 className="text-4xl font-black text-zinc-800 dark:text-white mb-6 font-display leading-[1.1]">
                  TỰ DO TRÌNH BÀY <br /> <span className="text-primary italic">TRI THỨC</span>
                </h3>
                
                <p className="text-zinc-500 dark:text-slate-400 text-lg mb-10 italic leading-relaxed">
                   "Vẻ đẹp thực sự của thông tin nằm ở sự tinh khiết của không gian xung quanh nó."
                </p>

                <div className="flex flex-col gap-4 text-left">
                  {[
                    'Sạch quảng cáo 100%',
                    'Bố cục Zen tập trung cao độ',
                    'Đọc & Viết không giới hạn'
                  ].map((text, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-bold text-zinc-700 dark:text-slate-300">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glowing vertical bar at the divider */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          </motion.div>
          
          {/* Hover hint */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-zinc-800/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Di chuyển chuột để trải nghiệm sự tĩnh lặng
          </div>
        </div>
      </div>
    </section>
  );
}
