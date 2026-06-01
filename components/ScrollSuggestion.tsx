'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SuggestionPost {
    slug: string;
    title: string;
    category: string;
}

interface ScrollSuggestionProps {
    posts: SuggestionPost[];
}

/**
 * 스크롤 80% 도달 시 우측 하단에 "같이 보면 좋은 글" sticky 박스 표시.
 * 닫기 버튼으로 사용자가 해제 가능 (해제 후 같은 페이지에서 재표시 X).
 */
export default function ScrollSuggestion({ posts }: ScrollSuggestionProps) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!posts || posts.length === 0) return;

        const onScroll = () => {
            if (dismissed) return;
            const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
            if (docHeight <= 0) {
                // 짧은 페이지: 곧바로 표시
                setVisible(true);
                return;
            }
            const ratio = scrollTop / docHeight;
            if (ratio >= 0.7) {
                setVisible(true);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // 첫 진입 시 한 번 체크 (이미 70%+ 인 경우)
        setTimeout(onScroll, 200);
        return () => window.removeEventListener('scroll', onScroll);
    }, [posts, dismissed]);

    if (!visible || dismissed || !posts || posts.length === 0) return null;

    const items = posts.slice(0, 3);

    return (
        <aside
            className="fixed bottom-6 right-6 z-50 max-w-xs sm:max-w-sm w-[calc(100vw-3rem)] sm:w-80 bg-white shadow-2xl border border-gray-200 rounded-xl p-4 transition-all duration-300"
            aria-label="추천 글"
            style={{ animation: 'scroll-suggestion-in 0.3s ease-out' }}
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">같이 보면 좋은 글</h3>
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="닫기"
                    className="text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1 p-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            <ul className="space-y-2">
                {items.map((p) => (
                    <li key={p.slug}>
                        <Link
                            href={`/blog/${p.slug}/`}
                            className="block text-sm text-gray-700 hover:text-primary-600 hover:underline leading-snug line-clamp-2"
                        >
                            {p.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
