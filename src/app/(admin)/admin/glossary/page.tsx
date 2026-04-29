import React from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import GlossaryClient from '@/features/admin/components/GlossaryClient';
import { getGlossaryTermsAction } from '@/features/admin/actions/glossary';
import { getTopicTreeAction } from '@/features/admin/actions/topic';

export default async function AdminGlossaryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; topicId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const [{ terms, total, totalPages }, topics] = await Promise.all([
    getGlossaryTermsAction({ search: params.search, topicId: params.topicId, page, limit: 30 }),
    getTopicTreeAction(),
  ]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Thuật ngữ' }]} />
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Quản lý Thuật ngữ</h1>
          <p className="text-sm text-zinc-500 mt-1">{total} thuật ngữ trong hệ thống</p>
        </div>
        <GlossaryClient
          terms={terms}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          topics={topics}
        />
      </div>
    </>
  );
}
