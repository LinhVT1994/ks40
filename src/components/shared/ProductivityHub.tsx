'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutGrid,
  Maximize2,
  Timer,
  X,
  CheckCircle2,
  Zap,
  Info,
  FileEdit,
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNotes } from '@/context/NotesContext';

const HIDE_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/write'];

export default function ProductivityHub() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleSidebar } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const roleX = (session?.user as { role?: string })?.role;
  const isPremium = roleX === 'PREMIUM' || roleX === 'ADMIN';

  // Check hidden path last among hooks to avoid hook mismatch
  const isHiddenPath = HIDE_PATHS.some(p => pathname.startsWith(p));

  // ── Global State Sync ──────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    // Initial check
    setIsFocusActive(document.documentElement.classList.contains('focus-mode'));
    
    // Listen for focus mode changes
    const handleFocusChange = (e: any) => {
      setIsFocusActive(e.detail.active);
    };

    // Listen for timer status from localStorage
    const syncTimerState = () => {
      const saved = localStorage.getItem('ks-global-timer');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setIsTimerActive(data.isVisible || false);
        } catch (e) {}
      }
    };

    window.addEventListener('focus-mode-changed', handleFocusChange);
    window.addEventListener('storage', syncTimerState);
    syncTimerState();

    // Event for timer toggle visibility specifically
    const handleTimerToggle = () => {
      setTimeout(syncTimerState, 50);
    };
    window.addEventListener('toggle-global-timer', handleTimerToggle);

    return () => {
      window.removeEventListener('focus-mode-changed', handleFocusChange);
      window.removeEventListener('storage', syncTimerState);
      window.removeEventListener('toggle-global-timer', handleTimerToggle);
    };
  }, []);

  // ── Auto-close on click outside ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleFocus = () => {
    if (!isPremium) return;
    window.dispatchEvent(new CustomEvent('toggle-focus-mode'));
  };

  const toggleTimer = () => {
    if (!isPremium) return;
    window.dispatchEvent(new CustomEvent('toggle-global-timer'));
  };

  if (isHiddenPath) return null;

  return (
    <div 
      className="fixed bottom-8 right-4 md:bottom-8 md:right-8 z-[100]" 
      ref={hubRef}
    >
      {/* Categorized Compact Panel */}
      <div className={`absolute bottom-full right-0 mb-4 w-[220px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isOpen 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none origin-bottom-right'
      }`}>
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-lg md:backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl dark:shadow-[0_32px_120px_rgba(0,0,0,0.8)]">
          {/* Header Bar */}
          <div className="px-5 pt-5 pb-1 flex items-center justify-between opacity-50 dark:opacity-30">
            <span className="text-[9px] font-black tracking-widest uppercase">Launcher</span>
            <div className="flex gap-1">
              <div className={`w-1 h-1 rounded-full ${isFocusActive ? 'bg-primary' : 'bg-white/20'}`} />
              <div className={`w-1 h-1 rounded-full ${isTimerActive ? 'bg-amber-400' : 'bg-white/20'}`} />
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* Group: Làm việc */}
            <div className="space-y-2">
              <HubLabel label="Làm việc" />
              <div className="grid grid-cols-2 gap-1.5">
                <CompactButton
                  onClick={() => {
                    toggleFocus();
                    setIsOpen(false);
                  }}
                  isActive={isFocusActive}
                  activeClass="bg-primary text-white"
                  icon={<Maximize2 className="w-3.5 h-3.5" />}
                  label="Focus"
                  isPremiumOnly={!isPremium}
                  disabled={!isPremium}
                />
                <CompactButton
                  onClick={() => {
                    toggleTimer();
                    setIsOpen(false);
                  }}
                  isActive={isTimerActive}
                  activeClass="bg-amber-400 text-zinc-900"
                  icon={<Timer className="w-3.5 h-3.5" />}
                  label="Timer"
                  isPremiumOnly={!isPremium}
                  disabled={!isPremium}
                />
              </div>
            </div>

            {/* Group: Công cụ */}
            <div className="space-y-2">
              <HubLabel label="Công cụ" />
              <div className="grid grid-cols-2 gap-1.5">
                <CompactButton
                  onClick={() => {
                    if (!isPremium) return;
                    toggleSidebar();
                    setIsOpen(false);
                  }}
                  isActive={false}
                  activeClass=""
                  icon={<FileEdit className="w-3.5 h-3.5" />}
                  label="Notes"
                  isPremiumOnly={!isPremium}
                  disabled={!isPremium}
                />
                <CompactButton
                  disabled
                  onClick={() => {}}
                  isActive={false}
                  activeClass=""
                  icon={<Zap className="w-3.5 h-3.5" />}
                  label="AI Chat"
                  isComingSoon
                />
              </div>
            </div>

            {/* Group: Giao diện */}
            <div className="space-y-2">
              <HubLabel label="Giao diện" />
              <div className="grid grid-cols-2 gap-1.5">
                <CompactButton
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsOpen(false);
                  }}
                  isActive={false}
                  activeClass=""
                  icon={mounted && theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  label={mounted && theme === 'dark' ? "Light Mode" : "Dark Mode"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Control Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-50 flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500 shadow-2xl group ${
          isOpen 
            ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-800 rotate-90 scale-90' 
            : 'bg-white/80 dark:bg-slate-900/80 text-zinc-600 dark:text-slate-300 hover:text-primary dark:hover:text-white backdrop-blur-lg md:backdrop-blur-3xl border border-zinc-200 dark:border-white/10 hover:rounded-2xl hover:scale-110 active:scale-95 hover:shadow-[0_4px_20px_rgba(39,39,42,0.15)] dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-purple/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <Zap className={`w-5 h-5 relative z-10 transition-transform ${isFocusActive || isTimerActive ? 'text-primary fill-primary/30 scale-110' : ''}`} />
            {(isFocusActive || isTimerActive) && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-zinc-900/20 animate-pulse" />
            )}
          </>
        )}
      </button>
    </div>
  );
}

function HubLabel({ label }: { label: string }) {
  return <h4 className="text-[8px] font-black tracking-[0.2em] text-zinc-400 dark:text-white/20 uppercase px-1">{label}</h4>;
}

function CompactButton({ 
  onClick, 
  isActive, 
  icon, 
  label, 
  activeClass, 
  isComingSoon = false, 
  disabled = false,
  isPremiumOnly = false
}: { 
  onClick: () => void; 
  isActive: boolean; 
  icon: React.ReactNode; 
  label: string;
  activeClass: string;
  isComingSoon?: boolean; 
  disabled?: boolean;
  isPremiumOnly?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg transition-all duration-300 group/btn border relative ${
        disabled && !isActive ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''
      } ${
        isActive 
          ? `${activeClass} border-transparent shadow-lg shadow-zinc-800/5 dark:shadow-white/5 font-black` 
          : 'bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'
      }`}
    >
      {isPremiumOnly && (
        <div className="absolute top-1 right-1">
          <Lock className="w-2 h-2 text-amber-500/60" />
        </div>
      )}
      <div className={`transition-transform group-hover/btn:scale-110 group-active/btn:scale-90 ${isActive ? '' : 'text-primary'}`}>
        {icon}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-bold tracking-tight text-center leading-none uppercase">
          {label}
        </span>
        {isComingSoon && (
          <span className="text-[6px] font-black text-amber-500/80 uppercase tracking-tighter">Soon</span>
        )}
        {isPremiumOnly && !isComingSoon && (
          <span className="text-[6px] font-black text-amber-500/80 uppercase tracking-tighter">Premium</span>
        )}
      </div>
    </button>
  );
}
