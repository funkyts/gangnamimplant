#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { generateMultiplePosts } from '../lib/auto-generator';

async function main() {
    console.log('🚀 Manual post generation script\n');

    // Get count from command line args
    const count = parseInt(process.argv[2]) || 10;
    console.log(`Generating ${count} posts...\n`);

    const result = await generateMultiplePosts(count);

    console.log('\n✅ Generation complete!');
    console.log(`   Success: ${result.success}`);
    console.log(`   Failed: ${result.failed}`);

    if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(({ topic, error }) => {
            console.log(`   - ${topic}: ${error}`);
        });
        process.exit(1);
    }

    process.exit(0);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
