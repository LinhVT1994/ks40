import MemberContainer from '@/components/layout/MemberContainer';

export default function ArticleLoading() {
  return (
    <MemberContainer>
      {/* Skeleton layout matching article/page.tsx */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-10 items-start animate-pulse">
        
        {/* Main Content Area (9 columns) */}
        <main className="flex-1 xl:col-span-9 w-full">
          {/* Back Button placeholder */}
          <div className="mb-6 h-10 w-24 bg-zinc-200 dark:bg-white/10 rounded-xl" />

          {/* Article Hero Skeleton */}
          <div className="space-y-6 mb-12">
            {/* Topic label */}
            <div className="h-5 w-20 bg-zinc-200 dark:bg-white/10 rounded-full" />
            
            {/* Title */}
            <div className="space-y-3">
              <div className="h-10 w-full bg-zinc-200 dark:bg-white/10 rounded-xl" />
              <div className="h-10 w-2/3 bg-zinc-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Metadata (Author, Date, Views) */}
            <div className="flex items-center gap-4 py-4 border-y border-zinc-100 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-white/10 rounded-lg" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-white/5 rounded-lg" />
              </div>
            </div>

            {/* Cover Image placeholder */}
            <div className="aspect-[21/9] w-full bg-zinc-200 dark:bg-white/10 rounded-[2rem] shadow-sm" />
          </div>

          {/* Article Content Skeleton */}
          <div className="space-y-10">
            {/* Overview Box */}
            <div className="p-8 rounded-[2rem] bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-4">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-white/10 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-200 dark:bg-white/10 rounded-lg" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-white/10 rounded-lg" />
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-white/10 rounded-lg" />
              </div>
            </div>

            {/* Body Text lines */}
            <div className="space-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-4 bg-zinc-100 dark:bg-white/5 rounded-lg ${
                    i % 5 === 4 ? 'mb-8' : '' // Add spacing for "paragraphs"
                  }`} 
                  style={{ 
                    width: i % 5 === 4 ? '40%' : `${90 + (i % 4) * 2}%`,
                    opacity: 1 - (i * 0.05) // Fade out effect as we go down
                  }} 
                />
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar (3 columns) */}
        <aside className="hidden xl:block xl:col-span-3 w-full sticky top-[100px] space-y-10 pl-4 border-l border-zinc-200 dark:border-white/5">
          {/* Sidebar Section 1: Author */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-white/10 rounded-lg" />
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-white/10 rounded-lg" />
                  <div className="h-3 w-16 bg-zinc-100 dark:bg-white/5 rounded-lg" />
                </div>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-lg" />
              <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-lg" />
            </div>
          </div>

          {/* Sidebar Section 2: Related Items */}
          <div className="space-y-4">
            <div className="h-6 w-40 bg-zinc-200 dark:bg-white/10 rounded-lg" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-full bg-zinc-200 dark:bg-white/10 rounded-lg" />
                  <div className="h-3.5 w-2/3 bg-zinc-200 dark:bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </MemberContainer>
  );
}
