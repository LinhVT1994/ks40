'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6 overflow-hidden relative">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/5 dark:bg-orange-500/8 blur-3xl" />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Flame flicker */
        @keyframes flame1 {
          0%, 100% { transform: scaleY(1)   scaleX(1)    translateY(0);   }
          25%       { transform: scaleY(1.1) scaleX(0.92) translateY(-2px); }
          50%       { transform: scaleY(0.9) scaleX(1.05) translateY(1px);  }
          75%       { transform: scaleY(1.05) scaleX(0.96) translateY(-1px); }
        }
        @keyframes flame2 {
          0%, 100% { transform: scaleY(1)   scaleX(1)    translateY(0);   }
          30%       { transform: scaleY(1.2) scaleX(0.9)  translateY(-3px); }
          60%       { transform: scaleY(0.85) scaleX(1.1) translateY(2px);  }
        }
        @keyframes flame3 {
          0%, 100% { transform: scaleY(1)   scaleX(1)   translateY(0);   }
          40%       { transform: scaleY(1.15) scaleX(0.88) translateY(-2px); }
          70%       { transform: scaleY(0.92) scaleX(1.08) translateY(1px); }
        }

        /* Smoke puff rising */
        @keyframes smoke {
          0%   { transform: translateY(0)   scale(0.4); opacity: 0.7; }
          100% { transform: translateY(-40px) scale(1.4); opacity: 0; }
        }

        /* Server shake */
        @keyframes server-shake {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          20%       { transform: rotate(-1.5deg) translateX(-2px); }
          40%       { transform: rotate(1.5deg)  translateX(2px); }
          60%       { transform: rotate(-1deg)   translateX(-1px); }
          80%       { transform: rotate(1deg)    translateX(1px); }
        }

        /* Eyes blinking panic */
        @keyframes eye-panic {
          0%, 85%, 100% { transform: scaleY(1); }
          90%            { transform: scaleY(0.1); }
        }

        /* 500 bounce in */
        @keyframes bounce-in {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.1); opacity: 1; }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }

        /* Digit wobble */
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-6deg); }
          40%       { transform: rotate(5deg); }
          60%       { transform: rotate(-3deg); }
          80%       { transform: rotate(2deg); }
        }

        /* LED blink */
        @keyframes led-blink {
          0%, 49% { fill: #ef4444; }
          50%, 100% { fill: #fca5a5; opacity: 0.4; }
        }
      `}</style>

      <div className="relative text-center max-w-md" style={{ animation: 'fadeUp 0.5s ease both' }}>

        {/* Server on fire */}
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ animation: 'server-shake 0.4s 1s ease-in-out 4' }}>

            {/* Smoke puffs */}
            {[
              { left: '30%', delay: '0s',   dur: '1.8s' },
              { left: '50%', delay: '0.6s', dur: '2s'   },
              { left: '68%', delay: '1.1s', dur: '1.6s' },
            ].map((s, i) => (
              <div key={i} className="absolute -top-4 w-5 h-5 rounded-full bg-zinc-300 dark:bg-slate-600"
                style={{ left: s.left, animation: `smoke ${s.dur} ${s.delay} ease-out infinite`, transformOrigin: 'center bottom' }} />
            ))}

            <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">

              {/* Server rack body */}
              <rect x="20" y="30" width="120" height="88" rx="8" className="fill-zinc-200 dark:fill-slate-700" />
              <rect x="20" y="30" width="120" height="88" rx="8" className="stroke-zinc-300 dark:stroke-slate-600" strokeWidth="1.5" />

              {/* Server unit 1 */}
              <rect x="28" y="38" width="104" height="22" rx="4" className="fill-white dark:fill-slate-600" />
              <rect x="28" y="38" width="104" height="22" rx="4" className="stroke-zinc-200 dark:stroke-slate-500" strokeWidth="1" />
              {/* LEDs row 1 */}
              <circle cx="116" cy="46" r="3" style={{ animation: 'led-blink 0.5s 0s steps(1) infinite' }} />
              <circle cx="125" cy="46" r="3" style={{ animation: 'led-blink 0.5s 0.15s steps(1) infinite' }} />
              <circle cx="116" cy="54" r="3" className="fill-zinc-300 dark:fill-slate-500" />
              <circle cx="125" cy="54" r="3" style={{ animation: 'led-blink 0.5s 0.3s steps(1) infinite' }} />
              {/* Drive slots */}
              <rect x="36" y="43" width="60" height="4" rx="2" className="fill-zinc-100 dark:fill-slate-700" />
              <rect x="36" y="51" width="48" height="4" rx="2" className="fill-zinc-100 dark:fill-slate-700" />

              {/* Server unit 2 — face */}
              <rect x="28" y="66" width="104" height="30" rx="4" className="fill-white dark:fill-slate-600" />
              <rect x="28" y="66" width="104" height="30" rx="4" className="stroke-zinc-200 dark:stroke-slate-500" strokeWidth="1" />
              {/* Panic eyes */}
              <g style={{ animation: 'eye-panic 2s 0.5s ease-in-out infinite', transformOrigin: '65px 81px' }}>
                <circle cx="58" cy="81" r="5" className="fill-zinc-800 dark:fill-white" />
                <circle cx="60" cy="79" r="1.5" className="fill-white dark:fill-slate-900" />
              </g>
              <g style={{ animation: 'eye-panic 2s 0.7s ease-in-out infinite', transformOrigin: '80px 81px' }}>
                <circle cx="80" cy="81" r="5" className="fill-zinc-800 dark:fill-white" />
                <circle cx="82" cy="79" r="1.5" className="fill-white dark:fill-slate-900" />
              </g>
              {/* Shocked mouth */}
              <ellipse cx="69" cy="90" rx="5" ry="3.5" className="fill-zinc-800 dark:fill-white" />
              {/* Sweat drop */}
              <path d="M96 72 Q98 68 100 72 Q100 76 98 76 Q96 76 96 72Z" className="fill-blue-400 dark:fill-blue-300" opacity="0.8" />
              {/* LEDs row 2 */}
              <circle cx="116" cy="74" r="3" style={{ animation: 'led-blink 0.5s 0.1s steps(1) infinite' }} />
              <circle cx="125" cy="74" r="3" style={{ animation: 'led-blink 0.5s 0.4s steps(1) infinite' }} />

              {/* Server unit 3 */}
              <rect x="28" y="102" width="104" height="10" rx="4" className="fill-white dark:fill-slate-600" />
              <rect x="28" y="102" width="104" height="10" rx="4" className="stroke-zinc-200 dark:stroke-slate-500" strokeWidth="1" />
              <rect x="36" y="105" width="70" height="3" rx="1.5" className="fill-zinc-200 dark:fill-slate-500" />
              <circle cx="120" cy="107" r="2.5" style={{ animation: 'led-blink 0.3s 0.2s steps(1) infinite' }} />

              {/* Flames on top */}
              <g style={{ animation: 'flame1 0.3s ease-in-out infinite', transformOrigin: '55px 32px' }}>
                <path d="M45 32 Q50 18 55 26 Q58 14 62 22 Q65 10 68 20 Q72 8 75 18 Q78 26 70 32Z" className="fill-orange-400" opacity="0.95" />
              </g>
              <g style={{ animation: 'flame2 0.35s 0.1s ease-in-out infinite', transformOrigin: '55px 32px' }}>
                <path d="M48 32 Q53 22 57 28 Q60 18 64 24 Q67 14 70 22 Q66 30 55 32Z" className="fill-yellow-400" opacity="0.85" />
              </g>
              <g style={{ animation: 'flame3 0.28s 0.05s ease-in-out infinite', transformOrigin: '60px 32px' }}>
                <path d="M52 32 Q56 24 59 28 Q62 20 65 26 Q62 31 52 32Z" className="fill-white" opacity="0.6" />
              </g>

              {/* Small flame right */}
              <g style={{ animation: 'flame2 0.32s 0.2s ease-in-out infinite', transformOrigin: '110px 32px' }}>
                <path d="M104 32 Q108 22 112 28 Q115 18 118 24 Q114 32 104 32Z" className="fill-orange-400" opacity="0.9" />
              </g>
              <g style={{ animation: 'flame3 0.28s 0.15s ease-in-out infinite', transformOrigin: '110px 32px' }}>
                <path d="M107 32 Q110 24 113 28 Q110 32 107 32Z" className="fill-yellow-300" opacity="0.7" />
              </g>

            </svg>
          </div>
        </div>

        {/* 500 bounce in with wobble on each digit */}
        <div className="flex items-end justify-center gap-1 leading-none select-none tabular-nums">
          {['5', '0', '0'].map((d, i) => (
            <span
              key={i}
              className="text-8xl font-bold bg-gradient-to-br from-rose-500 to-rose-300 bg-clip-text text-transparent inline-block"
              style={{
                animation: `bounce-in 0.5s ${0.1 + i * 0.08}s cubic-bezier(0.175,0.885,0.32,1.275) both, wobble 3s ${2 + i * 0.2}s ease-in-out infinite`,
              }}
            >
              {d}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <h1 className="text-xl font-bold text-zinc-800 dark:text-white">
            Đã có lỗi xảy ra
          </h1>
          <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed">
            Có gì đó không ổn ở phía chúng tôi. Vui lòng thử lại sau.
          </p>
          {error.digest && (
            <p className="text-[11px] text-zinc-500 dark:text-slate-600 font-mono bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded-lg inline-block">
              {error.digest}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/20"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="px-6 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-bold text-zinc-600 dark:text-slate-300 hover:border-rose-500/50 hover:text-rose-500 transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
