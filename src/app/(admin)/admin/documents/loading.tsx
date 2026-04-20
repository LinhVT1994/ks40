export default function DocumentsLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-10 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-white/10 rounded-lg" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-white/5 rounded" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 dark:bg-white/10 rounded-xl" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
            <div className="h-3 w-20 bg-zinc-100 dark:bg-white/5 rounded mb-3" />
            <div className="h-8 w-16 bg-zinc-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/[0.02] overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-white/5 p-4 flex gap-3">
          <div className="h-9 flex-1 max-w-sm bg-zinc-100 dark:bg-white/5 rounded-xl" />
          <div className="h-9 w-32 bg-zinc-100 dark:bg-white/5 rounded-xl" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-zinc-50 dark:border-white/5">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/3 bg-zinc-100 dark:bg-white/5 rounded" />
            </div>
            <div className="h-6 w-16 bg-zinc-100 dark:bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
