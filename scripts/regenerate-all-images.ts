import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';
import { generateDentalImage } from '../lib/image-generator';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const CONTENT_DIR = path.join(process.cwd(), 'content/blog');

async function main() {
    console.log('🚀 Starting bulk image regeneration...');

    // 1. Get all markdown files
    const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.mdx'));
    console.log(`📋 Found ${files.length} posts to process.`);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const { data, content } = matter(fileContent);

        console.log(`\n[${i + 1}/${files.length}] Processing: ${file}`);

        // Extract slug from filename for safe English filename
        let slug = '';

        // Try to parse date-index-slug format or date-slug format
        // Example: 2026-02-15-01-my-slug.mdx
        const slugMatch = file.match(/^\d{4}-\d{2}-\d{2}-\d{2}-(.*)\.mdx$/);
        const simpleMatch = file.match(/^\d{4}-\d{2}-\d{2}-(.*)\.mdx$/); // Standard date-slug

        if (slugMatch && slugMatch[1]) {
            slug = slugMatch[1];
        } else if (simpleMatch && simpleMatch[1]) {
            slug = simpleMatch[1];
        } else {
            // Fallback: simple text replacement on filename
            slug = file.replace('.mdx', '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        }

        // If slug is still empty or looks weird, use "post-{index}"
        if (!slug || slug.length < 3) {
            slug = `post-${i}`;
        }

        console.log(`   Slug derived: ${slug}`);
        console.log(`   Title: ${data.title}`);

        try {
            // Generate NEW unique image
            const imageUrl = await generateDentalImage(data.title || 'Dental Implant', 0, slug);

            // Update Frontmatter
            data.featuredImage = imageUrl;

            // Simple replace of the first markdown image if it exists
            // Or just append if we want... but replacing the first image is safer to fix broken ones.
            // We'll search for regex like `![.*](.*)` and replace the first occurrence? 
            // Better constraint: Replace typical "featured" style image at top.
            // But user said "Duplicate images".

            // Strategy: Update frontmatter is key. 
            // For content, let's find the FIRST image logic `![.*](/images/.*)` and replace it.
            let newContent = content;
            const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
            const match = newContent.match(imageRegex);

            if (match) {
                console.log(`   Replacing existing image: ${match[2]} -> ${imageUrl}`);
                newContent = newContent.replace(match[0], `![${match[1]}](${imageUrl})`);
            } else {
                console.log(`   No inline image found to replace. Appending to top.`);
                // Optionally append? Or just leave it. The User specifically mentioned broken images.
                // If no image is in body, maybe add one?
                // Let's stick to replacing if exists, otherwise rely on Featured Image (which is supported by page.tsx).
            }

            // Reconstruct file
            const newFileContent = matter.stringify(newContent, data);
            fs.writeFileSync(filePath, newFileContent, 'utf-8');
            console.log(`✅ Updated ${file}`);

            // Rate limiting pause
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ Failed to process ${file}:`, error);
        }
    }

    console.log('\n✨ All done!');
}

main().catch(console.error);
