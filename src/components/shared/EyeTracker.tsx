'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function EyeTracker() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Random blinking logic
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 3000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(blinkInterval);
    };
  }, []);

  const renderEye = (ref: React.RefObject<HTMLDivElement | null>) => {
    let pupilX = 0;
    let pupilY = 0;

    const rect = ref.current?.getBoundingClientRect();
    const eyeCenterX = rect ? rect.left + rect.width / 2 : 0;
    const eyeCenterY = rect ? rect.top + rect.height / 2 : 0;

    const angle = Math.atan2(mousePos.y - eyeCenterY, mousePos.x - eyeCenterX);
    const distRaw = Math.hypot(mousePos.x - eyeCenterX, mousePos.y - eyeCenterY);
    const distance = rect ? Math.min(distRaw / 12, 6) : 0;

    pupilX = Math.cos(angle) * distance;
    pupilY = Math.sin(angle) * distance;

    // Pupil dilation logic: get larger as mouse gets closer
    const dilation = Math.max(0.8, 1.2 - Math.min(distRaw / 500, 0.4));
    
    return (
      <div 
        ref={ref}
        className="w-5 h-5 sm:w-6 sm:h-6 bg-white dark:bg-slate-900 rounded-full border border-zinc-200 dark:border-white/20 relative flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
        style={{ 
          height: isBlinking ? '1px' : undefined, 
          opacity: isBlinking ? 0.2 : 1,
          background: 'radial-gradient(circle at 30% 30%, var(--tw-bg-opacity, 1) 0%, rgba(0,0,0,0.05) 100%)' 
        }}
      >
        {!isBlinking && (
          <div 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-blue-500 via-primary to-blue-700 rounded-full absolute transition-all duration-150 shadow-sm flex items-center justify-center"
            style={{ 
              transform: `translate(${pupilX}px, ${pupilY}px) scale(${dilation})`,
            }}
          >
            {/* Primary Glint */}
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white/95 rounded-full blur-[0.1px]" />
            {/* Secondary Sparkle */}
            <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-white/70 rounded-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="inline-flex items-center gap-0.5 ml-1 align-middle">
      {renderEye(leftEyeRef)}
      {renderEye(rightEyeRef)}
    </div>
  );
}
