import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import {
    SITE,
    CATEGORY_META,
    CATEGORY_SLUG_MAP,
    getCategorySlug,
} from '@/lib/site-config';
import { getBreadcrumbSchema } from '@/lib/schema';
import PostCard from '@/components/PostCard';

interface PageProps {
    params: { slug: string };
}

export async function generateStaticParams() {
    // 글이 1개 이상 있는 카테고리만 hub 생성
    const posts = getAllPosts();
    const used = new Set(posts.map((p) => getCategorySlug(p.category)).filter(Boolean));
    return Array.from(used).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const meta = CATEGORY_META[params.slug];
    if (!meta) return { title: '카테고리를 찾을 수 없습니다' };
    const url = `${SITE.url}/blog/category/${params.slug}/`;
    return {
        title: `${meta.name} 정보 모음`,
        description: meta.description,
        alternates: { canonical: url },
        openGraph: {
            type: 'website',
            url,
            title: `${meta.name} 정보 모음 | ${SITE.name}`,
            description: meta.description,
        },
    };
}

export default function CategoryHubPage({ params }: PageProps) {
    const meta = CATEGORY_META[params.slug];
    if (!meta) notFound();

    const allPosts = getAllPosts();
    const posts = allPosts
        .filter((p) => getCategorySlug(p.category) === params.slug)
        .sort(
            (a, b) =>
                new Date(b.publishedAt || 0).getTime() -
                new Date(a.publishedAt || 0).getTime(),
        );

    // 다른 카테고리 (사이드 네비)
    const otherSlugs = Array.from(
        new Set(allPosts.map((p) => getCategorySlug(p.category)).filter(Boolean)),
    ).filter((s) => s !== params.slug);

    const url = `${SITE.url}/blog/category/${params.slug}/`;
    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name: `${meta.name} 정보 모음`,
        description: meta.description,
        isPartOf: { '@id': `${SITE.url}/#website` },
        publisher: { '@id': `${SITE.url}/#organization` },
        hasPart: posts.map((p) => ({
            '@type': 'MedicalWebPage',
            '@id': `${SITE.url}/blog/${p.slug}/#webpage`,
            name: p.title,
            url: `${SITE.url}/blog/${p.slug}/`,
        })),
    };
    const breadcrumb = getBreadcrumbSchema([
        { name: '홈', url: SITE.url },
        { name: meta.name, url },
    ]);

    return (
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@graph': [collectionSchema, breadcrumb],
                    }),
                }}
            />

            <section className="bg-gray-50 py-12 sm:py-16 border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <nav className="text-sm text-gray-500 mb-4" aria-label="빵부스러기">
                        <Link href="/" className="hover:text-primary-600">
                            홈
                        </Link>{' '}
                        / <span className="text-gray-700">{meta.name}</span>
                    </nav>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        {meta.name} 정보 모음
                    </h1>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-3xl mb-4">
                        {meta.description}
                    </p>
                    {meta.intro && (
                        <div className="prose prose-sm sm:prose-base max-w-3xl text-gray-700 leading-relaxed">
                            <p>{meta.intro}</p>
                        </div>
                    )}
                    <p className="mt-4 text-sm text-gray-500">총 {posts.length}개 글</p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <main className="lg:col-span-3">
                    {posts.length === 0 ? (
                        <p className="text-gray-600">해당 카테고리 글이 아직 없습니다.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {posts.map((p) => (
                                <PostCard
                                    key={p.slug}
                                    slug={p.slug}
                                    title={p.title}
                                    description={p.description}
                                    category={p.category}
                                    publishedAt={p.publishedAt}
                                    featuredImage={p.featuredImage}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <aside className="lg:col-span-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            다른 카테고리
                        </h2>
                        <ul className="space-y-2 text-sm">
                            {otherSlugs.map((s) => (
                                <li key={s}>
                                    <Link
                                        href={`/blog/category/${s}/`}
                                        className="text-gray-700 hover:text-primary-600 hover:underline"
                                    >
                                        {CATEGORY_META[s]?.name || s}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 pt-5 border-t border-gray-200">
                            <Link
                                href="/"
                                className="text-sm text-primary-600 hover:underline font-medium"
                            >
                                ← 홈으로
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export const dynamicParams = false;
// CATEGORY_SLUG_MAP 은 메타데이터 출처. 추후 글이 늘면 generateStaticParams 자동 인식.
void CATEGORY_SLUG_MAP;
