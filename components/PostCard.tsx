import Link from 'next/link';
import Image from 'next/image';
import { getCategorySlug } from '@/lib/site-config';

interface PostCardProps {
    slug: string;
    title: string;
    description: string;
    category: string;
    publishedAt: string;
    featuredImage: string;
}

export default function PostCard({
    slug,
    title,
    description,
    category,
    publishedAt,
    featuredImage,
}: PostCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const categorySlug = category ? getCategorySlug(category) : '';

    return (
        <article className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 h-full flex flex-col">
            {/* Image */}
            <Link href={`/blog/${slug}/`} className="group block">
                <div className="relative w-full h-48 sm:h-52 bg-gray-200 overflow-hidden">
                    <Image
                        src={featuredImage}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                    />
                </div>
            </Link>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Category Badge → 카테고리 hub 로 링크 */}
                    {category && categorySlug ? (
                        <Link
                            href={`/blog/category/${categorySlug}/`}
                            className="inline-block px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-full mb-3 w-fit transition-colors"
                        >
                            {category}
                        </Link>
                    ) : (
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full mb-3 w-fit">
                            {category}
                        </span>
                    )}

                    {/* Title */}
                    <Link href={`/blog/${slug}/`} className="block group">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
                            {title}
                        </h3>
                    </Link>

                    {/* Description */}
                    <p className="text-gray-600 text-sm sm:text-base line-clamp-3 mb-4 leading-relaxed flex-1">
                        {description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <time className="text-xs sm:text-sm text-gray-500" dateTime={publishedAt}>
                            {formatDate(publishedAt)}
                        </time>
                        <Link
                            href={`/blog/${slug}/`}
                            className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1"
                        >
                            더 읽기
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
        </article>
    );
}
