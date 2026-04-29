import React from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import GlossaryForm from '@/features/admin/components/GlossaryForm';
import { getTopicTreeAction } from '@/features/admin/actions/topic';

export default async function NewGlossaryTermPage() {
  const topics = await getTopicTreeAction();

  return (
    <>
      <AdminHeader 
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' }, 
          { label: 'Thuật ngữ', href: '/admin/glossary' },
          { label: 'Thêm mới' }
        ]} 
      />
      <div className="flex-1">
        <GlossaryForm topics={topics} />
      </div>
    </>
  );
}
