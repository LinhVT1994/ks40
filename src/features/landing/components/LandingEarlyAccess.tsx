'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Users, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LandingEarlyAccess() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[3rem] p-12 md:p-20 text-center shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black relative overflow-hidden"
        >
           {/* Decorative elements — hidden on mobile */}
           <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full blur-[60px]" />
           <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-accent-purple/10 dark:bg-accent-purple/20 rounded-full blur-[60px]" />

           <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-8 border border-primary/20"
              >
                <Crown className="w-4 h-4" />
                Đặc quyền dành riêng cho bạn
              </motion.div>

              <h2 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white mb-8 font-display leading-tight">
                TRỞ THÀNH <br /> <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">EARLY ADOPTER</span>
              </h2>

              <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
                Chúng tôi tin vào sức mạnh của những người tiên phong. Gia nhập Lenote trong giai đoạn khởi đầu để nhận được các quyền lợi không bao giờ lặp lại.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                 {[
                   { icon: BadgeCheck, title: 'Miễn phí trọn đời', desc: 'Sử dụng mọi tính năng cốt lõi mà không tốn phí' },
                   { icon: Users, title: 'Huy hiệu thành viên', desc: 'Đánh dấu sự hiện diện của bạn từ những ngày đầu' },
                   { icon: Zap, title: 'Ưu tiên trải nghiệm', desc: 'Sử dụng các tính năng mới nhất trước mọi người' }
                 ].map((item, idx) => (
                     <motion.div 
                       key={idx}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: 0.1 * idx }}
                       whileHover={{ scale: 1.05 }}
                       className="flex flex-col items-center gap-4 group cursor-default"
                     >
                        <motion.div 
                           whileHover={{ scale: 1.1, rotate: 5 }}
                           className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500"
                         >
                           <item.icon className="w-6 h-6 text-primary shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        </motion.div>
                        <div className="text-center">
                           <h4 className="text-zinc-800 dark:text-white font-bold mb-2">{item.title}</h4>
                           <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                        </div>
                     </motion.div>
                 ))}
              </div>

              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.2)" 
                }}
                whileTap={{ scale: 0.98 }}
                className="relative group/btn w-fit mx-auto rounded-2xl"
              >
                <Link 
                  href="/register"
                  className="inline-flex items-center gap-3 px-12 py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-xl shadow-primary/20 transition-all relative overflow-hidden"
                >
                  {/* Internal Shimmer Sweep */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] transition-transform pointer-events-none" />
                  
                  <span className="relative z-10">Đăng ký ngay bây giờ</span>
                  <Zap className="w-6 h-6 fill-current relative z-10 group-hover/btn:animate-pulse" />
                </Link>

                {/* Outer focus glow */}
                <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-3xl -z-10" />
              </motion.div>

              <p className="mt-8 text-zinc-400 dark:text-zinc-500 text-xs font-medium italic">
                Cơ hội chỉ dành cho 10,000 thành viên đầu tiên. Còn lại 8,421 suất.
              </p>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
