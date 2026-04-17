'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Share2, Award, Coffee, BookOpen, Fingerprint } from 'lucide-react';

const FEATURES = [
  {
    icon: Coffee,
    title: 'Vườn tri thức (Digital Garden)',
    description: 'Nơi tri thức được vun trồng trong tĩnh lặng. Thiết kế tối giản giúp bạn tập trung hoàn toàn vào việc tiếp nhận và kiến tạo giá trị.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: BookOpen,
    title: 'Mạng lưới tri thức đa chiều',
    description: 'Kết nối các chủ đề thông minh, giúp bạn xây dựng bộ não thứ hai (Second Brain) và nhìn thấy bức tranh toàn cảnh của mọi vấn đề.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Fingerprint,
    title: 'Nâng tầm sự nghiệp',
    description: 'Lan tỏa kinh nghiệm đa góc nhìn, từ bài học chuyên môn sâu sắc đến câu chuyện đời sống, khẳng định dấu ấn cá nhân của bạn.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  }
];

export default function LandingFeatures() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-black text-zinc-800 dark:text-white mb-6 font-display"
          >
            TẠI SAO CHỌN <span className="text-primary">LENOTE?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 dark:text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Chúng tôi định nghĩa lại cách bạn tương tác với thông tin hàng ngày.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ 
                y: -10, 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(59, 130, 246, 0.4)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 20px rgba(59, 130, 246, 0.1)" 
              }}
              className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-sm transition-all duration-500 cursor-pointer"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500`}
              >
                <f.icon className={`w-7 h-7 ${f.color} group-hover:text-white`} />
              </motion.div>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-4">
                {f.title}
              </h3>
              <p className="text-zinc-500 dark:text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
