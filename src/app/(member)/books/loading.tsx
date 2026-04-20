import MemberContainer from '@/components/layout/MemberContainer';

export default function BooksLoading() {
  return (
    <MemberContainer>
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="mb-10 space-y-3">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-white/10 rounded-xl" />
          <div className="h-5 w-96 max-w-full bg-zinc-100 dark:bg-white/5 rounded" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-zinc-200 dark:bg-white/10 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-200 dark:bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-zinc-100 dark:bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberContainer>
  );
}
