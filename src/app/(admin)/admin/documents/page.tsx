import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import DocumentsClient from '@/features/admin/components/DocumentsClient';
import SeriesClient from '@/features/admin/components/SeriesClient';
import BookClient from '@/features/admin/components/BookClient';
import { getAdminArticlesAction, getPendingArticlesCountAction } from '@/features/admin/actions/article';
import { getAllSeriesAction } from '@/features/admin/actions/series';
import { getAllBooksAction } from '@/features/admin/actions/book';
import { ArticleStatus } from '@prisma/client';
import DocumentsTabs from '@/features/admin/components/DocumentsTabs';
import { getTopicTreeAction } from '@/features/admin/actions/topic';

const ARTICLE_TABS = ['articles', 'pending', 'admin'] as const;

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; topicId?: string; status?: string; page?: string; tab?: string }>;
}) {
  const params  = await searchParams;
  const tab     = params.tab === 'series' ? 'series'
                : params.tab === 'books'  ? 'books'
                : params.tab === 'pending' ? 'pending'
                : params.tab === 'admin'   ? 'admin'
                : 'articles';
  const isArticleTab = ARTICLE_TABS.includes(tab as any);
  const page    = Number(params.page ?? 1);
  const search  = params.search?.trim();
  const topicId = params.topicId;
  const status  = params.status as ArticleStatus | undefined;

  const articleQueryOptions = isArticleTab ? {
    search,
    topicId,
    page,
    limit: 20,
    ...(tab === 'pending' ? { status: 'PENDING' as ArticleStatus } : {}),
    ...(tab === 'admin'   ? { source: 'admin' as const } : {}),
    ...(tab === 'articles' && status ? { status } : {}),
  } : undefined;

  const [{ articles, total, totalPages }, series, books, topics, pendingCount] = await Promise.all([
    articleQueryOptions
      ? getAdminArticlesAction(articleQueryOptions)
      : Promise.resolve({ articles: [], total: 0, totalPages: 0 }),
    tab === 'series'
      ? getAllSeriesAction()
      : Promise.resolve([]),
    tab === 'books'
      ? getAllBooksAction()
      : Promise.resolve([]),
    getTopicTreeAction(),
    getPendingArticlesCountAction(),
  ]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Nội dung' }]} />
      <div className="flex-1 p-6 md:p-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Quản lý Nội dung</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isArticleTab ? `${total} bài viết` : tab === 'series' ? `${series.length} series` : `${books.length} books`} trong hệ thống
            </p>
          </div>
          {isArticleTab && (
            <Link
              href="/admin/articles/new"
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Tạo bài viết mới
            </Link>
          )}
        </div>

        {/* Tabs */}
        <DocumentsTabs activeTab={tab as any} pendingCount={pendingCount} />

        {/* Tab content */}
        {isArticleTab ? (
          <DocumentsClient
            articles={articles}
            total={total}
            totalPages={totalPages}
            currentPage={page}
            topics={topics}
          />
        ) : tab === 'series' ? (
          <SeriesClient series={series} />
        ) : (
          <BookClient books={books} />
        )}
      </div>
    </>
  );
}
