import { generateBlogPost } from '../lib/claude-generator';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testBlogGeneration() {
    console.log('🧪 Testing blog post generation with improved settings...\n');

    const testTopic = {
        id: 1,
        target_keyword: '임플란트 1개 가격',
        title: '임플란트 1개 가격 완벽 가이드 - 브랜드별 비교 분석',
        category: '임플란트-비용',
        search_intent: '임플란트 1개 시술 시 발생하는 비용을 브랜드별, 종류별로 상세히 알고 싶어하는 검색 의도',
    };

    const imageUrls = [
        '/images/implant-price-guide.jpg',
        '/images/brand-comparison.jpg',
    ];

    try {
        const startTime = Date.now();
        console.log('📝 Generating blog post...');

        const content = await generateBlogPost({
            topic: testTopic,
            imageUrls,
            relatedPosts: [],
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Content generated in ${duration} seconds`);
        console.log(`📊 Content length: ${content.length} characters`);

        // Analyze content
        const hasTable = content.includes('|');
        const hasFAQ = content.includes('FAQ') || content.includes('자주 묻는 질문');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

        console.log('\n📋 Content Analysis:');
        console.log(`  - Has frontmatter: ${!!frontmatterMatch}`);
        console.log(`  - Has tables: ${hasTable}`);
        console.log(`  - Has FAQ section: ${hasFAQ}`);
        console.log(`  - Character count: ${content.length}`);
        console.log(`  - Estimated Korean characters: ~${Math.floor(content.length / 2.5)}`);

        // Check if content is complete (not truncated)
        const lastLines = content.split('\n').slice(-5).join('\n');
        const seemsComplete = !lastLines.includes('...');
        console.log(`  - Appears complete: ${seemsComplete}`);

        // Save test output
        const testOutputPath = path.join(process.cwd(), 'test-output.mdx');
        fs.writeFileSync(testOutputPath, content, 'utf-8');
        console.log(`\n💾 Test output saved to: ${testOutputPath}`);

        // Display first and last 300 chars
        console.log('\n📄 Content Preview (first 300 chars):');
        console.log(content.substring(0, 300));
        console.log('\n📄 Content Preview (last 300 chars):');
        console.log(content.substring(content.length - 300));

    } catch (error) {
        console.error('❌ Error generating blog post:', error);
        process.exit(1);
    }
}

testBlogGeneration();
