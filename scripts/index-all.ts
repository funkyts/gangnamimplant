#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { getAllPosts } from '../lib/posts';
import { indexUrl } from '../lib/google-indexing';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Force production URL if local, or use env var if it's not localhost
const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
const SITE_URL = (envUrl && !envUrl.includes('localhost')) ? envUrl : 'https://gangnamimplant.com';

async function main() {
    console.log('🚀 Starting batch indexing for all blog posts...');

    const posts = getAllPosts();
    console.log(`Found ${posts.length} posts to index.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const post of posts) {
        const url = `${SITE_URL}/blog/${post.slug}`;
        console.log(`Processing: ${post.title}`);

        try {
            await indexUrl(url);
            successCount++;
            // Add a small delay to avoid hitting rate limits too quickly
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to index ${url}`);
            failCount++;
        }
    }

    console.log('\n📊 Indexing Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

main();
