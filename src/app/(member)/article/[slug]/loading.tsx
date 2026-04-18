import MemberContainer from '@/components/layout/MemberContainer';

export default function ArticleLoading() {
  return (
    <MemberContainer>
      <div className="relative xl:flex xl:flex-row xl:flex-nowrap xl:items-start xl:justify-center xl:gap-10 2xl:gap-16 max-w-[1240px] mx-auto animate-pulse">
        {/* Left TOC sidebar (desktop only) */}
        <aside className="hidden xl:block xl:w-60 2xl:w-64 shrink-0 sticky top-40 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-white/10" />
            <div className="h-3 w-20 bg-zinc-200 dark:bg-white/10 rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-zinc-100 dark:bg-white/5 rounded-lg"
                style={{ width: `${65 + (i % 4) * 8}%` }}
              />
            ))}
          </div>
        </aside>

        {/* Main column — matches max-w-[820px] of real article page */}
        <main className="w-full max-w-[820px] mx-auto min-w-0">
          {/* Back button placeholder */}
          <div className="mb-8 h-9 w-24 bg-zinc-100 dark:bg-white/5 rounded-xl" />

          {/* Article Hero */}
          <div className="space-y-6 mb-12">
            {/* Topic pill */}
            <div className="h-6 w-24 bg-zinc-200 dark:bg-white/10 rounded-full" />

            {/* Title — 2-3 lines */}
            <div className="space-y-3">
              <div className="h-10 lg:h-12 w-full bg-zinc-200 dark:bg-white/10 rounded-xl" />
              <div className="h-10 lg:h-12 w-3/4 bg-zinc-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Summary */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-lg" />
              <div className="h-4 w-5/6 bg-zinc-100 dark:bg-white/5 rounded-lg" />
            </div>

            {/* Author + meta row */}
            <div className="flex items-center gap-4 py-5 border-y border-zinc-100 dark:border-white/5">
              <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-white/10 rounded-lg" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-white/5 rounded-lg" />
              </div>
              <div className="hidden sm:flex gap-2">
                <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/5" />
                <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/5" />
              </div>
            </div>

            {/* Cover image */}
            <div className="aspect-[16/9] w-full bg-zinc-200 dark:bg-white/10 rounded-[2rem]" />
          </div>

          {/* Overview / Objectives box */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-3 mb-10 max-w-[720px] mx-auto">
            <div className="h-5 w-32 bg-zinc-200 dark:bg-white/10 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-lg" />
              <div className="h-4 w-11/12 bg-zinc-100 dark:bg-white/5 rounded-lg" />
              <div className="h-4 w-3/4 bg-zinc-100 dark:bg-white/5 rounded-lg" />
            </div>
          </div>

          {/* Body — paragraph blocks centered at prose width */}
          <div className="max-w-[720px] mx-auto space-y-10">
            {Array.from({ length: 4 }).map((_, blockIdx) => (
              <div key={blockIdx} className="space-y-3">
                {blockIdx > 0 && (
                  <div className="h-7 w-1/2 bg-zinc-200 dark:bg-white/10 rounded-lg mb-4" />
                )}
                {Array.from({ length: 4 + (blockIdx % 2) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-zinc-100 dark:bg-white/5 rounded"
                    style={{ width: i === 3 + (blockIdx % 2) ? `${40 + (blockIdx * 5) % 30}%` : '100%' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </MemberContainer>
  );
}
