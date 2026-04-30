import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getArticleBySlugStaticAction, getArticleUserInteractionAction, getArticlePreviewAction, getArticlesAction, getArticleNavigationAction, getSeriesContextAction } from '@/features/articles/actions/article';
import type { ArticleCard } from '@/features/articles/actions/article';
import { getCommentsAction } from '@/features/articles/actions/comment';
import { getAuthorInfoStaticAction } from '@/features/member/actions/follow';
import ArticleHero from '@/features/member/components/ArticleHero';
import ArticleContent from '@/features/member/components/ArticleContent';
import ArticleComments from '@/features/member/components/ArticleComments';
import ArticleRating from '@/features/member/components/ArticleRating';
import { getArticleRatingSummaryAction } from '@/features/articles/actions/rating';
import { getArticleAnnotationsAction, getArticleAuthorAnnotationsAction } from '@/features/articles/actions/annotation';
import AuthorCard from '@/features/member/components/AuthorCard';
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
import { ArticleInteractionProvider } from '@/features/articles/context/ArticleInteractionContext';
import FloatingInteractionHub from '@/features/member/components/FloatingInteractionHub';
import MobileInteractionBar from '@/features/member/components/MobileInteractionBar';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticlePreviewAction(slug);
  if (!article) return {};

  const isPrivate   = article.audience === 'PRIVATE';
  const title       = article.title;
  const fullTitle   = `${article.title} | ${SITE_NAME}`;
  const description = article.summary ?? `Đọc bài viết ${article.title} trên ${SITE_NAME}`;
  const rawImage    = article.thumbnail ?? article.cover;
  const ogImage     = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`)
    : `${SITE_URL}/og?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author?.name ?? 'Unknown')}&topic=${encodeURIComponent(article.topic?.label ?? '')}&color=${encodeURIComponent(article.topic?.color ?? '#64748b')}`;

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

  const session = await auth();
  const role    = (session?.user as { role?: string })?.role;
  const userId  = session?.user?.id;

  const article = await getArticleBySlugStaticAction(slug, role);

  const preview = !article ? await getArticlePreviewAction(slug) : null;
  if (!article && !preview) notFound();

  const isGated    = !article;
  const data       = article ?? preview!;
  const authorId   = article?.authorId ?? preview?.author?.id ?? '';

  const seriesId = article?.seriesId ?? null;

  const [comments, { articles }, authorInfo, navigation, seriesCtx, userInteraction, ratingSummary, initialAnnotations, authorAnnotations] = await Promise.all([
    !isGated ? getCommentsAction(data.id) : Promise.resolve([]),
    getArticlesAction({ limit: 20 }),
    authorId ? getAuthorInfoStaticAction(authorId, userId) : Promise.resolve(null),
    !isGated ? getArticleNavigationAction(data.publishedAt) : Promise.resolve({ prev: null, next: null }),
    !isGated && seriesId ? getSeriesContextAction(seriesId, data.id) : Promise.resolve(null),
    !isGated && userId && article ? getArticleUserInteractionAction(article.id, userId) : Promise.resolve({ isLiked: false, isBookmarked: false }),
    !isGated ? getArticleRatingSummaryAction(data.id) : Promise.resolve(null),
    !isGated && userId ? getArticleAnnotationsAction(data.id) : Promise.resolve([]),
    !isGated ? getArticleAuthorAnnotationsAction(data.id) : Promise.resolve([]),
  ]);

  const isAuthor = !!userId && userId === (article?.authorId ?? authorId);

  const articleWithInteraction = article
    ? { ...article, isLiked: userInteraction.isLiked, isBookmarked: userInteraction.isBookmarked }
    : null;

  const related  = articles.filter(a => a.id !== data.id && a.topic?.id === data.topic?.id).slice(0, 7);
  const contentHeadings = isGated ? [] : parseHeadings(data.content);
  const headings = [];
  
  if (!isGated && article) {
    if (article.overview) {
      headings.push({ level: 2, text: 'Tóm tắt nhanh', id: 'overview' });
    }
    if (article.objectives) {
      headings.push({ level: 2, text: 'Mục tiêu bài đọc', id: 'objectives' });
    }
  }
  
  headings.push(...contentHeadings);

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

  const wordCount = typeof data.content === 'string'
    ? data.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    : 0;

  const articleUrl = `${SITE_URL}/article/${data.slug}`;
  const updatedAt  = data.updatedAt;

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
    keywords: data.tags.map(t => t.tag.name).join(', '),
    articleSection: data.topic?.label ?? '',
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
        { '@type': 'ListItem', position: 2, name: data.topic?.label ?? '', item: `${SITE_URL}/topic/${data.topic?.slug ?? ''}` },
        { '@type': 'ListItem', position: 3, name: data.title,    item: `${SITE_URL}/article/${data.slug}` },
      ],
    },
  };

  const initialLiked = userInteraction.isLiked;
  const initialBookmarked = userInteraction.isBookmarked;
  const initialLikeCount = article?._count?.likes ?? 0;

  return (
    <MemberContainer>
      <JsonLd data={jsonLd} />
      <ArticleInteractionProvider
        articleId={data.id}
        initialLiked={initialLiked}
        initialBookmarked={initialBookmarked}
        initialLikeCount={initialLikeCount}
        author={{
          id: data.author?.id ?? authorId,
          name: data.author?.name ?? 'Unknown',
          image: data.author?.image ?? null,
          username: (data.author as { username?: string | null }).username ?? '',
          articleCount: authorInfo?.articleCount ?? 0,
          bio: authorInfo?.bio ?? null,
        }}
        initialIsFollowing={authorInfo?.isFollowing ?? false}
        initialFollowerCount={authorInfo?.followerCount ?? 0}
      >
        <div data-focus-wrapper className="relative w-full max-w-[820px] 2xl:max-w-[960px] mx-auto min-w-0 overflow-hidden md:overflow-visible">
          {/* Desktop Hanging Sidebars (Left: TOC, Right: Interaction) */}
          {!isGated && (
            <>
              <div data-focus-hide className="hidden xl:block absolute right-full top-0 h-full pointer-events-none">
                <div className="sticky top-32 pr-12 xl:pr-14 2xl:pr-24 transition-all pointer-events-auto">
                  <aside className="xl:w-60 2xl:w-64">
                    <FloatingTOC headings={headings} />
                  </aside>
                </div>
              </div>

              <div className="hidden xl:block absolute left-full top-0 h-full pointer-events-none">
                <div data-focus-hide className="sticky top-32 pl-12 xl:pl-14 2xl:pl-24 transition-all pointer-events-auto">
                  <FloatingInteractionHub />
                </div>
              </div>
            </>
          )}

          {/* Mobile TOC Drawer */}
          {!isGated && (
            <div className="xl:hidden">
              <FloatingTOC headings={headings} />
            </div>
          )}
          
          {!isGated && <FocusMode readTime={data.readTime} headings={headings} />}

          <main data-focus-main className="w-full animate-in fade-in duration-500 min-w-0 px-4 md:px-0">
            <div data-focus-hide className="mb-8 opacity-60 hover:opacity-100 transition-opacity">
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
                likeCount={initialLikeCount}
                commentCount={!isGated ? articleWithInteraction!._count.comments : 0}
                isLiked={initialLiked}
                isBookmarked={initialBookmarked}
                isGated={isGated}
                audience={data.audience}
                articleTitle={data.title}
                initialAnnotations={initialAnnotations}
                authorAnnotations={authorAnnotations}
                isAuthor={isAuthor}
              />
            </div>

            {!isGated && (
              <>
                <div>
                  <ArticleResources resources={articleWithInteraction!.resources ?? []} />
                  <ArticleNavigation prev={navigation.prev} next={navigation.next} />
                  
                  {/* Mobile Interaction Bar at Bottom */}
                  <div className="flex items-center justify-center xl:hidden mt-8 mb-4 px-4 border-t border-zinc-100 dark:border-white/5 pt-8">
                    <MobileInteractionBar />
                  </div>

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
        </div>
      </ArticleInteractionProvider>
    </MemberContainer>
  );
}
