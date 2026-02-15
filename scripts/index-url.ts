#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { indexUrl } from '../lib/google-indexing';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('Please provide a URL to index.');
        console.error('Usage: tsx scripts/index-url.ts <url>');
        process.exit(1);
    }

    console.log(`🚀 Requesting indexing for: ${url}`);

    try {
        await indexUrl(url);
        console.log('✅ Indexing request submitted successfully!');
    } catch (error) {
        console.error('❌ Indexing request failed.');
        process.exit(1);
    }
}

main();
