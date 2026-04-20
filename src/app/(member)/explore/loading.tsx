import MemberContainer from '@/components/layout/MemberContainer';

export default function ExploreLoading() {
  return (
    <MemberContainer>
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="mb-10 space-y-3">
          <div className="h-10 w-48 bg-zinc-200 dark:bg-white/10 rounded-xl" />
          <div className="h-5 w-80 max-w-full bg-zinc-100 dark:bg-white/5 rounded" />
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-zinc-100 dark:bg-white/5 rounded-full" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/[0.02] space-y-4">
              <div className="aspect-[16/10] bg-zinc-200 dark:bg-white/10 rounded-xl" />
              <div className="space-y-2">
                <div className="h-5 w-full bg-zinc-200 dark:bg-white/10 rounded" />
                <div className="h-5 w-4/5 bg-zinc-200 dark:bg-white/10 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded" />
                <div className="h-3 w-5/6 bg-zinc-100 dark:bg-white/5 rounded" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5" />
                <div className="h-3 w-24 bg-zinc-100 dark:bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberContainer>
  );
}
