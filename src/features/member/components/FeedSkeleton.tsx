export default function FeedSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {/* Topic chips skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-zinc-100 dark:bg-white/5 shrink-0"
            style={{ width: `${60 + i * 15}px` }}
          />
        ))}
      </div>

      {/* Feed toggle skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-28 rounded-xl bg-zinc-100 dark:bg-white/5" />
        <div className="h-9 w-28 rounded-xl bg-zinc-100 dark:bg-white/5" />
      </div>

      {/* Article items skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div className="flex gap-4 py-4">
            {/* Thumbnail */}
            <div className="w-24 sm:w-36 h-20 sm:h-28 rounded-xl bg-zinc-100 dark:bg-white/5 shrink-0" />
            {/* Content */}
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-5 bg-zinc-100 dark:bg-white/5 rounded-lg w-3/4" />
              <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded-lg w-full" />
              <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded-lg w-2/3" />
              <div className="mt-auto flex gap-3">
                <div className="h-3 w-12 bg-zinc-100 dark:bg-white/5 rounded" />
                <div className="h-3 w-12 bg-zinc-100 dark:bg-white/5 rounded" />
                <div className="h-3 w-16 bg-zinc-100 dark:bg-white/5 rounded" />
              </div>
            </div>
          </div>
          {i < 4 && <div className="h-px bg-zinc-100 dark:bg-white/5 w-full" />}
        </div>
      ))}
    </div>
  );
}
