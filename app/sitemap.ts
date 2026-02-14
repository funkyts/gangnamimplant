import { getAllPostSlugs, getPostBySlug } from '@/lib/posts';

export default async function sitemap() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gangnamimplant.com';

    // Get all blog post slugs
    const postSlugs = getAllPostSlugs();

    // Create blog post entries
    const posts = postSlugs.map((slug) => {
        const post = getPostBySlug(slug);
        return {
            url: `${siteUrl}/blog/${slug}`,
            lastModified: post?.publishedAt || new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    // Static pages
    const routes = ['', '/about'].map((route) => ({
        url: `${siteUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1.0 : 0.5,
    }));

    return [...routes, ...posts];
}
