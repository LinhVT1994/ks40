import React from 'react';
import type { Metadata } from 'next';
import { getGlossaryTermsAction, GlossaryTermSummary } from '@/features/admin/actions/glossary';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import { SITE_NAME } from '@/lib/seo';
import GlossaryExplorer from '@/features/member/components/GlossaryExplorer';
import GlossaryTermCard from '@/features/member/components/GlossaryTermCard';
import GlossaryPagination from '@/features/member/components/GlossaryPagination';
import MemberContainer from '@/components/layout/MemberContainer';

export const metadata: Metadata = {
  title: `Thuật ngữ | ${SITE_NAME}`,
  description: 'Tra cứu các thuật ngữ và định nghĩa chuyên ngành được sử dụng trong các bài viết.',
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default async function GlossaryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; letter?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const letter = params.letter || '';

  const currentPage = Number(params.page) || 1;
  const limit = 24;

  const [{ terms, total, totalPages }, topics] = await Promise.all([
    getGlossaryTermsAction({
      search,
      letter,
      page: currentPage,
      limit,
    }),
    getTopicTreeAction()
  ]);

  const grouped = terms.reduce<Record<string, GlossaryTermSummary[]>>((acc, t: GlossaryTermSummary) => {
    const first = t.term[0].toUpperCase();
    const key = ALPHABET.includes(first) ? first : '#';
    acc[key] = acc[key] ?? [];
    acc[key].push(t);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b));

  return (
    <div className="min-h-screen transition-colors">
      <GlossaryExplorer search={search} letter={letter} topics={topics} />

      <MemberContainer>
        <div className="max-w-4xl mx-auto pb-24 px-4">
          {terms.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-300 dark:text-slate-700">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-zinc-500 dark:text-slate-400 font-medium italic">Không tìm thấy thuật ngữ nào khớp với yêu cầu của bạn.</p>
            </div>
          ) : (
            <div className="space-y-16" data-glossary-list>
              {letters.map(letterKey => (
                <div key={letterKey} className="relative group/section">
                  <div className="flex items-center gap-6 mb-10 py-4 transition-colors">
                    <h2 className="text-5xl font-display font-heavy text-primary/10 dark:text-primary/5 group-hover/section:text-primary/30 transition-colors duration-500">
                      {letterKey}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    {grouped[letterKey].map((t: GlossaryTermSummary, i: number) => (
                      <GlossaryTermCard
                        key={t.id}
                        term={t}
                        index={i}
                        currentSearch={search}
                        currentLetter={letter}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <GlossaryPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
              />
            </div>
          )}
        </div>
      </MemberContainer>
    </div>
  );
}





