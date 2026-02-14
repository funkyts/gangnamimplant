import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONTENT_DIR = path.join(process.cwd(), 'content/blog');
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is missing in .env.local');
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: API_KEY,
});

async function completeContent(title: string, currentContent: string): Promise<string | null> {
    try {
        const prompt = `
당신은 블로그 글 작성을 돕는 전문 에디터입니다.
아래는 작성 중인 블로그 글의 내용입니다. 하지만 글이 작성 도중 끊겨있습니다.
문맥을 파악하여 끊긴 부분을 자연스럽게 이어서 작성하고, 글을 "결론" 또는 "마무리" 섹션으로 완성해주세요.

## 작성 규칙
1. **끊긴 부분 연결**: 끊긴 문장을 자연스럽게 완성하거나, 문맥상 필요한 내용을 보충하세요.
2. **어조 유지**: 기존 글의 톤앤매너(전문적이면서도 친절한 해요체)를 유지하세요.
3. **결론 포함**: 글의 주제를 요약하고 마무리하는 결론 섹션을 반드시 포함하세요.
4. **마크다운 형식**: 기존 글과 동일한 마크다운 형식을 사용하세요.
5. **출력**: 오직 **추가될 내용만** 출력하세요. 기존 내용을 반복하지 마세요.

## 글 정보
- 제목: ${title}

## 현재 내용 (마지막 2000자)
${currentContent.slice(-2000)}

---
위 내용을 이어서 글을 완성해주세요.
`;

        const response = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const textResponse = response.content[0].type === 'text' ? response.content[0].text : '';
        return textResponse;

    } catch (error) {
        console.error(`Error completing content for ${title}:`, error);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting blog post completion...');

    const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.mdx'));
    console.log(`📋 Found ${files.length} posts to check.`);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const { data, content } = matter(fileContent);

        // Simple heuristic to detect truncation:
        // 1. Doesn't have "마무리" or "결론" header near the end?
        // 2. Ends with incomplete sentence (no punctuation)?

        const lastChar = content.trim().slice(-1);
        const hasPunctuation = ['.', '!', '?', '다', '요'].includes(lastChar) || lastChar === '>' || lastChar === ')'; // Link/Image end

        // Also check keywords
        const hasConclusion = content.includes('## 마무리') || content.includes('## 결론') || content.includes('## 요약');

        // Let's rely on punctuation or length logic. 
        // Actually, many of these seem to cut off mid-sentence.

        const isSuspicious = !hasPunctuation || !hasConclusion;

        if (isSuspicious) {
            console.log(`\n[${i + 1}/${files.length}] ⚠️  Potential truncation detected: ${file}`);
            console.log(`   Last content: "...${content.trim().slice(-50)}"`);

            console.log(`   Generating completion...`);
            const additionalContent = await completeContent(data.title, content);

            if (additionalContent) {
                const newContent = content + '\n' + additionalContent;
                const newFileContent = matter.stringify(newContent, data);
                fs.writeFileSync(filePath, newFileContent, 'utf-8');
                console.log(`✅ Completed ${file}`);
            } else {
                console.log(`❌ Failed to complete ${file}`);
            }

            // Rate limiting pause
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log(`[${i + 1}/${files.length}] ✅ Seems complete: ${file}`);
        }
    }

    console.log('\n✨ All done!');
}

main().catch(console.error);
