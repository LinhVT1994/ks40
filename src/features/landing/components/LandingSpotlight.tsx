'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function LandingSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);

  // Smooth the mouse movement
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const isTouch = window.matchMedia('(hover: none)').matches;
    setIsMobile(isTouch);
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (isMobile) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(600px circle at var(--x) var(--y), rgba(59, 130, 246, 0.08), transparent 80%)`,
      } as any}
      animate={{
        opacity: [0, 1],
      }}
    >
        <motion.div
            className="absolute inset-0"
            style={{
                background: `radial-gradient(600px circle at var(--x) var(--y), rgba(59, 130, 246, 0.08), transparent 80%)`,
                // We use dynamic CSS variables for the mouse position
                ['--x' as any]: springX.get() + 'px',
                ['--y' as any]: springY.get() + 'px',
            } as any}
        />
    </motion.div>
  );
}

// Optimization: use a simpler version for the global follow
export function CursorSpotlight() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const isTouch = window.matchMedia('(hover: none)').matches;
        setIsMobile(isTouch);
        if (isTouch) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    if (isMobile) return null;

    return (
        <div
            className="pointer-events-none fixed inset-0 z-10"
            style={{
                background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.05), transparent 80%)`,
            }}
        />
    );
}
