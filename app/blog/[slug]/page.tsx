import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from '@/lib/posts';
import { getPostJsonLdGraph } from '@/lib/schema';
import { SITE } from '@/lib/site-config';
import TableOfContents from '@/components/TableOfContents';
import PostCard from '@/components/PostCard';
import MedicalReviewerBox from '@/components/MedicalReviewerBox';
import MedicalDisclaimer from '@/components/MedicalDisclaimer';
import ScrollSuggestion from '@/components/ScrollSuggestion';

interface PageProps {
    params: { slug: string };
}

export async function generateStaticParams() {
    const slugs = getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const post = getPostBySlug(params.slug);
    if (!post) {
        return { title: '페이지를 찾을 수 없습니다' };
    }

    const url = `${SITE.url}/blog/${params.slug}/`;
    const ogImage = post.featuredImage
        ? post.featuredImage.startsWith('http')
            ? post.featuredImage
            : `${SITE.url}${post.featuredImage}`
        : `${SITE.url}${SITE.defaultOgImage}`;

    return {
        title: post.title,
        description: post.description,
        openGraph: {
            type: 'article',
            url,
            title: post.title,
            description: post.description,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 900,
                    alt: post.featuredImageAlt || post.title,
                },
            ],
            ...(post.publishedAt && { publishedTime: post.publishedAt }),
            ...(post.dateModified && { modifiedTime: post.dateModified }),
            authors: [`${SITE.url}/about/`],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            images: [ogImage],
        },
        alternates: { canonical: url },
    };
}

function formatDate(dateString?: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function BlogPost({ params }: PageProps) {
    const post = getPostBySlug(params.slug);
    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(params.slug, post.category, 3);
    const jsonLd = getPostJsonLdGraph(post, params.slug);

    const publishedDisplay = formatDate(post.publishedAt);
    const modifiedDisplay = formatDate(post.dateModified);
    const showModified = modifiedDisplay && modifiedDisplay !== publishedDisplay;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <header className="mb-8">
                            {post.category && (
                                <div className="mb-4">
                                    <span className="inline-block px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-full">
                                        {post.category}
                                    </span>
                                </div>
                            )}
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                                {publishedDisplay && (
                                    <time dateTime={post.publishedAt}>{publishedDisplay} 발행</time>
                                )}
                                {showModified && (
                                    <>
                                        <span>·</span>
                                        <time dateTime={post.dateModified}>
                                            {modifiedDisplay} 업데이트
                                        </time>
                                    </>
                                )}
                            </div>
                        </header>

                        {post.featuredImage && (
                            <div className="relative w-full h-64 sm:h-96 mb-8 rounded-lg overflow-hidden">
                                <Image
                                    src={post.featuredImage}
                                    alt={post.featuredImageAlt || post.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                />
                            </div>
                        )}

                        <div className="prose prose-lg max-w-none">
                            <MDXRemote
                                source={post.content}
                                options={{
                                    mdxOptions: {
                                        remarkPlugins: [remarkGfm],
                                    },
                                }}
                            />
                        </div>

                        <MedicalDisclaimer />

                        <MedicalReviewerBox
                            reviewer={post.reviewer}
                            lastReviewed={post.lastReviewed}
                        />
                    </div>

                    <aside className="lg:col-span-4">
                        <TableOfContents content={post.content} />
                    </aside>
                </div>

                {relatedPosts.length > 0 && (
                    <section className="mt-16 pt-16 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">관련 글</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedPosts.map((relatedPost) => (
                                <PostCard
                                    key={relatedPost.slug}
                                    slug={relatedPost.slug}
                                    title={relatedPost.title}
                                    description={relatedPost.description}
                                    category={relatedPost.category}
                                    publishedAt={relatedPost.publishedAt}
                                    featuredImage={relatedPost.featuredImage}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </article>

            <ScrollSuggestion
                posts={relatedPosts.map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    category: p.category,
                }))}
            />
        </>
    );
}
