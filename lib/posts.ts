import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface PostReviewer {
    name: string;
    title: string;
    organization: string;
    url?: string;
}

export interface Post {
    slug: string;
    title: string;
    description: string;
    keywords: string | string[];
    category: string;
    pageType?: 'pillar' | 'cluster' | 'longtail';
    publishedAt: string;
    dateModified?: string;
    lastReviewed?: string;
    featuredImage: string;
    featuredImageAlt?: string;
    author: string;
    reviewer?: PostReviewer;
    pillarSlug?: string;
    content: string;
    faq?: { question: string; answer: string }[];
}

function parsePost(slug: string, fileContents: string): Post {
    const { data, content } = matter(fileContents);

    // publishedAt 폴백: publishedAt > date > '' (_rules/02 §2)
    const publishedAt = data.publishedAt || data.date || '';
    const dateModified = data.dateModified || publishedAt;

    return {
        slug,
        title: data.title || '',
        description: data.description || '',
        keywords: data.keywords || '',
        category: data.category || '',
        pageType: data.pageType,
        publishedAt,
        dateModified,
        lastReviewed: data.lastReviewed,
        featuredImage: data.featuredImage || '',
        featuredImageAlt: data.featuredImageAlt,
        author: data.author || '강남임플란트 정보 편집부',
        reviewer: data.reviewer,
        pillarSlug: data.pillarSlug,
        content,
        faq: data.faq || [],
    };
}

export function getAllPosts(): Post[] {
    if (!fs.existsSync(postsDirectory)) return [];

    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => {
            const slug = fileName.replace(/\.mdx$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            return parsePost(slug, fileContents);
        });
}

export function getSortedPosts(): Post[] {
    const posts = getAllPosts();
    return posts.sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0).getTime();
        const dateB = new Date(b.publishedAt || 0).getTime();
        return dateB - dateA;
    });
}

export function getPostBySlug(slug: string): Post | null {
    try {
        const decodedSlug = decodeURIComponent(slug);
        const fullPath = path.join(postsDirectory, `${decodedSlug}.mdx`);

        if (!fs.existsSync(fullPath)) {
            console.log(`Post not found: ${decodedSlug}.mdx`);
            return null;
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        return parsePost(decodedSlug, fileContents);
    } catch (error) {
        console.error('Error in getPostBySlug:', error);
        return null;
    }
}

export function getPostsByCategory(category: string): Post[] {
    const posts = getAllPosts();
    return posts.filter((post) => post.category === category);
}

/**
 * 관련 글 선정 — _rules/08-INTERNAL_LINK_RULES.md §5
 * 현재 구현: 같은 카테고리 글 중 최신순 (pillar-cluster 로직은 Phase 2)
 */
export function getRelatedPosts(currentSlug: string, category: string, limit: number = 3): Post[] {
    const posts = getPostsByCategory(category);
    return posts
        .filter((post) => post.slug !== currentSlug)
        .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
        .slice(0, limit);
}

export function getAllCategories(): string[] {
    const posts = getAllPosts();
    const categories = posts.map((post) => post.category).filter(Boolean);
    return Array.from(new Set(categories));
}

export function getAllPostSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) return [];
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => fileName.replace(/\.mdx$/, ''));
}
