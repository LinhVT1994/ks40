'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function InteractiveGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Use springs for smooth movement
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
        }}
        className="absolute w-[600px] h-[600px] rounded-full"
      >
        {/* The Glow Blob */}
        <div className="w-full h-full bg-radial-glow opacity-[0.15] dark:opacity-[0.25] blur-[100px]" />
      </motion.div>
      
      {/* Decorative noise/texture if needed, but keeping it Zen for now */}
      <style jsx global>{`
        .bg-radial-glow {
          background: radial-gradient(
            circle,
            rgba(99, 102, 241, 0.4) 0%,
            rgba(168, 85, 247, 0.2) 25%,
            rgba(59, 130, 246, 0.1) 50%,
            transparent 70%
          );
        }
      `}</style>
    </div>
  );
}
