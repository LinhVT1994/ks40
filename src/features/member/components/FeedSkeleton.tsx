export default function FeedSkeleton() {
  return (
    <div className="space-y-0 overflow-hidden">
      {/* Topic chips skeleton */}
      <div className="flex gap-2 mb-10 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-xl bg-zinc-100 dark:bg-white/5 shrink-0 relative overflow-hidden"
            style={{ width: `${80 + (i % 3) * 20}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>

      {/* Feed header skeleton */}
      <div className="flex items-center justify-between mb-10 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex gap-8">
          <div className="h-4 w-16 bg-zinc-100 dark:bg-white/5 rounded relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_26_infinite]" />
          </div>
          <div className="h-4 w-16 bg-zinc-100 dark:bg-white/5 rounded relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Article items skeleton */}
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-4">
            <div className="flex flex-row gap-4 sm:gap-6 items-start w-full">
              {/* Thumbnail */}
              <div className="w-24 sm:w-36 2xl:w-48 h-20 sm:h-28 2xl:h-32 rounded-xl bg-zinc-100 dark:bg-white/5 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
              {/* Content */}
              <div className="flex-1 flex flex-col gap-3 pt-1">
                <div className="h-6 bg-zinc-100 dark:bg-white/5 rounded-lg w-[85%] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded-lg w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                  <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded-lg w-2/3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-white/5 rounded relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                    <div className="h-3 w-12 bg-zinc-100 dark:bg-white/5 rounded relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                  <div className="h-4 w-4 bg-zinc-100 dark:bg-white/5 rounded relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
            {i < 5 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
