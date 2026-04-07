import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlugAction, getArticlePreviewAction, getArticlesAction } from '@/features/articles/actions/article';
import { getCommentsAction } from '@/features/articles/actions/comment';
import { getAuthorInfoAction } from '@/features/member/actions/follow';
import ArticleHero from '@/features/member/components/ArticleHero';
import ArticleContent from '@/features/member/components/ArticleContent';
import ArticleComments from '@/features/member/components/ArticleComments';
import ArticleSidebar from '@/features/member/components/ArticleSidebar';
import RelatedArticles from '@/features/member/components/RelatedArticles';
import ArticleNavigation from '@/features/member/components/ArticleNavigation';
import ArticleResources from '@/features/member/components/ArticleResources';
import FloatingTOC from '@/features/member/components/FloatingTOC';
import JsonLd from '@/components/shared/JsonLd';
import { parseHeadings } from '@/lib/slugify';
import { getArticleNavigationAction, getSeriesContextAction } from '@/features/articles/actions/article';
import SeriesBanner from '@/features/member/components/SeriesBanner';
import NextArticleCard from '@/features/member/components/NextArticleCard';
import FocusMode from '@/features/member/components/FocusMode';
import MemberContainer from '@/components/layout/MemberContainer';
import BackButton from '@/components/shared/BackButton';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticlePreviewAction(slug);
  if (!article) return {};

  const title       = `${article.title} | Lenote.dev`;
  const description = article.summary ?? `Đọc bài viết ${article.title} trên Lenote.dev`;
  const ogImage     = article.thumbnail ?? article.cover
    ?? `${BASE_URL}/og?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author.name)}&category=${article.category}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      ...(article.publishedAt && { publishedTime: article.publishedAt.toISOString() }),
      authors:  [article.author.name],
      tags:     article.tags.map(t => t.tag.name),
      images:   [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card:   'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: `/article/${slug}` },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  // Try full access first
  const article = await getArticleBySlugAction(slug);

  // If no access, try preview (gated)
  const preview = !article ? await getArticlePreviewAction(slug) : null;
  if (!article && !preview) notFound();

  const isGated    = !article;
  const data       = article ?? preview!;
  const authorId   = (article as { authorId?: string })?.authorId ?? '';

  const seriesId = (article as { seriesId?: string | null })?.seriesId ?? null;

  const [comments, { articles }, authorInfo, navigation, seriesCtx] = await Promise.all([
    !isGated ? getCommentsAction(data.id) : Promise.resolve([]),
    getArticlesAction({ limit: 20 }),
    !isGated && authorId ? getAuthorInfoAction(authorId) : Promise.resolve(null),
    !isGated ? getArticleNavigationAction(data.publishedAt) : Promise.resolve({ prev: null, next: null }),
    !isGated && seriesId ? getSeriesContextAction(seriesId, data.id) : Promise.resolve(null),
  ]);

  const related  = articles.filter(a => a.id !== data.id && a.category === data.category).slice(0, 7);
  const trending = [...articles].sort((a, b) => b.viewCount - a.viewCount).filter(a => a.id !== data.id).slice(0, 4);
  const headings = isGated ? [] : parseHeadings(data.content);

  // Build a minimal article-like object for ArticleHero when gated
  const heroArticle = article ?? {
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
  const image    = data.thumbnail ?? data.cover ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'BlogPosting',
    headline:   data.title,
    description: data.summary ?? '',
    ...(image && { image }),
    author: { '@type': 'Person', name: data.author.name },
    publisher: { '@type': 'Organization', name: 'KS4.0 Academy', url: BASE_URL },
    ...(data.publishedAt && { datePublished: data.publishedAt.toISOString() }),
    url: `${BASE_URL}/article/${data.slug}`,
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
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: data.category, item: `${BASE_URL}/category/${data.category.toLowerCase()}` },
        { '@type': 'ListItem', position: 3, name: data.title,    item: `${BASE_URL}/article/${data.slug}` },
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
        <main data-focus-main className="flex-1 xl:col-span-9">
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
              overview={!isGated ? (article!.overview ?? undefined) : undefined}
              objectives={!isGated ? (article!.objectives ?? undefined) : undefined}
              likeCount={!isGated ? article!._count.likes : 0}
              commentCount={!isGated ? article!._count.comments : 0}
              isLiked={!isGated ? (article!.isLiked ?? false) : false}
              isBookmarked={!isGated ? (article!.isBookmarked ?? false) : false}
              isGated={isGated}
              audience={data.audience}
            />
          </div>

          {!isGated && (
            <>
              <div data-focus-hide>
                <ArticleResources resources={article!.resources ?? []} />
                <ArticleNavigation prev={navigation.prev} next={navigation.next} />
                {(article as any).nextArticle && (
                  <NextArticleCard article={(article as any).nextArticle} />
                )}
              </div>
              <div data-focus-hide>
                <ArticleComments articleId={data.id} initialComments={comments as any} />
              </div>
            </>
          )}
          <div data-focus-hide>
            <RelatedArticles articles={related} />
          </div>
        </main>

        {/* Sidebar — right */}
        <aside data-focus-hide className="hidden xl:block xl:col-span-3 shrink-0 xl:sticky xl:top-[100px] xl:border-l xl:border-slate-100 dark:xl:border-white/5 xl:pl-4">
          <ArticleSidebar related={related} trending={trending} headings={[]} author={authorInfo} />
        </aside>
      </div>
    </MemberContainer>
  );
}
