'use client';

import React, { useState, useEffect } from 'react';
import BrandLogo from '@/components/shared/BrandLogo';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Loading() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse tracking
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background-light dark:bg-background-dark transition-colors duration-500 overflow-hidden cursor-none">
      {/* Interactive Mouse Glow */}
      <motion.div 
        className="absolute w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-0"
        style={{ 
          left: smoothX, 
          top: smoothY,
          translateX: '-50%',
          translateY: '-50%'
        }}
      />

      {/* Global Grain/Noise Overlay for high-end look */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Background Ambient Glow — Breathing */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        initial={{ opacity: 0.3 }}
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full" />
      </motion.div>

      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Main Logo Breathing Container */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: 1,
            y: [0, -8, 0]
          }}
          transition={{ 
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8 }
          }}
          className="relative flex items-center justify-center"
        >
          {/* External Glow Pulse */}
          <motion.div 
            className="absolute inset-0 bg-primary/15 blur-3xl rounded-full"
            animate={{ 
              scale: [1.2, 1.5, 1.2],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          
          <BrandLogo size={120} className="relative z-10" />
        </motion.div>

        {/* Minimalist tagline that fades in slowly */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-[-60px] whitespace-nowrap"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-slate-400">
            Nâng tầm tri thức công nghệ
          </span>
        </motion.div>
      </div>

      {/* Floating Particles (Faint) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full z-0"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: 0 
          }}
          animate={{ 
            y: [null, '-20px', '20px'],
            opacity: [0, 0.5, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity, 
            delay: Math.random() * 5 
          }}
        />
      ))}
    </div>
  );
}
