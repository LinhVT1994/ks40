'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessScreen({ userName }: { userName?: string }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/');
    }, 8000); // 8-second fallback for auto-redirection
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="relative flex flex-col items-center justify-center text-center py-6 px-4 overflow-hidden min-h-[400px] w-full max-w-lg mx-auto animate-in fade-in duration-1000">
      <style>{`
        @keyframes draw-check {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes aurora-pulse {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
          33% { transform: scale(1.1) translate(10px, -10px); opacity: 0.5; }
          66% { transform: scale(0.9) translate(-10px, 10px); opacity: 0.4; }
        }
        @keyframes soft-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scale-in-center {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .aurora-bg {
          animation: aurora-pulse 8s ease-in-out infinite;
        }
        .check-path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: draw-check 0.8s 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .success-icon-container {
          animation: scale-in-center 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .floating-content {
          animation: soft-float 4s ease-in-out infinite;
        }
        .stagger-1 { animation: fade-in 1s 0.8s both, slide-in-from-bottom 0.8s 0.8s both; }
        .stagger-2 { animation: fade-in 1s 1.0s both, slide-in-from-bottom 0.8s 1.0s both; }
        .stagger-3 { animation: fade-in 1s 1.4s both, slide-in-from-bottom 0.8s 1.4s both; }
      `}</style>

      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="aurora-bg absolute top-1/4 left-1/4 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
        <div className="aurora-bg absolute bottom-1/4 right-1/4 w-56 h-56 bg-accent-purple/15 rounded-full blur-[100px]" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Main Success Icon */}
      <div className="success-icon-container relative flex items-center justify-center mb-8">
        {/* Glow behind icon */}
        <div className="absolute w-32 h-32 rounded-full bg-primary/20 blur-2xl animate-pulse" />
        
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary to-accent-purple flex items-center justify-center shadow-xl dark:shadow-none ring-4 ring-background/10 dark:ring-white/5">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path className="check-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Content Area */}
      <div className="floating-content space-y-4">
        <div className="space-y-2">
          <h1 className="stagger-1 text-2xl sm:text-3xl font-display font-heavy text-zinc-800 dark:text-white tracking-tight leading-tight">
            Sẵn sàng trải nghiệm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-purple italic">Lenote</span>!
          </h1>
          <p className="stagger-2 text-zinc-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-[320px] mx-auto font-medium">
            Tất cả đã sẵn sàng{userName ? `, ${userName.split(' ').at(-1)}` : ''}.<br />
            Hệ thống đã được lọc theo sở thích của bạn.
          </p>
        </div>

        {/* Action Button */}
        <div className="stagger-3 pt-4">
          <button
            onClick={() => router.push('/')}
            className="group relative px-8 py-3.5 bg-zinc-800 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-base hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-zinc-800/20 dark:shadow-white/10"
          >
            <span className="relative z-10 flex items-center gap-2">
              Bắt đầu khám phá
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent-purple opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đã đồng bộ hóa sở thích
          </div>
        </div>
      </div>
    </div>
  );
}
