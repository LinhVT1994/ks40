'use client';

import React from 'react';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';
import LandingCTA from './LandingCTA';
import LandingStats from './LandingStats';
import LandingProcess from './LandingProcess';
import LandingShowcase from './LandingShowcase';
import LandingTestimonials from './LandingTestimonials';
import LandingComparison from './LandingComparison';
import LandingZenPreview from './LandingZenPreview';
import LandingEarlyAccess from './LandingEarlyAccess';
import { CursorSpotlight } from './LandingSpotlight';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <main className="min-h-screen bg-white dark:bg-[#020617] relative selection:bg-primary/30">
      <CursorSpotlight />
      {/* Scroll Progress Bar - Refined & Subtle */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[100] origin-left shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
        style={{ scaleX }}
      />

      <div className="relative z-10">
        <LandingHero />
        
        <LandingComparison />

        <LandingStats />
        
        <LandingZenPreview />

        <LandingFeatures />

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent mx-auto max-w-4xl opacity-50" />

        <LandingProcess />

        <LandingShowcase />

        <LandingEarlyAccess />

        <LandingTestimonials />
        
        <LandingCTA />
      </div>
    </main>
  );
}
