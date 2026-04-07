import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 overflow-hidden relative">

      {/* Background glow effects matching MemberLayout */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent-purple/20 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.7;  transform: scale(1.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%       { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(54px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative text-center max-w-md" style={{ animation: 'fadeUp 0.6s ease both' }}>

        {/* Astronaut illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48">

            {/* Orbit ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-200 dark:border-white/10" />

            {/* Orbiting planet */}
            <div
              className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2"
              style={{ animation: 'orbit 8s linear infinite', transformOrigin: '0 0' }}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-blue-400 shadow-lg shadow-primary/30" />
            </div>

            {/* Astronaut SVG floating */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'float 5s ease-in-out infinite' }}>
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Helmet */}
                <circle cx="45" cy="32" r="22" className="fill-slate-200 dark:fill-slate-600" />
                <circle cx="45" cy="32" r="22" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth="2" />
                {/* Visor */}
                <ellipse cx="45" cy="33" rx="13" ry="11" className="fill-primary/30 dark:fill-primary/40" />
                <ellipse cx="41" cy="29" rx="3" ry="2" className="fill-white/40" />
                {/* Body */}
                <rect x="30" y="52" width="30" height="24" rx="8" className="fill-slate-300 dark:fill-slate-500" />
                {/* Arms */}
                <rect x="14" y="54" width="18" height="10" rx="5" className="fill-slate-300 dark:fill-slate-500" />
                <rect x="58" y="54" width="18" height="10" rx="5" className="fill-slate-300 dark:fill-slate-500" />
                {/* Legs */}
                <rect x="32" y="73" width="10" height="14" rx="5" className="fill-slate-300 dark:fill-slate-500" />
                <rect x="48" y="73" width="10" height="14" rx="5" className="fill-slate-300 dark:fill-slate-500" />
                {/* Chest detail */}
                <rect x="38" y="58" width="14" height="10" rx="3" className="fill-slate-400/40 dark:fill-white/10" />
                {/* Antenna */}
                <line x1="45" y1="10" x2="45" y2="18" className="stroke-slate-400 dark:stroke-slate-400" strokeWidth="2" strokeLinecap="round" />
                <circle cx="45" cy="8" r="3" className="fill-primary" />
              </svg>
            </div>

          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-bold leading-none bg-gradient-to-br from-primary via-[#3B82F6] to-[#EC4899] bg-clip-text text-transparent select-none tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          404
        </p>

        <div className="mt-4 space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Trang <span className="text-primary italic">không tồn tại</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Có vẻ phi hành gia này đã lạc mất trang bạn cần rồi.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Khám phá bài viết
          </Link>
        </div>
      </div>
    </div>
  );
}
