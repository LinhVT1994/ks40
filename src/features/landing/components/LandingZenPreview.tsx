'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Maximize2, MoreHorizontal } from 'lucide-react';

export default function LandingZenPreview() {
  const [text, setText] = useState('');
  const fullText = "Trí tuệ của bạn, được dẫn dắt bởi sự tĩnh lặng. \nNơi mọi ý tưởng được kết nối và tỏa sáng.";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 relative bg-zinc-50/50 dark:bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
            >
              <Cpu className="w-3 h-3" />
              Sức mạnh của sự tập trung
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-6xl font-black text-zinc-800 dark:text-white mb-8 font-display leading-[1.1]"
            >
              TRÌNH SOẠN THẢO <br /> <span className="text-primary italic">THUẦN KHIẾT</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 dark:text-slate-400 text-lg mb-10 leading-relaxed"
            >
              Mỗi từ bạn viết, mỗi ý tưởng bạn gieo, đều xứng đáng có một không gian tôn vinh vẻ đẹp của sự tập trung. Giao diện Editor của Lenote được tinh chỉnh để biến việc ghi chép thành một nghi thức thiền định.
            </motion.p>

            <div className="grid grid-cols-2 gap-6">
               {[
                 { label: 'Auto-Focus', desc: 'Mờ nhòe mọi thứ ngoài câu đang viết' },
                 { label: 'Luminous Nodes', desc: 'Kết nối ý tưởng bằng ánh sáng' }
               ].map((item, idx) => (
                 <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10"
                 >
                    <p className="font-bold text-zinc-800 dark:text-white text-sm mb-1">{item.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-slate-400">{item.desc}</p>
                 </motion.div>
               ))}
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto relative">
             {/* The Editor Mockup */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 60px 120px rgba(0,0,0,0.2), 0 0 30px rgba(59,130,246,0.1)"
                }}
                className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-zinc-300 dark:border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.15)] dark:shadow-none overflow-hidden transition-all duration-500 cursor-default"
             >
                {/* Window Header */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/20 backdrop-blur-md">
                   <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-slate-700" />
                       <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-slate-700" />
                       <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-slate-700" />
                   </div>
                   <div className="flex items-center gap-4 text-zinc-500">
                      <Maximize2 className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                      <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                   </div>
                </div>

                {/* Editor Content Overlay */}
                <div className="p-12 min-h-[400px] relative">
                   <div className="max-w-md mx-auto">
                      <div className="h-4 w-1/3 bg-primary/20 rounded-full mb-8" />
                      <div className="h-8 w-2/3 bg-zinc-100 dark:bg-white/5 rounded-full mb-12" />
                      
                      <div className="space-y-6">
                         <div className="text-xl sm:text-2xl font-medium text-zinc-800 dark:text-white leading-relaxed font-serif min-h-[100px] relative">
                            {text}
                            <motion.span 
                               animate={{ opacity: [1, 0] }}
                               transition={{ duration: 0.8, repeat: Infinity }}
                               className="inline-block w-1 h-8 bg-primary ml-1 align-middle shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                            />
                         </div>
                      </div>
                   </div>

                   {/* Luminous Nodes Mockup */}
                   <div className="absolute top-1/4 right-10">
                      <div className="relative">
                         <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-4 h-4 rounded-full bg-primary shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,1)]" 
                         />
                         <svg className="absolute top-2 left-2 w-32 h-32 -z-10 overflow-visible">
                            <motion.path 
                               d="M 0 0 Q 30 60 100 100" 
                               fill="none" 
                               stroke="currentColor" 
                               className="text-primary/20" 
                               strokeWidth="2"
                               initial={{ pathLength: 0 }}
                               animate={{ pathLength: 1 }}
                               transition={{ duration: 2, repeat: Infinity }}
                            />
                         </svg>
                      </div>
                   </div>
                   <div className="absolute bottom-1/4 left-10">
                      <motion.div 
                         animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                         transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                         className="w-3 h-3 rounded-full bg-accent-purple shadow-[0_0_15px_rgba(168,85,247,1)]" 
                      />
                   </div>
                </div>
             </motion.div>

             {/* Background Glow */}
             <div className="absolute -inset-10 bg-primary/5 dark:bg-primary/20 blur-[120px] -z-10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
