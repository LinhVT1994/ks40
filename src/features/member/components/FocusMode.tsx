'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Minimize2, Play, Pause, Gauge, CloudRain, Coffee, Trees, Volume2, ZoomIn, ZoomOut, FileEdit } from 'lucide-react';

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rainy Day', url: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-on-a-window-2444.mp3', icon: CloudRain },
  { id: 'cafe', name: 'City Café', url: 'https://assets.mixkit.co/sfx/preview/mixkit-city-restaurant-ambience-450.mp3', icon: Coffee },
  { id: 'forest', name: 'Nature Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-bird-chirp-night-1214.mp3', icon: Trees },
  { id: 'waves', name: 'Ocean Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-sea-waves-loop-1196.mp3', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg> },
  { id: 'wind', name: 'Soft Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-howl-shaking-windows-1153.mp3', icon: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7A2.5 2.5 0 1 1 20 12H4"/><path d="M9.6 4.6A2 2 0 1 1 11 8H4"/><path d="M12.6 19.4A2 2 0 1 0 14 16H4"/></svg> },
];

type Heading = { level: number; text: string; id: string };

const MIN_ZOOM    = 0.8;
const MAX_ZOOM    = 2.0;
const DEFAULT_ZOOM = 1.0;

// px per frame at 60fps — speed is a float (1.0 → 5.0 step 0.5)
const speedToPx = (s: number) => 0.15 * Math.pow(s, 1.6);

export default function FocusMode({ readTime, headings, onToggleNotes }: { readTime: number; headings: Heading[]; onToggleNotes?: () => void }) {
  const [active,      setActive]      = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [zoom,        setZoom]        = useState(DEFAULT_ZOOM);
  const [visible,     setVisible]     = useState(true);
  const [barHovered,  setBarHovered]  = useState(false);
  const [scrolling,   setScrolling]   = useState(false);
  const [speed,       setSpeed]       = useState(1.5);
  const [activeId,    setActiveId]    = useState('');
  const [tocOpen,     setTocOpen]     = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume,      setVolume]      = useState(0.4);
  const [showLibrary, setShowLibrary] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Hydrate state from localStorage after mount
  useEffect(() => {
    setActive(localStorage.getItem('ks-focus-mode') === 'true');
    const saved = localStorage.getItem('ks-reader-settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.zoom)        setZoom(data.zoom);
        if (data.speed)       setSpeed(data.speed);
        if (data.activeSound) setActiveSound(data.activeSound);
        if (data.volume)      setVolume(data.volume);
      } catch (e) { /* ignore */ }
    }
  }, []);

  const hideTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocCloseTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef          = useRef<HTMLDivElement>(null);
  const rafRef          = useRef<number | null>(null);
  const accumRef        = useRef(0);
  const expectedPosRef  = useRef(0);
  const audioRef        = useRef<HTMLAudioElement | null>(null);

  // ── Sync Focus Mode State & Styles ───────────────────────
  // Use useLayoutEffect to prevent layout shift before paint
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
  
  useIsomorphicLayoutEffect(() => {
    if (active) {
      document.documentElement.classList.add('focus-mode');
      document.documentElement.style.setProperty('--focus-zoom', `${zoom}`);
      setVisible(true);
    }
  }, [active, zoom]);

  // Initial load effect (already partially handled by sync state init, but ensures CSS vars)
  useEffect(() => {
    if (active) {
       document.documentElement.style.setProperty('--focus-zoom', `${zoom}`);
    } else {
       document.documentElement.style.setProperty('--focus-zoom', `${DEFAULT_ZOOM}`);
    }
  }, []); // Only on mount

  // Save changes
  useEffect(() => {
    const settings = { zoom, speed, activeSound, volume };
    localStorage.setItem('ks-reader-settings', JSON.stringify(settings));
    if (active) {
       document.documentElement.style.setProperty('--focus-zoom', `${zoom}`);
    }
  }, [zoom, speed, activeSound, volume, active]);

  // ── Toggle focus mode ──────────────────────────────────────
  const enter = useCallback(() => {
    document.documentElement.classList.add('focus-mode');
    document.documentElement.style.setProperty('--focus-zoom', `${zoom}`);
    localStorage.setItem('ks-focus-mode', 'true');
    setActive(true);
    setVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [zoom]);

  const exit = useCallback(() => {
    document.documentElement.classList.remove('focus-mode');
    document.documentElement.style.removeProperty('--focus-zoom');
    localStorage.setItem('ks-focus-mode', 'false');
    setActive(false);
    setScrolling(false);
    setTocOpen(false);
  }, []);

  // Handle external toggle from Mobile Hub
  useEffect(() => {
    const handleToggle = () => {
      if (active) exit(); else enter();
    };
    window.addEventListener('toggle-focus-mode', handleToggle);
    return () => window.removeEventListener('toggle-focus-mode', handleToggle);
  }, [active, enter, exit]);

  // Emit event when active changes for external sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('focus-mode-changed', { detail: { active } }));
  }, [active]);

  // ── Session Timer ──────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (active) {
      interval = setInterval(() => {
        setSessionTime(s => s + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [active]);

  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      if (e.key === 'f' || e.key === 'F') toggle();
      if (e.key === 'Escape' && active) exit();
      if ((e.key === ' ' || e.key === 'Spacebar') && active) {
        e.preventDefault();
        setScrolling(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle, exit, active]);



  // ── Scroll progress + active heading tracking ─────────────
  useEffect(() => {
    if (!active) return;
    const onScroll = () => {
      const el    = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const curr  = el.scrollTop;
      setProgress(total > 0 ? Math.round((curr / total) * 100) : 0);

      let current = '';
      for (const { id } of headings) {
        const hEl = document.getElementById(id);
        if (hEl) {
          const top = hEl.getBoundingClientRect().top;
          if (top <= 110) current = id; // Threshold slightly above scroll-margin-top
        }
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [active, headings]);

  // ── Auto-scroll rAF loop ───────────────────────────────────
  useEffect(() => {
    if (!scrolling) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const el = document.documentElement;
    expectedPosRef.current = el.scrollTop;
    accumRef.current = 0;

    const step = () => {
      const total   = el.scrollHeight - el.clientHeight;
      const current = el.scrollTop;

      if (Math.abs(current - expectedPosRef.current) > 8) {
        expectedPosRef.current = current;
        accumRef.current = 0;
      }

      accumRef.current += speedToPx(speed);
      if (accumRef.current >= 1) {
        const px = Math.floor(accumRef.current);
        accumRef.current -= px;
        expectedPosRef.current = Math.min(expectedPosRef.current + px, total);
        el.scrollTop = expectedPosRef.current;
      }

      if (expectedPosRef.current >= total) {
        setScrolling(false);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scrolling, speed]);

  // Stop auto-scroll when exiting focus mode
  useEffect(() => {
    if (!active && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [active]);

  // ── Bar auto-hide (legacy - now handled by trigger) ────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const onClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    window.addEventListener('click', onClickOutside);
    // Show bar always in focus mode
    setVisible(true);
    
    return () => {
      window.removeEventListener('click', onClickOutside);
    };
  }, [active]);

  // ── Ambient Audio Logic ────────────────────────────────────
  useEffect(() => {
    if (!active || !activeSound) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const sound = AMBIENT_SOUNDS.find(s => s.id === activeSound);
    if (!sound) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
    } else {
      audioRef.current.src = sound.url;
    }
    
    audioRef.current.volume = volume;
    audioRef.current.play().catch(e => console.log('Audio playback failed:', e));

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [active, activeSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // ── Zoom logic ──────────────────────────────────────────────
  const changeZoom = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(clamped);
    document.documentElement.style.setProperty('--focus-zoom', `${clamped}`);
  };

  const minutesLeft = Math.max(1, Math.ceil(readTime * (1 - progress / 100)));

  // ── Entry: handled by FloatingTOC panel ───────────────────
  if (!active) return null;

  // ── Focus mode UI ──────────────────────────────────────────

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
  };

  const scheduleTocClose = () => {
    tocCloseTimer.current = setTimeout(() => setTocOpen(false), 300);
  };
  const cancelTocClose = () => {
    if (tocCloseTimer.current) clearTimeout(tocCloseTimer.current);
  };

  // ── Focus mode UI ──────────────────────────────────────────
  return (
    <>
      {/* Reading progress bar — top */}
      <div className="focus-progress-bar" style={{ width: `${progress}%` }} />

      {/* Nullify legacy TOC trigger, keeping Focus Mode entirely blank on the left edge */}

      {/* Bottom floating bar - with Desktop hover trigger */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9998] h-24 flex items-end justify-center pb-6 lg:pointer-events-auto pointer-events-none"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => !barHovered && setVisible(false)}
      >
        <div
          ref={barRef}
          className={`focus-bar pointer-events-auto ${visible || barHovered ? 'focus-bar-visible' : 'focus-bar-hidden'}`}
          onMouseEnter={() => setBarHovered(true)}
          onMouseLeave={() => setBarHovered(false)}
        >
        {/* Zoom slider */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3 h-3 text-zinc-500" />
          <input
            type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.1} value={zoom}
            onChange={e => changeZoom(Number(e.target.value))}
            className="focus-bar-slider" title={`Độ phóng: ${Math.round(zoom * 100)}%`}
          />
          <ZoomIn className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] text-zinc-500 tabular-nums w-10">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="focus-bar-divider" />

        {/* Notes Toggle */}
        {onToggleNotes && (
          <>
            <button
              onClick={onToggleNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all group"
              title="Ghi chú cá nhân"
            >
              <FileEdit className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="text-[11px] font-bold hidden sm:inline">Ghi chú</span>
            </button>
            <div className="focus-bar-divider" />
          </>
        )}

        {/* Ambient Sounds Library */}
        <div className="relative group/library">
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            onMouseEnter={() => setShowLibrary(true)}
            className={`p-2 rounded-xl transition-all ${
              activeSound 
                ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' 
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Thư viện âm thanh"
          >
            <Volume2 className={`w-4 h-4 ${activeSound ? 'animate-pulse' : ''}`} />
          </button>

          {showLibrary && (
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-52 bg-zinc-800/95 backdrop-blur-3xl max-md:backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-2.5 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200"
              onMouseLeave={() => setShowLibrary(false)}
            >
              <div className="px-2 py-1.5 mb-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-80">Library</span>
                {activeSound && (
                   <button 
                     onClick={() => setActiveSound(null)}
                     className="text-[9px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                   >
                     Mute
                   </button>
                )}
              </div>
              <div className="space-y-1">
                {AMBIENT_SOUNDS.map(s => {
                  const Icon = s.icon;
                  const isActive = activeSound === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSound(isActive ? null : s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02] active:scale-95' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-bold truncate">{s.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider in Library */}
              {activeSound && (
                <div className="mt-4 px-2 pt-4 border-t border-white/5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                   <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                   <input
                     type="range" min="0" max="1" step="0.01" value={volume}
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="focus-bar-slider flex-1 !h-1"
                   />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="focus-bar-divider" />

        {/* Auto-scroll controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScrolling(v => !v)}
            className={`focus-bar-btn ${scrolling ? 'focus-bar-btn-active' : ''}`}
            title={scrolling ? 'Dừng cuộn (Space)' : 'Tự động cuộn (Space)'}
          >
            {scrolling
              ? <Pause className="w-3.5 h-3.5" />
              : <Play  className="w-3.5 h-3.5" />}
            <span className="text-xs font-bold hidden sm:inline">
              {scrolling ? 'Dừng' : 'Tự cuộn'}
            </span>
          </button>

          {/* Speed slider */}
          <div className="flex items-center gap-1.5" title="Tốc độ cuộn">
            <Gauge className="w-3 h-3 text-zinc-400 shrink-0" />
            <input
              type="range" min={1} max={5} step={0.5} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="focus-bar-slider w-16"
            />
            <span className="text-[10px] text-zinc-400 tabular-nums w-6">{speed}x</span>
          </div>
        </div>

        <div className="focus-bar-divider" />

        {/* Progress */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="focus-bar-progress-track">
            <div className="focus-bar-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-white tabular-nums">{progress}%</span>
        </div>
        <div className="focus-bar-divider" />

        {/* Stopwatch & Time Left */}
        <div className="flex items-baseline gap-2.5 min-w-fit px-1">
          <div className="flex flex-col items-start translate-y-[-1px]">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none mb-1.5 opacity-90">Session</span>
            <span className="text-sm font-black text-white tabular-nums leading-none tracking-tight">
              {formatSessionTime(sessionTime)}
            </span>
          </div>
          
          <div className="w-[1px] h-6 bg-white/10 self-center mx-1" />

          <div className="flex flex-col items-start opacity-70 translate-y-[-1px]">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5 opacity-90">Remain</span>
            <span className="text-xs font-bold text-zinc-200 whitespace-nowrap leading-none">
              ~{minutesLeft} min
            </span>
          </div>
        </div>

        <div className="focus-bar-divider" />

        {/* Exit */}
        <button onClick={exit} className="focus-bar-btn focus-bar-exit" title="Thoát (Esc)">
          <Minimize2 className="w-3.5 h-3.5" />
          <span className="text-xs font-bold hidden sm:inline">Thoát</span>
          <kbd className="hidden sm:inline opacity-50 text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Esc</kbd>
        </button>
      </div>
    </div>
  </>
);
}
