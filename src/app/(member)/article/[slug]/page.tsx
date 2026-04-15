import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getArticleBySlugStaticAction, getArticleUserInteractionAction, getArticlePreviewAction, getArticlesAction, getArticleNavigationAction, getSeriesContextAction, getPublishedArticleSlugsAction } from '@/features/articles/actions/article';
import type { ArticleCard } from '@/features/articles/actions/article';
import { getCommentsAction } from '@/features/articles/actions/comment';
import { getAuthorInfoStaticAction } from '@/features/member/actions/follow';
import ArticleHero from '@/features/member/components/ArticleHero';
import ArticleContent from '@/features/member/components/ArticleContent';
import ArticleComments from '@/features/member/components/ArticleComments';
import ArticleRating from '@/features/member/components/ArticleRating';
import { getArticleRatingSummaryAction } from '@/features/articles/actions/rating';
import ArticleSidebar from '@/features/member/components/ArticleSidebar';
import RelatedArticles from '@/features/member/components/RelatedArticles';
import ArticleNavigation from '@/features/member/components/ArticleNavigation';
import ArticleResources from '@/features/member/components/ArticleResources';
import FloatingTOC from '@/features/member/components/FloatingTOC';
import JsonLd from '@/components/shared/JsonLd';
import { parseHeadings } from '@/lib/slugify';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import SeriesBanner from '@/features/member/components/SeriesBanner';
import NextArticleCard from '@/features/member/components/NextArticleCard';
import FocusMode from '@/features/member/components/FocusMode';
import MemberContainer from '@/components/layout/MemberContainer';
import BackButton from '@/components/shared/BackButton';

export const revalidate = 3600;

export async function generateStaticParams() {
  return getPublishedArticleSlugsAction();
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticlePreviewAction(slug);
  if (!article) return {};

  const isPrivate   = article.audience === 'PRIVATE';
  const title       = article.title;
  const fullTitle   = `${article.title} | ${SITE_NAME}`;
  const description = article.summary ?? `Đọc bài viết ${article.title} trên ${SITE_NAME}`;
  const ogImage     = article.thumbnail ?? article.cover
    ?? `${SITE_URL}/og?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author.name)}&topic=${encodeURIComponent(article.topic?.label ?? '')}&color=${encodeURIComponent(article.topic?.color ?? '#64748b')}`;

  return {
    title,
    description,
    robots: isPrivate
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : { index: true,  follow: true },
    openGraph: {
      title: fullTitle,
      description,
      type: 'article',
      ...(article.publishedAt && { publishedTime: new Date(article.publishedAt).toISOString() }),
      authors:  [article.author.name],
      tags:     article.tags.map(t => t.tag.name),
      images:   [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card:   'summary_large_image',
      title:  fullTitle,
      description,
      images: [ogImage],
    },
    alternates: { canonical: `/article/${slug}` },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  // Auth một lần duy nhất — lấy role để filter content và userId cho user-specific data
  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  const userId  = session?.user?.id;

  // Nội dung bài viết — cached theo (slug, role), không gọi auth() thêm
  const article = await getArticleBySlugStaticAction(slug, role);

  // Nếu không có quyền truy cập, thử lấy preview (gated)
  const preview = !article ? await getArticlePreviewAction(slug) : null;
  if (!article && !preview) notFound();

  const isGated    = !article;
  const data       = article ?? preview!;
  const authorId   = (article as { authorId?: string })?.authorId ?? '';

  const seriesId = (article as { seriesId?: string | null })?.seriesId ?? null;

  const [comments, { articles }, authorInfo, navigation, seriesCtx, userInteraction, ratingSummary] = await Promise.all([
    !isGated ? getCommentsAction(data.id) : Promise.resolve([]),
    getArticlesAction({ limit: 20 }),
    !isGated && authorId ? getAuthorInfoStaticAction(authorId, userId) : Promise.resolve(null),
    !isGated ? getArticleNavigationAction(data.publishedAt) : Promise.resolve({ prev: null, next: null }),
    !isGated && seriesId ? getSeriesContextAction(seriesId, data.id) : Promise.resolve(null),
    !isGated && userId && article ? getArticleUserInteractionAction(article.id, userId) : Promise.resolve({ isLiked: false, isBookmarked: false }),
    !isGated ? getArticleRatingSummaryAction(data.id) : Promise.resolve(null),
  ]);

  // Gắn trạng thái tương tác của user vào article
  const articleWithInteraction = article
    ? { ...article, isLiked: userInteraction.isLiked, isBookmarked: userInteraction.isBookmarked }
    : null;

  const historyArticles: { article: ArticleCard; progress: number }[] = [];

  const related  = articles.filter(a => a.id !== data.id && a.topic.id === (data as { topic?: { id: string } }).topic?.id).slice(0, 7);
  const trending = [...articles].sort((a, b) => b.viewCount - a.viewCount).filter(a => a.id !== data.id).slice(0, 4);
  const headings = isGated ? [] : parseHeadings(data.content);

  // Build a minimal article-like object for ArticleHero when gated
  const heroArticle = articleWithInteraction ?? {
    ...preview!,
    authorId:    '',
    content:     preview!.content,
    overview:    null,
    objectives:  null,
    badges:      [],
    readTime:    preview!.readTime,
    viewCount:   0,
    tags:        preview!.tags,
    resources:   [],
    _count:      { likes: 0, comments: 0, bookmarks: 0 },
    isLiked:     false,
    isBookmarked: false,
  };

  const isPublic = data.audience === 'PUBLIC';
  const rawImage = data.thumbnail ?? data.cover ?? null;
  const image    = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`)
    : null;

  // wordCount approx — bỏ HTML/markdown tag thô
  const wordCount = typeof data.content === 'string'
    ? data.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    : 0;

  const articleUrl = `${SITE_URL}/article/${data.slug}`;
  const updatedAt  = (data as { updatedAt?: Date }).updatedAt;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'BlogPosting',
    headline:   data.title,
    description: data.summary ?? '',
    ...(image && { image }),
    author: { '@type': 'Person', name: data.author.name },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    ...(data.publishedAt && { datePublished: new Date(data.publishedAt).toISOString() }),
    ...(updatedAt && { dateModified: new Date(updatedAt).toISOString() }),
    url: articleUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    inLanguage: 'vi-VN',
    ...(wordCount > 0 && { wordCount }),
    ...(ratingSummary && ratingSummary.totalCount > 0 && {
      aggregateRating: {
        '@type':      'AggregateRating',
        ratingValue:  ratingSummary.averageScore,
        reviewCount:  ratingSummary.totalCount,
        bestRating:   5,
        worstRating:  1,
      },
    }),
    isAccessibleForFree: isPublic ? 'True' : 'False',
    ...(!isPublic && {
      hasPart: {
        '@type':               'WebPageElement',
        isAccessibleForFree:   'False',
        cssSelector:           '.article-gated-content',
      },
    }),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: (data as { topic?: { label: string; slug: string } }).topic?.label ?? '', item: `${SITE_URL}/topic/${(data as { topic?: { slug: string } }).topic?.slug ?? ''}` },
        { '@type': 'ListItem', position: 3, name: data.title,    item: `${SITE_URL}/article/${data.slug}` },
      ],
    },
  };

  return (
    <MemberContainer>
      <JsonLd data={jsonLd} />
      {!isGated && <div data-focus-hide><FloatingTOC headings={headings} /></div>}
      {!isGated && <FocusMode readTime={data.readTime} headings={headings} />}

      <div data-focus-grid className="flex flex-col xl:grid xl:grid-cols-12 gap-10 items-start">
        {/* Main content */}
        <main data-focus-main className="flex-1 min-w-0 xl:col-span-9">
          <div data-focus-hide className="mb-6">
            <BackButton />
          </div>
          <ArticleHero article={heroArticle as any} />
          {!isGated && seriesCtx && (
            <div data-focus-hide><SeriesBanner ctx={seriesCtx} /></div>
          )}
          <div data-focus-prose>
            <ArticleContent
              articleId={data.id}
              content={data.content}
              overview={!isGated ? (articleWithInteraction!.overview ?? undefined) : undefined}
              objectives={!isGated ? (articleWithInteraction!.objectives ?? undefined) : undefined}
              likeCount={!isGated ? articleWithInteraction!._count.likes : 0}
              commentCount={!isGated ? articleWithInteraction!._count.comments : 0}
              isLiked={!isGated ? (articleWithInteraction!.isLiked ?? false) : false}
              isBookmarked={!isGated ? (articleWithInteraction!.isBookmarked ?? false) : false}
              isGated={isGated}
              audience={data.audience}
            />
          </div>

          {!isGated && (
            <>
              <div>
                <ArticleResources resources={articleWithInteraction!.resources ?? []} />
                <ArticleNavigation prev={navigation.prev} next={navigation.next} />
                {(articleWithInteraction as any).nextArticle && (
                  <NextArticleCard article={(articleWithInteraction as any).nextArticle} />
                )}
              </div>
              {ratingSummary && (
                <ArticleRating
                  articleId={data.id}
                  initialSummary={ratingSummary}
                />
              )}
              <div>
                <ArticleComments articleId={data.id} initialComments={comments as any} />
              </div>
            </>
          )}
          <div>
            <RelatedArticles articles={related} />
          </div>
        </main>

        {/* Sidebar — right */}
        <aside data-focus-hide className="hidden xl:block xl:col-span-3 shrink-0 xl:sticky xl:top-[100px] xl:border-l xl:border-zinc-200 dark:xl:border-white/5 xl:pl-4">
          <ArticleSidebar 
            related={related} 
            trending={trending} 
            history={historyArticles}
            headings={[]} 
            author={authorInfo} 
          />
        </aside>
      </div>
    </MemberContainer>
  );
}
