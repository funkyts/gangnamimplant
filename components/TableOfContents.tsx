'use client';

import { useEffect, useState } from 'react';
import type { TocHeading } from '@/lib/toc';

interface TableOfContentsProps {
    headings: TocHeading[];
    /** mobile: 본문 위 접이식(lg 미만에서만), desktop: 오른쪽 고정(lg 이상에서만) */
    variant: 'mobile' | 'desktop';
}

function scrollToId(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    const offset = 80; // Header height
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${encodeURIComponent(id)}`);
}

export default function TableOfContents({ headings, variant }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        if (variant !== 'desktop') return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                });
            },
            { rootMargin: '-80px 0px -80% 0px' }
        );
        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [headings, variant]);

    if (headings.length === 0) return null;

    const list = (tap: boolean) => (
        <ul className={tap ? 'space-y-1 text-base' : 'space-y-2 text-sm'}>
            {headings.map(({ id, text, level }) => (
                <li key={id} className={level === 3 ? 'ml-4' : ''}>
                    <a
                        href={`#${id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId(id);
                        }}
                        className={`block ${tap ? 'py-2.5 min-h-[44px]' : 'py-1'} hover:text-primary-600 transition-colors ${
                            activeId === id ? 'text-primary-600 font-medium' : 'text-gray-600'
                        }`}
                    >
                        {text}
                    </a>
                </li>
            ))}
        </ul>
    );

    if (variant === 'mobile') {
        return (
            <nav className="lg:hidden mb-8" aria-label="목차">
                <details className="group bg-white rounded-lg border border-gray-200 shadow-sm">
                    <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3 min-h-[44px] text-base font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden">
                        <span>목차</span>
                        <span className="text-gray-500 text-sm transition-transform group-open:rotate-180" aria-hidden="true">▼</span>
                    </summary>
                    <div className="px-4 pb-4">{list(true)}</div>
                </details>
            </nav>
        );
    }

    return (
        <nav className="hidden lg:block sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto" aria-label="목차">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">목차</h2>
                {list(false)}
            </div>
        </nav>
    );
}
