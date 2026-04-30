'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, X, Minus, Maximize2 } from 'lucide-react';

export default function GlobalTimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // total seconds
  
  // Ref to track state for storage
  const stateRef = useRef({ elapsed, isRunning, isVisible, isMinimized });

  useEffect(() => {
    stateRef.current = { elapsed, isRunning, isVisible, isMinimized };
  }, [elapsed, isRunning, isVisible, isMinimized]);

  // ── Load state from localStorage ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('ks-global-timer');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setElapsed(data.elapsed || 0);
        setIsRunning(data.isRunning || false);
        setIsVisible(data.isVisible || false);
        setIsMinimized(data.isMinimized || false);
        
        if (data.isRunning && data.lastTick) {
          const diff = Math.floor((Date.now() - data.lastTick) / 1000);
          setElapsed(prev => prev + (diff > 0 ? diff : 0));
        }
      } catch (e) {
        console.error('Failed to parse global timer state', e);
      }
    }
  }, []);

  // ── Save state to localStorage ────────────────────────────
  useEffect(() => {
    const data = {
      elapsed,
      isRunning,
      isVisible,
      isMinimized,
      lastTick: Date.now()
    };
    localStorage.setItem('ks-global-timer', JSON.stringify(data));
  }, [elapsed, isRunning, isVisible, isMinimized]);

  // ── Timer Interval ────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // ── Listen for global toggle events ───────────────────────
  useEffect(() => {
    const handleToggle = () => setIsVisible(prev => !prev);
    const handleOpen   = () => setIsVisible(true);
    
    // Keyboard shortcut 'T'
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable || e.metaKey || e.ctrlKey) return;
      if (e.key === 't' || e.key === 'T') handleToggle();
    };

    window.addEventListener('toggle-global-timer', handleToggle);
    window.addEventListener('open-global-timer', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('toggle-global-timer', handleToggle);
      window.removeEventListener('open-global-timer', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-[82px] right-4 md:right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 md:gap-4 px-3.5 md:px-5 py-2 md:py-3 bg-zinc-800/90 backdrop-blur-lg md:backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all hover:scale-105 group ring-1 ring-white/5"
        >
          <div className="relative flex items-center justify-center">
            <Timer className={`w-3 h-3 md:w-4 md:h-4 ${isRunning ? 'text-primary' : 'text-zinc-400'} relative z-10`} />
            {isRunning && (
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[11px] md:text-sm font-black text-white tabular-nums tracking-wide">
            {formatTime(elapsed)}
          </span>
          <Maximize2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-zinc-400 group-hover:text-primary transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[82px] right-4 md:right-6 z-[9999] w-[180px] md:w-64 bg-zinc-900/80 backdrop-blur-lg md:backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-700 ring-1 ring-white/5 group/timer">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 blur-[40px] transition-all duration-1000 ${
        isRunning ? 'bg-primary/20' : 'bg-zinc-500/10'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-3.5 border-b border-white/5 bg-white/5 relative z-10">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Timer className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isRunning ? 'text-primary animate-pulse' : 'text-zinc-400'}`} />
          <span className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-90 hidden sm:inline">Timer</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all"
          >
            <Minus className="w-3 md:w-3.5 h-3 md:h-3.5" />
          </button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-all"
          >
            <X className="w-3 md:w-3.5 h-3 md:h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="p-3.5 md:p-6 pb-4 md:pb-7 flex flex-col items-center relative z-10">
        {/* Circular Progress Visualizer */}
        <div className="relative mb-3 md:mb-6 group/display">
          {/* Mobile SVG (180px context) */}
          <svg className="w-20 h-20 transform -rotate-90 md:hidden">
            <circle className="text-white/5" strokeWidth="3" stroke="currentColor" fill="transparent" r="36" cx="40" cy="40" />
            <circle
              className={`${isRunning ? 'text-primary' : 'text-zinc-700'} transition-all duration-1000 ease-out`}
              strokeWidth="3"
              strokeDasharray={226}
              strokeDashoffset={226 - (226 * (elapsed % 60)) / 60}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="36"
              cx="40"
              cy="40"
            />
          </svg>
          
          {/* Desktop SVG (w-64 context) */}
          <svg className="w-32 h-32 transform -rotate-90 hidden md:block">
            <circle className="text-white/5" strokeWidth="5" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
            <circle
              className={`${isRunning ? 'text-primary' : 'text-zinc-700'} transition-all duration-1000 ease-out`}
              strokeWidth="5"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * (elapsed % 60)) / 60}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="58"
              cx="64"
              cy="64"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-xl md:text-3xl font-black tabular-nums tracking-tighter transition-all duration-500 ${
              isRunning ? 'text-white scale-105' : 'text-zinc-400'
            }`}>
              {formatTime(elapsed)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 md:py-3.5 rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
              isRunning 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'bg-primary text-zinc-900'
            }`}
          >
            {isRunning ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isRunning ? 'Dừng' : 'Bắt đầu'}</span>
          </button>

          <button 
            onClick={() => { setElapsed(0); setIsRunning(false); }}
            className="p-2 md:p-3.5 bg-white/5 text-zinc-400 hover:text-white rounded-xl border border-white/5"
          >
            <RotateCcw className="w-3 md:w-4 h-3 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
