import React from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import GlossaryClient from '@/features/admin/components/GlossaryClient';
import { getGlossaryTermsAction } from '@/features/admin/actions/glossary';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import { ArticleStatus } from '@prisma/client';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function AdminGlossaryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; topicId?: string; page?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const status = params.status as ArticleStatus | undefined;
  const sort = (params.sort as 'term' | 'date') || 'term';

  const [{ terms, total, totalPages, statusCounts }, topics] = await Promise.all([
    getGlossaryTermsAction({ 
      search: params.search, 
      topicId: params.topicId, 
      status,
      sort,
      page, 
      limit: 30, 
      isAdmin: true 
    }),
    getTopicTreeAction(),
  ]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Thuật ngữ' }]} />
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Quản lý Thuật ngữ</h1>
            <p className="text-sm text-zinc-500 mt-1">{total} thuật ngữ trong hệ thống</p>
          </div>
          <Link
            href="/admin/glossary/new"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap w-fit"
          >
            <Plus className="w-4 h-4" /> Thêm thuật ngữ
          </Link>
        </div>
        <GlossaryClient
          terms={terms}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          topics={topics}
          statusCounts={statusCounts}
        />
      </div>
    </>
  );
}
