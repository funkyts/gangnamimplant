import fs from 'fs';
import path from 'path';
import { generatePostImages } from './image-generator';
import { generateBlogPost, saveMdxFile, generateSlug } from './claude-generator';
import { getAllPosts } from './posts';
import { indexUrl } from './google-indexing';

interface Topic {
    id: number;
    target_keyword: string;
    search_volume: string;
    seo_difficulty: string;
    title: string;
    search_intent: string;
    category: string;
    published: boolean;
    scheduled_date: string | null;
    slug: string | null;
}

/**
 * Load blog topics from JSON file
 */
function loadTopics(): Topic[] {
    const topicsPath = path.join(process.cwd(), 'content/blog-topics.json');
    const data = fs.readFileSync(topicsPath, 'utf-8');
    return JSON.parse(data);
}

/**
 * Save updated topics to JSON file
 */
function saveTopics(topics: Topic[]): void {
    const topicsPath = path.join(process.cwd(), 'content/blog-topics.json');
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2), 'utf-8');
}

/**
 * Get unpublished topics
 */
export function getUnpublishedTopics(limit: number = 10): Topic[] {
    const topics = loadTopics();
    return topics.filter((topic) => !topic.published).slice(0, limit);
}

/**
 * Generate a single blog post with images
 */
export async function generateSinglePost(topic: Topic): Promise<void> {
    try {
        console.log(`\n📝 Generating post: ${topic.title}`);
        console.log(`   Keyword: ${topic.target_keyword}`);

        // Step 1: Generate images
        console.log('\n🎨 Step 1: Generating images...');
        const imageUrls = await generatePostImages(topic.target_keyword, 3);

        if (imageUrls.length === 0) {
            throw new Error('Failed to generate any images');
        }

        console.log(`✅ Generated ${imageUrls.length} images`);

        // Step 2: Generate content with Claude
        console.log('\n✍️  Step 2: Generating content with Claude...');

        // Verify getAllPosts works, otherwise use empty array
        let relatedPostsFormatted: string[] = [];
        try {
            const allPosts = getAllPosts();
            relatedPostsFormatted = allPosts
                .filter(p => p.category === topic.category) // Same category
                .slice(0, 5) // Top 5
                .map(p => `- [${p.title}](/blog/${p.slug})`);

            // If not enough same category, add recent posts
            if (relatedPostsFormatted.length < 3) {
                const recentPosts = allPosts
                    .slice(0, 3)
                    .map(p => `- [${p.title}](/blog/${p.slug})`);
                relatedPostsFormatted = [...new Set([...relatedPostsFormatted, ...recentPosts])];
            }
        } catch (e) {
            console.warn('Failed to fetch related posts, proceeding without internal links:', e);
        }

        const content = await generateBlogPost({
            topic: {
                id: topic.id,
                target_keyword: topic.target_keyword,
                title: topic.title,
                category: topic.category,
                search_intent: topic.search_intent,
            },
            imageUrls,
            relatedPosts: relatedPostsFormatted,
        });

        console.log(`✅ Generated ${content.length} characters`);

        // Step 3: Save MDX file
        console.log('\n💾 Step 3: Saving MDX file...');
        const slug = generateSlug(topic.target_keyword, topic.id);
        saveMdxFile(slug, content);

        // Step 4: Update topics.json
        console.log('\n📋 Step 4: Updating blog-topics.json...');
        const topics = loadTopics();
        const topicIndex = topics.findIndex((t) => t.id === topic.id);
        if (topicIndex !== -1) {
            topics[topicIndex].published = true;
            topics[topicIndex].slug = slug;
            topics[topicIndex].scheduled_date = new Date().toISOString();
            saveTopics(topics);
        }

        console.log(`\n✅ Successfully generated post: ${slug}\n`);

        // Step 5: Index URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gangnamimplant.com';
        const postUrl = `${siteUrl}/blog/${slug}`;
        console.log(`\n🔍 Step 5: Indexing URL: ${postUrl}...`);
        try {
            await indexUrl(postUrl);
        } catch (error) {
            console.error('⚠️ Indexing failed, but post was generated successfully.');
        }
    } catch (error) {
        console.error(`\n❌ Error generating post for topic ${topic.id}:`, error);
        throw error;
    }
}

/**
 * Generate multiple blog posts
 */
export async function generateMultiplePosts(count: number = 10): Promise<{
    success: number;
    failed: number;
    errors: Array<{ topic: string; error: string }>;
}> {
    const unpublished = getUnpublishedTopics(count);

    console.log(`\n🚀 Starting batch generation of ${unpublished.length} posts...\n`);

    let success = 0;
    let failed = 0;
    const errors: Array<{ topic: string; error: string }> = [];

    for (const topic of unpublished) {
        try {
            await generateSinglePost(topic);
            success++;
        } catch (error) {
            failed++;
            errors.push({
                topic: topic.title,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log('\n📊 Batch Generation Summary:');
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(({ topic, error }) => {
            console.log(`   - ${topic}: ${error}`);
        });
    }

    return { success, failed, errors };
}
