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
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-semibold text-zinc-800 dark:text-white mb-6 font-display"
          >
            Một nơi để <span className="text-primary">hiểu sâu hơn.</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
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
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="ui-panel group p-7 md:p-8 transition-shadow duration-200 hover:shadow-md"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-all duration-500`}
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
