'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import LandingSpotlight from './LandingSpotlight';

export default function LandingHero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
      <LandingSpotlight />

      {/* Background Ornaments — hidden on mobile for performance */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px]" />
        <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-50 pointer-events-none">
          <filter id="luminous" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <circle cx="50%" cy="40%" r="20%" fill="url(#hero-gradient)" filter="url(#luminous)" />
          <defs>
            <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Top Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-xl shadow-primary/5"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Khám phá vũ trụ tri thức Zen</span>
      </motion.div>

      {/* Main Headline */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-800 dark:text-white leading-[1.1] mb-8 font-display"
        >
          <span className="sr-only">Lenote — Nâng tầm tri thức công nghệ trong tĩnh lặng. </span>
          <motion.span 
            className="inline-block"
            whileHover={{ scale: 1.02, textShadow: "0 0 20px rgba(59,130,246,0.3)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            NÂNG TẦM
          </motion.span> <br />
          <motion.span 
            whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-primary to-emerald-500 animate-text-shimmer bg-[length:200%_auto] cursor-pointer"
          >
            TRI THỨC
          </motion.span> <br />
          <motion.span 
            className="inline-block"
            whileHover={{ scale: 1.02, textShadow: "0 0 20px rgba(16,185,129,0.3)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            TRONG TĨNH LẶNG
          </motion.span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg sm:text-xl text-zinc-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          Trải nghiệm nền tảng quản lý tri thức không xao nhãng. <br className="hidden sm:block" />
          Nơi tập trung sâu, kết nối mạnh và phát triển bền vững.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link 
            href="/register"
            className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-[20deg]" />
            Bắt đầu ngay
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            href="/explore"
            className="px-8 py-4 bg-white/5 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-white rounded-2xl font-bold text-lg hover:bg-zinc-50 dark:hover:bg-white/10 transition-all flex items-center gap-3 group"
          >
            Khám phá bài viết
            <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
          </Link>
        </motion.div>
      </div>

    </section>
  );
}
