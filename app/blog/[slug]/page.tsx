import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from '@/lib/posts';
import TableOfContents from '@/components/TableOfContents';
import PostCard from '@/components/PostCard';

interface PageProps {
    params: {
        slug: string;
    };
}

// Generate static params for all posts
export async function generateStaticParams() {
    const slugs = getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return {
            title: '페이지를 찾을 수 없습니다',
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gangnamimplant.com';
    const url = `${siteUrl}/blog/${params.slug}`;

    return {
        title: post.title,
        description: post.description,
        keywords: post.keywords,
        authors: [{ name: post.author }],
        openGraph: {
            type: 'article',
            url,
            title: post.title,
            description: post.description,
            images: [
                {
                    url: `${siteUrl}${post.featuredImage}`,
                    width: 1200,
                    height: 900,
                    alt: post.title,
                },
            ],
            publishedTime: post.publishedAt,
        },
        alternates: {
            canonical: url,
        },
    };
}

export default function BlogPost({ params }: PageProps) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(params.slug, post.category, 3);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.description,
                author: {
                    '@type': 'Organization',
                    name: post.author,
                },
                datePublished: post.publishedAt,
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}`,
                },
                image: post.featuredImage,
            },
        ],
    };

    return (
        <>
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Header */}
                        <header className="mb-8">
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-full">
                                    {post.category}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                {post.title}
                            </h1>
                            <div className="flex items-center text-sm text-gray-600">
                                <time dateTime={post.publishedAt}>
                                    {formatDate(post.publishedAt)}
                                </time>
                                <span className="mx-2">•</span>
                                <span>{post.author}</span>
                            </div>
                        </header>

                        {/* Featured Image */}
                        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
                            <Image
                                src={post.featuredImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                        </div>

                        {/* MDX Content */}
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
                    </div>

                    {/* Sidebar - Table of Contents */}
                    <aside className="lg:col-span-4">
                        <TableOfContents content={post.content} />
                    </aside>
                </div>

                {/* Related Posts */}
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
        </>
    );
}
