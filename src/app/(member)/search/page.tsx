import type { Metadata } from 'next';
import { getArticlesAction } from '@/features/articles/actions/article';
import SearchResults from '@/features/member/components/SearchResults';
import BackButton from '@/features/member/components/BackButton';
import { Search } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo';

import MemberContainer from '@/components/layout/MemberContainer';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }): Promise<Metadata> {
  const { q, tag } = await searchParams;
  const query = q?.trim() || tag?.trim() || '';
  
  return {
    title: query ? `Kết quả cho "${query}" | ${SITE_NAME}` : `Tìm kiếm | ${SITE_NAME}`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const { q, tag } = await searchParams;
  const query = q?.trim() ?? '';
  const tagSlug = tag?.trim() ?? '';

  const { articles, total } = (query || tagSlug)
    ? await getArticlesAction({ search: query, tag: tagSlug, limit: 20 })
    : { articles: [], total: 0 };

  return (
    <MemberContainer className="max-w-3xl">
      <div className="mb-8 space-y-6">
        <form action="/search" className="relative group">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Tìm kiếm bài viết khác..."
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-zinc-800 dark:text-white"
          />
        </form>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-zinc-800 dark:text-white font-display flex-1">
              {tagSlug && query ? (
                <>Tìm kiếm <span className="text-primary">"{query}"</span> trong thẻ <span className="text-primary">#{tagSlug}</span></>
              ) : tagSlug ? (
                <>Bài viết với thẻ <span className="text-primary">#{tagSlug}</span></>
              ) : query ? (
                <>Kết quả tìm kiếm cho <span className="text-primary">"{query}"</span></>
              ) : (
                'Tìm kiếm'
              )}
            </h1>
            <BackButton />
          </div>
          {(query || tagSlug) && (
            <p className="text-sm text-zinc-500">
              {total > 0 ? `${total} bài viết được tìm thấy` : 'Không tìm thấy kết quả nào'}
            </p>
          )}
        </div>
      </div>

      <SearchResults articles={articles} query={query} tag={tagSlug} />
    </MemberContainer>
  );
}
