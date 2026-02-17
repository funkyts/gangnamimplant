
import fs from 'fs';
import path from 'path';

// Define Topic interface
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

function resetTopics() {
    console.log('🔄 Resetting blog topics to known good state...');

    if (!fs.existsSync(TOPICS_PATH)) {
        console.error('❌ blog-topics.json not found');
        return;
    }

    const topics: Topic[] = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf-8'));

    let modifiedCount = 0;

    topics.forEach(topic => {
        // User says "29만원", "Osstem" etc (ID 2, 3) are "old".
        // Previous analysis showed posts up to ID 11 "Implant Lifespan" existed.
        // So we mark ID 1 to 11 as Published.

        if (topic.id <= 11) {
            if (!topic.published) {
                console.log(`✅ Marking ID ${topic.id} ("${topic.target_keyword}") as PUBLISHED (Old post)`);
                topic.published = true;
                // Generate a simple slug if missing, to prevent errors
                if (!topic.slug) topic.slug = topic.target_keyword.replace(/\s+/g, '-');
                if (!topic.scheduled_date) topic.scheduled_date = new Date().toISOString();
                modifiedCount++;
            }
        } else {
            // ID 12 and above should be UNPUBLISHED so we can generate them now.
            // This fixes the false positives (ID 41, 42) from previous sync.
            if (topic.published) {
                console.log(`ea Reseting ID ${topic.id} ("${topic.target_keyword}") to UNPUBLISHED (To be generated)`);
                topic.published = false;
                topic.slug = null;
                topic.scheduled_date = null;
                modifiedCount++;
            }
        }
    });

    if (modifiedCount > 0) {
        fs.writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2), 'utf-8');
        console.log(`💾 Updated ${modifiedCount} topics in blog-topics.json`);
    } else {
        console.log('✨ No updates needed.');
    }
}

resetTopics();
