import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface Post {
    slug: string;
    title: string;
    description: string;
    keywords: string;
    category: string;
    publishedAt: string;
    featuredImage: string;
    author: string;
    content: string;
}

/**
 * Get all published blog posts
 */
export function getAllPosts(): Post[] {
    // Ensure directory exists
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPosts = fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => {
            const slug = fileName.replace(/\.mdx$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);

            return {
                slug,
                title: data.title || '',
                description: data.description || '',
                keywords: data.keywords || '',
                category: data.category || '',
                publishedAt: data.publishedAt || '',
                featuredImage: data.featuredImage || '',
                author: data.author || '강남임플란트치과',
                content,
            };
        });

    return allPosts;
}

/**
 * Get sorted posts by publication date (newest first)
 */
export function getSortedPosts(): Post[] {
    const posts = getAllPosts();
    return posts.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
    });
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): Post | null {
    try {
        // Decode URL-encoded slug (e.g., %EC%9E%84 to 임)
        const decodedSlug = decodeURIComponent(slug);

        const fullPath = path.join(postsDirectory, `${decodedSlug}.mdx`);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.log(`Post not found: ${decodedSlug}.mdx`);
            console.log(`Looking in: ${postsDirectory}`);
            console.log(`Full path: ${fullPath}`);
            return null;
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug: decodedSlug,
            title: data.title || '',
            description: data.description || '',
            keywords: data.keywords || '',
            category: data.category || '',
            publishedAt: data.publishedAt || '',
            featuredImage: data.featuredImage || '',
            author: data.author || '강남임플란트치과',
            content,
        };
    } catch (error) {
        console.error('Error in getPostBySlug:', error);
        return null;
    }
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): Post[] {
    const posts = getAllPosts();
    return posts.filter((post) => post.category === category);
}

/**
 * Get related posts (same category, excluding current post)
 */
export function getRelatedPosts(currentSlug: string, category: string, limit: number = 3): Post[] {
    const posts = getPostsByCategory(category);
    return posts
        .filter((post) => post.slug !== currentSlug)
        .slice(0, limit);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
    const posts = getAllPosts();
    const categories = posts.map((post) => post.category);
    return Array.from(new Set(categories));
}

/**
 * Get all post slugs for static generation
 */
export function getAllPostSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter((fileName) => fileName.endsWith('.mdx'))
        .map((fileName) => fileName.replace(/\.mdx$/, ''));
}
