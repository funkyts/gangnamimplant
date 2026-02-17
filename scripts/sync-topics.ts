
import fs from 'fs';
import path from 'path';

// Define Topic interface locally to avoid import issues if not exported
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

const TOPICS_PATH = path.join(process.cwd(), 'content/blog-topics.json');
const BLOG_DIR = path.join(process.cwd(), 'content/blog');

function syncTopics() {
    console.log('🔄 Syncing blog topics with file system...');

    if (!fs.existsSync(TOPICS_PATH)) {
        console.error('❌ blog-topics.json not found');
        return;
    }

    const topics: Topic[] = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf-8'));

    // Get all MDX files in content/blog
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
    console.log(`📂 Found ${files.length} existing blog posts.`);

    let updatedCount = 0;

    // Create a map of normalized titles/keywords to check against
    // Or simpler: check if any file contains the topic keyword in its filename
    // ACTUALLY: The best way is to check if topic.slug exists as a file
    // But slug format changed.
    // Old format: {id}-{keyword}.mdx or {date}-{id}-{keyword}.mdx
    // New format: {keyword}.mdx

    topics.forEach(topic => {
        if (topic.published) return; // Already marked

        // Check if a file matches this topic
        // We look for files that contain the keyword in their name (normalized)
        const normalizedKeyword = topic.target_keyword.replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');

        const matchingFile = files.find(file => {
            return file.includes(normalizedKeyword);
        });

        if (matchingFile) {
            console.log(`✅ Found existing file for topic "${topic.target_keyword}": ${matchingFile}`);
            topic.published = true;
            topic.slug = matchingFile.replace('.mdx', ''); // Use the actual filename as slug
            topic.scheduled_date = new Date().toISOString(); // Just mark as done now
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        fs.writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2), 'utf-8');
        console.log(`💾 Updated ${updatedCount} topics in blog-topics.json`);
    } else {
        console.log('✨ No updates needed.');
    }
}

syncTopics();
