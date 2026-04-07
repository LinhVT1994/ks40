export default function ArticleLoading() {
  return (
    <div className="flex flex-col xl:grid xl:grid-cols-12 gap-10 animate-pulse">
      <main className="flex-1 xl:col-span-9 space-y-6">
        {/* Hero skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded-full" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-6 w-1/2 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-64 w-full bg-slate-200 dark:bg-white/10 rounded-3xl" />
        </div>
        {/* Content skeleton */}
        <div className="space-y-3 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 dark:bg-white/5 rounded-lg" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </main>
      <aside className="hidden xl:block xl:col-span-3">
        <div className="space-y-4">
          <div className="h-6 w-1/2 bg-slate-200 dark:bg-white/10 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
      </aside>
    </div>
  );
}
