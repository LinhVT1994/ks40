"use client";

import React, { useState, useTransition, useEffect } from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import ArticleStep1 from '@/features/admin/components/ArticleStep1';
import ArticleStep2 from '@/features/admin/components/ArticleStep2';
import ArticleStep3 from '@/features/admin/components/ArticleStep3';
import { useRouter } from 'next/navigation';
import { updateArticleAction, addResourceAction, deleteResourceAction } from '@/features/admin/actions/article';
import type { ResourceDraft } from '@/features/admin/actions/article';
import { ArticleBadge, ArticleAudience } from '@prisma/client';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';

const BADGE_UI: Record<ArticleBadge, string> = {
  HOT: 'Hot', NEW: 'New', TRENDING: 'Trending', FEATURED: 'Featured',
};

const BADGE_MAP: Record<string, ArticleBadge> = {
  'Hot': ArticleBadge.HOT, 'New': ArticleBadge.NEW,
  'Trending': ArticleBadge.TRENDING, 'Featured': ArticleBadge.FEATURED,
};

const AUDIENCE_MAP: Record<string, ArticleAudience> = {
  'public':  ArticleAudience.PUBLIC,
  'members': ArticleAudience.MEMBERS,
  'premium': ArticleAudience.PREMIUM,
  'private': ArticleAudience.PRIVATE,
};

type ArticleWithTags = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  overview: string | null;
  objectives: string | null;
  content: string;
  cover: string | null;
  coverPosition: string | null;
  thumbnail: string | null;
  thumbnailPosition: string | null;
  topicId: string;
  badges: ArticleBadge[];
  audience: ArticleAudience;
  seriesId: string | null;
  seriesOrder: number | null;
  nextArticleId: string | null;
  tags: { tag: { name: string } }[];
  resources: { id: string; name: string; url: string; size: number; mimeType: string }[];
};

export default function EditArticlePage({ article }: { article: ArticleWithTags }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);

  useEffect(() => { getTopicTreeAction().then(setTopics); }, []);

  const [title,            setTitle]            = useState(article.title);
  const [slug,             setSlug]             = useState(article.slug);
  const [category,         setCategory]         = useState(article.topicId);
  const [tags,             setTags]             = useState<string[]>(article.tags.map(t => t.tag.name));
  const [badges,           setBadges]           = useState<string[]>(article.badges.map(b => BADGE_UI[b]).filter(Boolean));
  const [summary,          setSummary]          = useState(article.summary ?? '');
  const [overview,         setOverview]         = useState(article.overview ?? '');
  const [objectives,       setObjectives]       = useState(article.objectives ?? '');
  const isValidUrl = (url: string | null) => !!url && !url.startsWith('blob:');
  const [coverPreview,      setCoverPreview]      = useState<string | null>(isValidUrl(article.cover) ? article.cover : null);
  const [coverPosition,     setCoverPosition]     = useState(article.coverPosition ?? '50% 50%');
  const [thumbnailPreview,  setThumbnailPreview]  = useState<string | null>(isValidUrl(article.thumbnail) ? article.thumbnail : null);
  const [thumbnailPosition, setThumbnailPosition] = useState(article.thumbnailPosition ?? '50% 50%');
  const [content,          setContent]          = useState(article.content);
  const [existingResources, setExistingResources] = useState(article.resources);
  const [seriesId,         setSeriesId]         = useState<string | null>(article.seriesId);
  const [seriesOrder,      setSeriesOrder]      = useState<number | null>(article.seriesOrder);
  const [nextArticleId,    setNextArticleId]    = useState<string | null>(article.nextArticleId);

  const handleDeleteExistingResource = async (id: string) => {
    await deleteResourceAction(id);
    setExistingResources(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = (audience: string, scheduleType: 'now' | 'later', scheduleDate: string, newResources: ResourceDraft[], newSeriesId: string | null, newSeriesOrder: number | null, newNextArticleId: string | null) => {
    setSeriesId(newSeriesId);
    setSeriesOrder(newSeriesOrder);
    setNextArticleId(newNextArticleId);
    setError(null);
    startTransition(async () => {
      // Upload new resources
      for (const r of newResources) {
        await addResourceAction(article.id, r);
      }
      const result = await updateArticleAction(article.id, {
        title,
        slug,
        summary,
        overview:   overview   || undefined,
        objectives: objectives || undefined,
        content,
        cover:             coverPreview     ?? undefined,
        coverPosition:     coverPosition,
        thumbnail:         thumbnailPreview ?? undefined,
        thumbnailPosition: thumbnailPosition,
        topicId:     category,
        badges:      badges.map(b => BADGE_MAP[b]).filter(Boolean) as ArticleBadge[],
        audience:    AUDIENCE_MAP[audience]  ?? ArticleAudience.MEMBERS,
        status:      scheduleType === 'now' ? 'PUBLISHED' : 'SCHEDULED',
        publishedAt: scheduleType === 'later' && scheduleDate ? scheduleDate : undefined,
        tags,
        readTime:    Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
        seriesId:      newSeriesId,
        seriesOrder:   newSeriesOrder,
        nextArticleId: newNextArticleId,
      });

      if (result.success) {
        router.push('/admin/documents');
      } else {
        setError(result.error);
        setStep(1);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-slate-900">
      <AdminHeader
        draftingTitle={step >= 2 ? title : undefined}
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' },
          { label: 'Bài viết', href: '/admin/documents' },
          { label: 'Chỉnh sửa' },
        ]}
      />

      {error && (
        <div className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {isPending && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 text-primary text-sm font-medium">
          Đang lưu thay đổi…
        </div>
      )}

      {step === 1 && (
        <ArticleStep1
          title={title}
          category={category}
          tags={tags}
          badges={badges}
          summary={summary}
          coverPreview={coverPreview}
          coverPosition={coverPosition}
          thumbnailPreview={thumbnailPreview}
          thumbnailPosition={thumbnailPosition}
          slug={slug}
          topics={topics}
          onTitleChange={setTitle}
          onSlugChange={setSlug}
          onCategoryChange={setCategory}
          onTagsChange={setTags}
          onBadgesChange={setBadges}
          onSummaryChange={setSummary}
          onCoverChange={setCoverPreview}
          onCoverPositionChange={setCoverPosition}
          onThumbnailChange={setThumbnailPreview}
          onThumbnailPositionChange={setThumbnailPosition}
          onCancel={() => router.push('/admin/documents')}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ArticleStep2
          title={title}
          content={content}
          overview={overview}
          objectives={objectives}
          onContentChange={setContent}
          onOverviewChange={setOverview}
          onObjectivesChange={setObjectives}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ArticleStep3
          title={title}
          articleId={article.id}
          onBack={() => setStep(2)}
          onPublish={handleSave}
          existingResources={existingResources}
          onDeleteExistingResource={handleDeleteExistingResource}
          initialSeriesId={seriesId}
          initialSeriesOrder={seriesOrder}
          initialNextArticleId={nextArticleId}
        />
      )}
    </div>
  );
}
