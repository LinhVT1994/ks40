import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import DocumentsClient from '@/features/admin/components/DocumentsClient';
import SeriesClient from '@/features/admin/components/SeriesClient';
import BookClient from '@/features/admin/components/BookClient';
import { getAdminArticlesAction } from '@/features/admin/actions/article';
import { getAllSeriesAction } from '@/features/admin/actions/series';
import { getAllBooksAction } from '@/features/admin/actions/book';
import { ArticleCategory, ArticleStatus } from '@prisma/client';
import DocumentsTabs from '@/features/admin/components/DocumentsTabs';

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string; page?: string; tab?: string }>;
}) {
  const params   = await searchParams;
  const tab      = params.tab === 'series' ? 'series' : params.tab === 'books' ? 'books' : 'articles';
  const page     = Number(params.page ?? 1);
  const search   = params.search?.trim();
  const category = params.category as ArticleCategory | undefined;
  const status   = params.status   as ArticleStatus   | undefined;

  const [{ articles, total, totalPages }, series, books] = await Promise.all([
    tab === 'articles'
      ? getAdminArticlesAction({ search, category, status, page, limit: 20 })
      : Promise.resolve({ articles: [], total: 0, totalPages: 0 }),
    tab === 'series'
      ? getAllSeriesAction()
      : Promise.resolve([]),
    tab === 'books'
      ? getAllBooksAction()
      : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Nội dung' }]} />
      <div className="flex-1 p-6 md:p-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Quản lý Nội dung</h1>
            <p className="text-sm text-slate-500 mt-1">
              {tab === 'articles' ? `${total} bài viết` : tab === 'series' ? `${series.length} series` : `${books.length} books`} trong hệ thống
            </p>
          </div>
          {tab === 'articles' && (
            <Link
              href="/admin/articles/new"
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Tạo bài viết mới
            </Link>
          )}
        </div>

        {/* Tabs */}
        <DocumentsTabs activeTab={tab as any} />

        {/* Tab content */}
        {tab === 'articles' ? (
          <DocumentsClient
            articles={articles}
            total={total}
            totalPages={totalPages}
            currentPage={page}
            categories={Object.values(ArticleCategory)}
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
