import type { MetadataRoute } from 'next';
import { getAllPostSlugs, getPostBySlug, getAllCategories } from '@/lib/posts';
import { SITE, getCategorySlug } from '@/lib/site-config';

function absUrl(maybeRelative: string): string {
    if (!maybeRelative) return SITE.url;
    if (maybeRelative.startsWith('http')) return maybeRelative;
    return `${SITE.url}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const postSlugs = getAllPostSlugs();

    const posts: MetadataRoute.Sitemap = postSlugs.map((slug) => {
        const post = getPostBySlug(slug);
        const lastMod = post?.dateModified || post?.publishedAt || new Date().toISOString();
        const entry: MetadataRoute.Sitemap[number] = {
            url: `${SITE.url}/blog/${slug}/`,
            lastModified: lastMod,
        };
        if (post?.featuredImage) {
            (entry as Record<string, unknown>).images = [absUrl(post.featuredImage)];
        }
        return entry;
    });

    const staticRoutes: MetadataRoute.Sitemap = ['', '/about/', '/contact/'].map((route) => ({
        url: `${SITE.url}${route}`,
        lastModified: new Date().toISOString(),
    }));

    const categories = getAllCategories();
    const categoryHubs: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${SITE.url}/blog/category/${getCategorySlug(cat)}/`,
        lastModified: new Date().toISOString(),
    }));

    return [...staticRoutes, ...categoryHubs, ...posts];
}
