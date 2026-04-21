'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AuraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AuraBackground({ className, children }: AuraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      {/* Moving Aura Spheres */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary/20 rounded-full blur-[100px] animate-aura" />
        <div className="absolute top-1/4 -right-1/4 w-full h-full bg-accent-purple/20 rounded-full blur-[100px] animate-aura [animation-delay:2s]" />
        <div className="absolute -bottom-1/4 left-1/4 w-full h-full bg-blue-500/10 rounded-full blur-[100px] animate-aura [animation-delay:5s]" />
      </div>
      
      {/* Noise Texture Overlay for Premium Feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none z-[1]" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
