'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

const TESTIMONIALS = [
  {
    name: 'Hoàng Minh',
    role: 'Product Designer',
    content: 'Lenote không chỉ là một trang web đọc bài, nó là một trải nghiệm nghệ thuật. Thiết kế Zen giúp tôi tập trung hoàn toàn vào kiến thức.',
    avatar: null
  },
  {
    name: 'Linh Vũ',
    role: 'Software Engineer',
    content: 'Hệ thống Topics của Lenote giúp tôi kết nối các kiến thức rời rạc thành một mạng lưới tri thức vững chắc. Rất ấn tượng!',
    avatar: null
  },
  {
    name: 'Quốc Anh',
    role: 'Creative Director',
    content: 'Tôi thích cách Lenote loại bỏ mọi sự xao nhãng. Đây là nơi duy nhất tôi có thể thực sự "sống" cùng những trang viết.',
    avatar: null
  }
];

export default function LandingTestimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-semibold text-zinc-800 dark:text-white mb-6 font-display"
          >
            Cùng nhau <span className="text-primary italic">học hỏi mỗi ngày.</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 dark:text-slate-400 text-lg"
          >
            Lắng nghe những chia sẻ từ cộng đồng tri thức đang đồng hành cùng Lenote.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="ui-panel relative p-7 transition-shadow duration-200 hover:shadow-md"
            >
              <Quote className="absolute top-8 right-8 w-10 h-10 text-primary opacity-10 group-hover:opacity-20 transition-opacity" />
              
              <p className="text-zinc-600 dark:text-slate-300 text-lg leading-relaxed mb-8 relative z-10 italic">
                "{t.content}"
              </p>
              
              <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-white/5 pt-6">
                <Avatar name={t.name} size={48} className="border-2 border-primary/20" />
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-white">{t.name}</h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
