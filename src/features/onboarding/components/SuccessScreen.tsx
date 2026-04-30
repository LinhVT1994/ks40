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
    <div className="relative flex flex-col items-center justify-center text-center py-6 px-4 overflow-hidden min-h-[500px] w-full mx-auto">
      {/* Background Aurora Effects removed, now handled by OnboardingLayout */}


      {/* Simplified Success Icon Area */}
      <div className="relative flex items-center justify-center mb-10">
        <motion.div 
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
          className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
        >
          {/* Subtle Drawing Border */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <motion.circle
              cx="50%" cy="50%" r="48%"
              fill="none"
              stroke="currentColor"
              className="text-emerald-500"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
            />
          </svg>

          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-emerald-500"
          >
            <motion.path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
        
        {/* Animated Ripple Aura */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: 1.0 
          }}
          className="absolute w-24 h-24 rounded-full border-2 border-primary/30" 
        />
      </div>

      {/* Content Area - Elegant staggered entrance */}
      <div className="space-y-6 relative z-10">
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
            className="text-3xl sm:text-4xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight"
          >
            Sẵn sàng trải nghiệm <span className="inline-block px-1 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 italic">Lenote</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }}
            className="text-zinc-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-[340px] mx-auto font-medium"
          >
            Tất cả đã sẵn sàng{userName ? `, ${userName.split(' ').at(-1)}` : ''}.<br />
            Hệ thống đã được tinh chỉnh theo dấu ấn cá nhân của bạn.
          </motion.p>
        </div>

        {/* Action Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 200, damping: 15 }}
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
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </span>
          </motion.button>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-8 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest"
          >
            Đã đồng bộ hóa sở thích của bạn
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
