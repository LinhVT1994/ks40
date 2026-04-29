'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock, Star, Bookmark, Heart, MessageCircle, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { ArticleCard, ArticlePreview, getArticlePreviewAction } from '@/features/articles/actions/article';
import { cn } from '@/lib/utils';

const PREVIEW_DELAY = 2500;

interface GlanceTriggerProps {
  article: ArticleCard;
  children: React.ReactNode;
  className?: string;
}

export function GlanceTrigger({ article, children, className }: GlanceTriggerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPopoverHovered, setIsPopoverHovered] = useState(false);
  const [previewData, setPreviewData] = useState<ArticlePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);
  
  // Refs to avoid stale closures in setTimeout
  const isHoveringRef = useRef(false);
  const isPopoverHoveredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync refs with state
  useEffect(() => { isHoveringRef.current = isHovering; }, [isHovering]);
  useEffect(() => { isPopoverHoveredRef.current = isPopoverHovered; }, [isPopoverHovered]);

  const triggerPreview = (x: number, y: number, delay: number = PREVIEW_DELAY) => {
    if (showPreview) return;
    
    // Hard disable on mobile/tablet/small laptops to prevent accidental triggers
    const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (typeof window !== 'undefined' && (window.innerWidth < 1024 || isMobileUA)) return;

    timerRef.current = setTimeout(async () => {
      setCoords({ x, y });
      setShowPreview(true);
      
      if (!previewData) {
        setIsLoading(true);
        try {
          const data = await getArticlePreviewAction(article.slug);
          setPreviewData(data);
        } catch (error) {
          console.error('Failed to fetch preview:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }, delay);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovering(true);
    setIsTouch(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    triggerPreview(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    closeTimerRef.current = setTimeout(() => {
      if (!isPopoverHoveredRef.current) {
        setShowPreview(false);
      }
    }, 100);
  };

  const handleTouchStart = () => {
    // Disabled on mobile as requested
  };

  const handleTouchEnd = () => {
    // Disabled on mobile as requested
  };

  const handlePopoverEnter = () => {
    setIsPopoverHovered(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handlePopoverLeave = () => {
    setIsPopoverHovered(false);
    closeTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowPreview(false);
      }
    }, 100);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative group/glance", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      <AnimatePresence>
        {showPreview && (
          <GlancePopover 
            article={article} 
            data={previewData} 
            isLoading={isLoading} 
            coords={coords}
            isTouch={isTouch}
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handlePopoverLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GlancePopover({ 
  article, 
  data, 
  isLoading, 
  coords,
  isTouch,
  onMouseEnter,
  onMouseLeave
}: { 
  article: ArticleCard; 
  data: ArticlePreview | null; 
  isLoading: boolean;
  coords: { x: number; y: number };
  isTouch?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice(isSmallScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted || isMobileDevice) return null;
  
  const handleReadNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    startTransition(() => {
      router.push(`/article/${article.slug}`);
      onMouseLeave(); // Close popover
    });
  };

  const isMobile = windowWidth < 640;
  const POPOVER_WIDTH = isMobile ? Math.min(windowWidth - 32, 400) : 520;
  const POPOVER_HEIGHT = 480; 
  
  const isTooLeft = coords.x < windowWidth / 2;
  
  // Mobile: Center, Desktop: Side-placed
  let finalX = isMobile 
    ? (windowWidth - POPOVER_WIDTH) / 2 
    : (isTooLeft ? coords.x + 30 : coords.x - POPOVER_WIDTH - 30);
    
  let finalY = isMobile ? coords.y - 300 : coords.y - 120; 

  if (finalY < 20) finalY = 20;
  if (typeof window !== 'undefined' && finalY + POPOVER_HEIGHT > window.innerHeight) {
    finalY = Math.max(20, window.innerHeight - POPOVER_HEIGHT - 20);
  }

  return createPortal(
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, scale: 0.9, y: isMobile ? 20 : 0, x: isMobile ? 0 : (isTooLeft ? -20 : 20) }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: isMobile ? 20 : 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ 
        left: finalX, 
        top: finalY,
        transformOrigin: isMobile ? 'bottom center' : (isTooLeft ? 'left center' : 'right center')
      }}
      className={cn(
        "fixed z-[10000] pointer-events-auto",
        isMobile ? "w-screen px-4 left-0" : ""
      )}
      onClick={(e) => isTouch && e.stopPropagation()}
    >
      <div 
        style={{ width: isMobile ? '100%' : POPOVER_WIDTH }}
        className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-black/5 dark:ring-white/5 group/popover">
        
        {/* Dynamic Hero Section */}
        <div className="h-48 relative overflow-hidden">
           {article.thumbnail ? (
             <>
               <Image
                 src={article.thumbnail}
                 alt={article.title}
                 fill
                 className="object-cover transition-transform duration-1000 group-hover/popover:scale-110"
                 style={{ objectPosition: article.thumbnailPosition ?? '50% 50%' }}
               />
               {/* Multi-layered cinematic gradient mask */}
               <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-black/20" />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-slate-900" />
             </>
           ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                <span className="text-6xl font-black text-primary/10 select-none">{article.title[0]}</span>
             </div>
           )}

           {/* Badge & Meta Chips */}
           <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 bg-primary/90 text-white backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  {article.topic.label}
                </div>
                {article.audience === 'PREMIUM' && (
                  <div className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1 shadow-xl">
                    <Star className="w-3 h-3 fill-current" /> Premium
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/20 text-[10px] font-bold text-zinc-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime} Phút Đọc 
              </div>
           </div>
        </div>

        <div className="p-6 pt-5">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-[1.2] mb-5 font-display line-clamp-2">
            {article.title}
          </h3>

          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Column 1: Learning Objectives (The "Goal") */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Star className="w-3.5 h-3.5 fill-current" /> Bạn sẽ học được
               </div>
               <div className="min-h-[80px]">
                 {isLoading ? (
                   <div className="space-y-2.5 animate-pulse">
                      <div className="h-2.5 bg-zinc-100 dark:bg-white/5 rounded-full w-full" />
                      <div className="h-2.5 bg-zinc-100 dark:bg-white/5 rounded-full w-[90%]" />
                      <div className="h-2.5 bg-zinc-100 dark:bg-white/5 rounded-full w-[95%]" />
                   </div>
                 ) : data?.objectives ? (
                   <div className="text-zinc-600 dark:text-slate-500 text-[13px] leading-relaxed space-y-2">
                      {data.objectives.split('\n').slice(0, 3).map((obj, i) => (
                        <div key={i} className="flex gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                           <span className="line-clamp-2">{obj.replace(/^[-•]\s*/, '')}</span>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="text-zinc-400 dark:text-slate-500 text-[13px] leading-relaxed italic pr-4">
                      Bài viết tập trung vào việc làm chủ các khái niệm {article.topic.label} chuyên sâu...
                   </div>
                 )}
               </div>
            </div>

            {/* Column 2: Article Summary (The "Context") */}
            <div className="space-y-3 border-l border-zinc-100 dark:border-white/5 pl-6">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-slate-500">
                  <Zap className="w-3.5 h-3.5" /> Tổng quan nội dung
               </div>
               <div className="text-zinc-600 dark:text-slate-400 text-[13px] leading-relaxed line-clamp-5">
                  {article.summary || "Thông tin tóm tắt cốt lõi cho bài viết này đang được cập nhật..."}
               </div>
            </div>
          </div>

          {/* Interaction Footer */}
          <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-zinc-400 dark:text-slate-500 transition-colors hover:text-rose-500">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-bold font-mono tracking-tight">{(data?._count.likes ?? (article as any)._count?.likes) || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-slate-500 transition-colors hover:text-primary">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-bold font-mono tracking-tight">{(data?._count.comments ?? (article as any)._count?.comments) || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-slate-500">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-bold font-mono tracking-tight">{article.viewCount || 0}</span>
              </div>
            </div>

            <button
              onClick={handleReadNow}
              disabled={isPending}
              className="group/read flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-primary dark:hover:bg-primary dark:hover:text-white shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  Đọc Bài Viết
                  <ArrowRight className="w-4 h-4 group-hover/read:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

