'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export default function SuccessScreen({ userName }: { userName?: string }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/');
    }, 8000); // 8-second fallback for auto-redirection
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="relative flex flex-col items-center justify-center text-center py-6 px-4 overflow-hidden min-h-[500px] w-full max-w-lg mx-auto">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.1, 0.9, 1.1],
            x: [10, -10, 10],
            y: [-10, 10, -10],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-500/15 rounded-full blur-[100px]" 
        />
      </div>

      {/* Main Success Icon */}
      <div className="relative flex items-center justify-center mb-10">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-purple-600 flex items-center justify-center shadow-[0_20px_50px_rgba(var(--color-primary-rgb),0.3)] dark:shadow-none ring-4 ring-white/20"
        >
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeInOut" }}
          >
            <Check className="w-12 h-12 text-white stroke-[3px]" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute w-40 h-40 rounded-full bg-primary/20 blur-3xl -z-10" 
        />
      </div>

      {/* Content Area */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-3xl sm:text-4xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight"
          >
            Sẵn sàng trải nghiệm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 italic">Lenote</span>!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="text-zinc-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-[340px] mx-auto font-medium"
          >
            Tất cả đã sẵn sàng{userName ? `, ${userName.split(' ').at(-1)}` : ''}.<br />
            Hệ thống đã được tinh chỉnh theo dấu ấn cá nhân của bạn.
          </motion.p>
        </div>

        {/* Action Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, type: "spring" }}
          className="pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="group relative px-10 py-4 bg-zinc-900 dark:bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-zinc-900/20 dark:shadow-primary/30"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Bắt đầu khám phá
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.button>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            Đã đồng bộ hóa sở thích của bạn
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
