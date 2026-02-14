'use client';

import PostCard from '@/components/PostCard';
import { useState, useMemo } from 'react';
import type { Post } from '@/lib/posts';

interface HomePageClientProps {
    allPosts: Post[];
    categories: string[];
}

export default function HomePageClient({ allPosts, categories }: HomePageClientProps) {
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;

    // Filter posts
    const filteredPosts = useMemo(() => {
        let filtered = allPosts;

        // Filter by category
        if (selectedCategory !== '전체') {
            filtered = filtered.filter((post) => post.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (post) =>
                    post.title.toLowerCase().includes(query) ||
                    post.description.toLowerCase().includes(query) ||
                    post.keywords.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [allPosts, selectedCategory, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * postsPerPage,
        currentPage * postsPerPage
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Hero Section - 모바일에서 더 컴팩트하게 */}
            <section className="text-center mb-8 sm:mb-16">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                    강남 임플란트 완벽 가이드
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                    임플란트 가격부터 시술 과정, 관리 방법까지
                    <br className="hidden sm:block" />
                    전문가가 알려주는 모든 정보를 확인하세요
                </p>
            </section>

            {/* Search */}
            <div className="mb-6 sm:mb-8">
                <input
                    type="text"
                    placeholder="검색어를 입력하세요..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 sm:py-3.5 text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-sm"
                />
            </div>

            {/* Category Filter */}
            <div id="blog" className="mb-6 sm:mb-8">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => {
                                setSelectedCategory(category);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-500 hover:text-primary-600 hover:shadow-sm'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Result Count */}
            <div className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 font-medium">
                총 {filteredPosts.length}개의 글
            </div>

            {paginatedPosts.length > 0 ? (
                <>
                    {/* Blog Grid - 모바일 간격 확대 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
                        {paginatedPosts.map((post) => (
                            <PostCard
                                key={post.slug}
                                slug={post.slug}
                                title={post.title}
                                description={post.description}
                                category={post.category}
                                publishedAt={post.publishedAt}
                                featuredImage={post.featuredImage}
                            />
                        ))}
                    </div>

                    {/* Pagination - 모바일 최적화 */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                            <button
                                onClick={() => {
                                    setCurrentPage((prev) => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm sm:text-base transition-colors"
                            >
                                이전
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all ${currentPage === page
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary-500'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm sm:text-base transition-colors"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}
