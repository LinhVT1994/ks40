import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditArticlePage from './EditArticlePage';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const article = await db.article.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      resources: { select: { id: true, name: true, url: true, size: true, mimeType: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!article) notFound();

  return <EditArticlePage article={article} />;
}
