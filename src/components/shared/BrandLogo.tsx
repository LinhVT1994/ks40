'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export default function BrandLogo({ className = "", size = 32 }: BrandLogoProps) {
  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="initial"
      animate="animate"
    >
      {/* Background with subtle glass effect */}
      <rect 
        x="1" 
        y="1" 
        width="30" 
        height="30" 
        rx="8" 
        fill="#0F172A" 
        fillOpacity="0.9"
      />
      
      {/* Gradient Border */}
      <motion.rect 
        x="1" 
        y="1" 
        width="30" 
        height="30" 
        rx="8" 
        stroke="url(#brand_gradient)" 
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Chevron / Code Symbol with "Drawing" and "Breathing" animation */}
      <motion.path 
        d="M11 10L19 16L11 22" 
        stroke="#3B82F6" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: [0.7, 1, 0.7],
          scale: [0.98, 1, 0.98]
        }}
        transition={{ 
          pathLength: { duration: 1, ease: "easeOut" },
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ transformOrigin: "center" }}
      />
      
      <defs>
        <linearGradient 
          id="brand_gradient" 
          x1="0" 
          y1="0" 
          x2="32" 
          y2="32" 
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
