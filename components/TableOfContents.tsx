'use client';

import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        // Extract headings from content
        const regex = /^(##|###)\s+(.+)$/gm;
        const extractedHeadings: Heading[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9가-힣-]/g, '');

            extractedHeadings.push({ id, text, level });
        }

        setHeadings(extractedHeadings);
    }, [content]);

    useEffect(() => {
        // Track scroll position and update active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-80px 0px -80% 0px' }
        );

        // Observe all headings
        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) {
        return null;
    }

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Header height
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    return (
        <nav className="hidden lg:block sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">목차</h2>
                <ul className="space-y-2 text-sm">
                    {headings.map(({ id, text, level }) => (
                        <li key={id} className={level === 3 ? 'ml-4' : ''}>
                            <button
                                onClick={() => handleClick(id)}
                                className={`text-left w-full py-1 hover:text-primary-600 transition-colors ${activeId === id
                                        ? 'text-primary-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                            >
                                {text}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
