
import { getSortedPosts } from '@/lib/posts';

export async function GET() {
    const allPosts = getSortedPosts();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gangnamimplant.com';

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
        <title>강남임플란트 - 임플란트 전문 정보</title>
        <description>임플란트 가격, 시술, 후기, 보험 등 유용한 치과 정보를 제공하는 전문 블로그입니다.</description>
        <link>${siteUrl}</link>
        <language>ko-KR</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${allPosts
            .map((post) => {
                return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.description}]]></description>
            <link>${siteUrl}/blog/${post.slug}</link>
            <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
            <category><![CDATA[${post.category}]]></category>
            <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        </item>`;
            })
            .join('')}
    </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
        },
    });
}
