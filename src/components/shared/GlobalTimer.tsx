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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
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
      <div className="fixed bottom-[82px] right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-4 px-5 py-3 bg-zinc-800/90 backdrop-blur-3xl max-md:backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all hover:scale-105 group ring-1 ring-white/5"
        >
          <div className="relative flex items-center justify-center">
            <Timer className={`w-4 h-4 ${isRunning ? 'text-primary' : 'text-zinc-400'} relative z-10`} />
            {isRunning && (
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-black text-white tabular-nums tracking-wide">
            {formatTime(elapsed)}
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[82px] right-6 z-[9999] w-64 bg-zinc-900/80 backdrop-blur-3xl max-md:backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-700 ring-1 ring-white/5 group/timer">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 blur-[50px] transition-all duration-1000 ${
        isRunning ? 'bg-primary/20' : 'bg-zinc-500/10'
      }`} />

      {/* Sheen Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover/timer:translate-x-full transition-transform duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-primary animate-pulse' : 'text-zinc-400'}`} />
            <div className={`absolute -inset-1 bg-primary/20 blur-sm rounded-full transition-opacity ${isRunning ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-90">Sử dụng thời gian</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-90"
            title="Thu nhỏ"
          >
            <div className="flex items-center justify-center">
              <Minus className="w-3.5 h-3.5" />
            </div>
          </button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-all active:scale-90"
            title="Đóng"
          >
            <div className="flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="p-6 pb-7 flex flex-col items-center relative z-10">
        {/* Circular Progress Visualizer */}
        <div className="relative mb-6 group/display">
          <svg className="w-32 h-32 transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]">
            <circle
              className="text-white/5"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
              r="58"
              cx="64"
              cy="64"
            />
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
            <div className={`text-3xl font-black tabular-nums tracking-tighter mb-0.5 transition-all duration-500 ${
              isRunning ? 'text-white scale-105' : 'text-zinc-400'
            }`}>
              {formatTime(elapsed)}
            </div>
            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest opacity-80">
              {isRunning ? 'Đang chạy' : 'Đã dừng'}
            </div>
          </div>

          {/* Decorative Glow */}
          {isRunning && (
            <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full -z-10 animate-pulse" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
              isRunning 
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 ring-1 ring-amber-500/20' 
                : 'bg-primary text-zinc-900 hover:bg-primary-hover shadow-primary/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Dừng lại</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Bắt đầu</span>
              </>
            )}
          </button>

          <button 
            onClick={() => { setElapsed(0); setIsRunning(false); }}
            className="p-3.5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 group/reset active:rotate-180"
            title="Làm mới"
          >
            <RotateCcw className="w-4 h-4 transition-transform duration-500" />
          </button>
        </div>
      </div>
      
      {/* Bottom Subtle Bar */}
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div className={`h-full bg-primary/40 transition-all duration-300 ${isRunning ? 'animate-[shimmer_2s_infinite_linear]' : 'w-0'}`} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
