import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getEnabledTopicTreeAction } from '@/features/admin/actions/topic';
import MemberArticleStepper from '@/features/member/components/MemberArticleStepper';

export const metadata: Metadata = { 
  title: 'Viết bài mới | Lenote.dev',
  robots: { index: false, follow: false },
};

export default async function WritePage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; canWrite?: boolean } | undefined;

  if (!user?.id) redirect('/login');
  if (user.role !== 'ADMIN' && !user.canWrite) redirect('/');

  const topics = await getEnabledTopicTreeAction();

  return <MemberArticleStepper topics={topics} />;
}
