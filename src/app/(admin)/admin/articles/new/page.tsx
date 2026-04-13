"use client";

import React, { useState, useTransition, useEffect } from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import ArticleStep1 from '@/features/admin/components/ArticleStep1';
import ArticleStep2 from '@/features/admin/components/ArticleStep2';
import ArticleStep3 from '@/features/admin/components/ArticleStep3';
import { useRouter } from 'next/navigation';
import { createArticleAction } from '@/features/admin/actions/article';
import type { ArticleFormData, ResourceDraft } from '@/features/admin/actions/article';
import { ArticleBadge, ArticleAudience } from '@prisma/client';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

const BADGE_MAP: Record<string, ArticleBadge> = {
  'Hot':      ArticleBadge.HOT,
  'New':      ArticleBadge.NEW,
  'Trending': ArticleBadge.TRENDING,
  'Featured': ArticleBadge.FEATURED,
};

const AUDIENCE_MAP: Record<string, ArticleAudience> = {
  'public':  ArticleAudience.PUBLIC,
  'members': ArticleAudience.MEMBERS,
  'premium': ArticleAudience.PREMIUM,
  'private': ArticleAudience.PRIVATE,
};

export default function NewArticlePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);

  useEffect(() => { getTopicTreeAction().then(setTopics); }, []);

  // Step 1 state
  const [title,            setTitle]            = useState('');
  const [slug,             setSlug]             = useState('');
  const [category,         setCategory]         = useState('');
  const [tags,             setTags]             = useState<string[]>([]);
  const [badges,           setBadges]           = useState<string[]>([]);
  const [summary,          setSummary]          = useState('');
  const [overview,         setOverview]         = useState('');
  const [objectives,       setObjectives]       = useState('');
  const [coverPreview,       setCoverPreview]       = useState<string | null>(null);
  const [coverPosition,      setCoverPosition]      = useState('50% 50%');
  const [thumbnailPreview,   setThumbnailPreview]   = useState<string | null>(null);
  const [thumbnailPosition,  setThumbnailPosition]  = useState('50% 50%');

  // Step 2 state
  const [content, setContent] = useState('');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSlug(toSlug(v));
  };

  const handlePublish = (audience: string, scheduleType: 'now' | 'later', scheduleDate: string, resources: ResourceDraft[], seriesId: string | null, seriesOrder: number | null, nextArticleId: string | null) => {
    setError(null);
    const mappedBadges    = badges.map(b => BADGE_MAP[b]).filter(Boolean) as ArticleBadge[];
    const mappedAudience  = AUDIENCE_MAP[audience]  ?? ArticleAudience.MEMBERS;

    const data: ArticleFormData = {
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
      badges:      mappedBadges,
      audience:    mappedAudience,
      status:      scheduleType === 'now' ? 'PUBLISHED' : 'SCHEDULED',
      publishedAt: scheduleType === 'later' && scheduleDate ? scheduleDate : undefined,
      tags,
      readTime:    Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
      resources:   resources.length > 0 ? resources : undefined,
      seriesId:      seriesId ?? undefined,
      seriesOrder:   seriesOrder ?? undefined,
      nextArticleId: nextArticleId,
    };

    startTransition(async () => {
      const result = await createArticleAction(data);
      if (result.success) {
        router.push('/admin/documents');
      } else {
        setError(result.error);
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
          { label: 'Tạo mới' },
        ]}
      />

      {error && (
        <div className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {isPending && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 text-primary text-sm font-medium">
          Đang lưu bài viết…
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
          onTitleChange={handleTitleChange}
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
          onBack={() => setStep(2)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
