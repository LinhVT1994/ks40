import React from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import GlossaryForm from '@/features/admin/components/GlossaryForm';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import { getGlossaryTermByIdAction } from '@/features/admin/actions/glossary';
import { notFound } from 'next/navigation';

export default async function EditGlossaryTermPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [term, topics] = await Promise.all([
    getGlossaryTermByIdAction(id),
    getTopicTreeAction(),
  ]);

  if (!term) {
    notFound();
  }

  return (
    <>
      <AdminHeader 
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' }, 
          { label: 'Thuật ngữ', href: '/admin/glossary' },
          { label: 'Chỉnh sửa' }
        ]} 
      />
      <div className="flex-1">
        <GlossaryForm initial={term} topics={topics} />
      </div>
    </>
  );
}
