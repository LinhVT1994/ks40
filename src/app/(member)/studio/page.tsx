import React from 'react';
import { Metadata } from 'next';
import { getMemberArticlesAction } from '@/features/member/actions/studio';
import StudioClient from '@/features/member/components/StudioClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Slideshow Studio | KS40',
  description: 'Biến tri thức của bạn thành những bộ Slide triệu view trên mạng xã hội.',
};

export default async function StudioPage() {
  const articles = await getMemberArticlesAction();

  if (!articles) {
    redirect('/auth/login');
  }

  return <StudioClient articles={articles} />;
}
