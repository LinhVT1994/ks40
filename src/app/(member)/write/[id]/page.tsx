import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getEnabledTopicTreeAction } from '@/features/admin/actions/topic';
import { getMemberArticleByIdAction } from '@/features/member/actions/write';
import MemberArticleStepper from '@/features/member/components/MemberArticleStepper';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { 
  title:  'Chỉnh sửa bài viết | Lenote.dev',
  robots: { index: false, follow: false },
};

export default async function EditWritePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; canWrite?: boolean } | undefined;

  if (!user?.id) redirect('/login');
  if (user.role !== 'ADMIN' && !user.canWrite) redirect('/');

  const [article, topics] = await Promise.all([
    getMemberArticleByIdAction(id),
    getEnabledTopicTreeAction(),
  ]);

  if (!article) notFound();

  return (
    <MemberArticleStepper
      topics={topics}
      editArticle={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary ?? '',
        overview: article.overview ?? '',
        objectives: article.objectives ?? '',
        content: article.content,
        cover: article.cover ?? '',
        coverPosition: article.coverPosition ?? '50% 50%',
        thumbnail: article.thumbnail ?? '',
        thumbnailPosition: article.thumbnailPosition ?? '50% 50%',
        topicId: article.topicId,
        tags: article.tags.map(t => t.tag.name),
        status: article.status,
        rejectionReason: article.rejectionReason,
      }}
    />
  );
}
