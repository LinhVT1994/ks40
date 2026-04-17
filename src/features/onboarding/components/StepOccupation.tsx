'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import type { OccupationOption } from '@/features/onboarding/actions/onboarding';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  isPending: boolean;
  options: OccupationOption[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

export default function StepOccupation({ value, onChange, onNext, onSkip, isPending, options }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header section - Left aligned */}
      <div className="text-left space-y-4 px-2">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight"
        >
          Bạn là ai?
        </motion.h1>
      </div>

      {/* Grid layout to save vertical space */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {options.map(({ value: v, label, emoji, description }) => {
          const isActive = value === v;
          return (
            <motion.button
              key={v}
              variants={item}
              type="button"
              onClick={() => onChange(v)}
              className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                  : 'bg-zinc-50/50 dark:bg-transparent border-zinc-200 dark:border-white/5 hover:border-zinc-300 hover:bg-zinc-100 dark:hover:border-white/20 border-solid'
              }`}
            >
              <span className="text-xl shrink-0">{emoji ?? '👤'}</span>
              
              <div className="flex-1 text-left min-w-0">
                <span className={`block text-xs font-semibold truncate ${
                  isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-800 dark:text-white'
                }`}>
                  {label}
                </span>
                {description && (
                  <span className={`block text-[10px] font-medium leading-normal ${
                    isActive ? 'text-white/50 dark:text-zinc-400' : 'text-zinc-500 dark:text-slate-500'
                  }`}>
                    {description}
                  </span>
                )}
              </div>

              {isActive && (
                <Check className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white dark:text-zinc-900' : ''}`} />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Compact Navigation */}
      <div className="flex flex-col items-center gap-4 pt-4 border-t border-zinc-50 dark:border-white/5">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={onNext}
          disabled={!value || isPending}
          className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Tiếp tục <ArrowRight className="w-4 h-4" /></>}
        </motion.button>
        
        <button
          type="button"
          onClick={onSkip}
          disabled={isPending}
          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
        >
          Thiết lập sau
        </button>
      </div>
    </div>
  );
}
