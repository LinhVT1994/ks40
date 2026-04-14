'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function InteractiveGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // Default to mobile to prevent flash

  useEffect(() => {
    const isTouch = window.matchMedia('(hover: none)').matches;
    setIsMobile(isTouch);
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (isMobile) return null;

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
        <div className="w-full h-full bg-radial-glow opacity-[0.15] dark:opacity-[0.25] blur-[80px]" />
      </motion.div>

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
