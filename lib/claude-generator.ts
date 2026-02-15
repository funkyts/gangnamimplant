import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Lazy initialize Anthropic client to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
    if (!anthropicClient) {
        anthropicClient = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    return anthropicClient;
}

interface TopicData {
    id: number;
    target_keyword: string;
    title: string;
    category: string;
    search_intent: string;
}

interface GeneratePostParams {
    topic: TopicData;
    imageUrls: string[];
    relatedPosts?: string[];
}

/**
 * Generate blog post content using Claude API
 */
export async function generateBlogPost(params: GeneratePostParams): Promise<string> {
    const { topic, imageUrls, relatedPosts = [] } = params;

    // Read SEO writing rules
    const seoRulesPath = path.join(process.cwd(), 'prompts/seo-writing-rules.md');
    const seoRules = fs.readFileSync(seoRulesPath, 'utf-8');

    // Read source material (Google Docs content)
    const sourceMaterialPath = path.join(process.cwd(), 'prompts/source-material.md');
    const sourceMaterial = fs.readFileSync(sourceMaterialPath, 'utf-8');

    // Create generation prompt
    const prompt = `당신은 전문 SEO 카피라이터입니다.

# 🎯 이번 글의 단 하나의 주제
**"${topic.target_keyword}"**

검색 의도: ${topic.search_intent}

# 📅 작성 기준 연도: 2026년

**중요**: 모든 내용은 **2026년 기준**으로 작성하세요.
- 가격, 정책, 기술 등을 언급할 때는 "2026년"으로 표기
- "2025년" 또는 과거 연도는 절대 사용하지 마세요
- 예: "2026년 임플란트 가격", "2026년부터 적용되는 정책"

# ⚠️ 절대 엄수: 주제 집중 규칙 (가장 중요!)


이 글은 **오직 "${topic.target_keyword}"에 대해서만** 작성합니다.

## 금지 사항 (절대 포함하지 말 것!)

다음 주제들은 **절대 상세히 다루지 마세요**:
${topic.target_keyword !== '임플란트 29만원' ? '- "29만원 임플란트" 광고나 저가 임플란트 (이건 별도 주제임)' : ''}
${topic.target_keyword !== '오스템 임플란트 가격' && topic.target_keyword !== '임플란트 종류' ? '- 특정 브랜드(오스템,스트라우만 등)의 상세 비교 (이건 별도 주제임)' : ''}
${topic.target_keyword !== '임플란트 보험' && topic.target_keyword !== '건강보험 임플란트' ? '- 건강보험 적용의 상세한 조건과 절차 (이건 별도 주제임)' : ''}
${topic.target_keyword !== '임플란트 뼈이식' && topic.target_keyword !== '뼈이식 임플란트 과정' ? '- 뼈이식의 상세한 과정과 비용 (이건 별도 주제임)' : ''}

## 올바른 작성 방식

❌ 잘못된 예: "임플란트 1개 가격" 주제에서 "29만원 임플란트의 함정"을 H2로 만들어 3-4문단 작성
✅ 올바른 예: "임플란트 1개 가격" 주제에서 "저가 임플란트도 있지만 이 글에서는 일반적인 가격을 다룹니다" 1문장으로 언급만

❌ 잘못된 예: "임플란트 1개 가격" 주제에서 오스템/스트라우만/아스트라의 기술, 등급별 가격을 표로 상세 비교
✅ 올바른 예: "임플란트 1개 가격" 주제에서 "국산은 80-120만원, 수입은 150-250만원 정도입니다" 간단히 정리

❌ 잘못된 예: "임플란트 1개 가격" 주제에서 건강보험 조건, 본인부담금, 적용 방법을 H2로 만들어 상세히 설명
✅ 올바른 예: "임플란트 1개 가격" 주제에서 "65세 이상은 건강보험 혜택으로 더 저렴합니다" 1-2문장만

## 글 구조 제한

- H2 제목: **최대 3개**
- 각 H2는 "${topic.target_keyword}"와 직접 관련된 내용만
- 예시 (주제가 "임플란트 1개 가격"인 경우):
  ✅ H2: 임플란트 1개 가격 결정 요소
  ✅ H2: 지역별 임플란트 가격 차이
  ✅ H2: 합리적인 가격 선택 방법
  ❌ H2: 브랜드별 임플란트 상세 비교 (이건 다른 글 주제)
  ❌ H2: 29만원 임플란트의 진실 (이건 다른 글 주제)

# 📚 참고 자료

아래 자료에서 **"${topic.target_keyword}"와 직접 관련된 정보만** 골라서 사용하세요.
관련 없는 정보는 **무시**하세요.

${sourceMaterial}

---

# 📖 SEO 글쓰기 규칙

${seoRules}

---

# ✍️ 작성 요구사항

1. MDX frontmatter 포함
2. 본문 최소 2,000자 (한글 기준)
3. 메인 키워드 "${topic.target_keyword}" 본문에 5회 이상 자연스럽게 사용
4. H2 제목 최대 3개, H3 적절히 사용
5. FAQ 섹션 필수 (질문 3개, 모두 메인 키워드 직접 관련) -> **반드시 Frontmatter에 \`faq\` 필드로 추가**
6. 볼드(**), 이모지 사용 금지
7. 필요한 경우 간단한 표 사용

## 이미지
${imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

## 🔗 링크 삽입 규칙 (매우 중요)

### 1. 내부 링크 (Internal Links)
아래 목록에 있는 글 중에서, **문맥상 자연스러운 곳에 단 1개만** 골라서 링크를 건다.
절대 "관련글:", "참고하세요:" 처럼 목록으로 나열하지 말고, **문장 속에 자연스럽게 단어에 링크를 걸 것**.

**사용 가능한 내부 링크 목록:**
${relatedPosts.length > 0 ? relatedPosts.join('\n') : '(사용 가능한 내부 링크 없음)'}

### 2. 외부 링크 (External Links)
글의 신뢰도를 높이기 위해 **공신력 있는 공공기관 사이트**로 연결되는 외부 링크를 본문에 1개 이상 자연스럽게 포함한다.
(예: 국가건강정보포털, 건강보험심사평가원, 보건복지부 등 2026년 기준 정책 확인이 가능한 곳)

---

**출력 형식:**

\`\`\`mdx
---
title: "${topic.title}"
description: "[150자 이내, ${topic.target_keyword} 포함 요약]"
keywords: "${topic.target_keyword}, [직접 관련 키워드 2개만]"
category: "${topic.category}"
publishedAt: "${new Date().toISOString()}"
featuredImage: "${imageUrls[0]}"
featuredImage: "${imageUrls[0]}"
author: "강남임플란트치과"
faq:
  - question: "질문 1"
    answer: "답변 1"
  - question: "질문 2"
    answer: "답변 2"
  - question: "질문 3"
    answer: "답변 3"
---

[도입부: ${topic.target_keyword}에 대한 강렬한 질문 3줄]

![alt텍스트](${imageUrls[0]})

## ${topic.target_keyword} + 관련 소주제 1

[내용... 메인 키워드에 집중]

### 세부 내용

[내용...]

## ${topic.target_keyword} + 관련 소주제 2

[내용... 메인 키워드에 집중]

## ${topic.target_keyword} + 관련 소주제 3

[내용... 메인 키워드에 집중]


\`\`\`

**❗ 최종 체크리스트:**
- [ ] 이 글은 "${topic.target_keyword}"에만 집중했는가?
- [ ] 다른 주제를 H2로 만들어 상세히 다루지 않았는가?
- [ ] 모든 H2가 메인 키워드와 직접 관련되어 있는가?

**다시 한 번 강조: 이 글은 "${topic.target_keyword}"에만 집중합니다!**`;

    try {
        const message = await getAnthropic().messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            temperature: 0.5,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        // Extract text content
        const content = message.content
            .filter((block) => block.type === 'text')
            .map((block) => (block as any).text)
            .join('\n');

        // Remove markdown code block wrapper if present
        let mdxContent = content.trim();
        if (mdxContent.startsWith('```mdx')) {
            mdxContent = mdxContent.replace(/^```mdx\n/, '').replace(/\n```$/, '');
        } else if (mdxContent.startsWith('```')) {
            mdxContent = mdxContent.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        return mdxContent;
    } catch (error) {
        console.error('Error generating blog post with Claude:', error);
        throw error;
    }
}

/**
 * Save MDX content to file
 */
export function saveMdxFile(slug: string, content: string): void {
    const blogDir = path.join(process.cwd(), 'content/blog');

    // Ensure directory exists
    if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
    }

    const filePath = path.join(blogDir, `${slug}.mdx`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Saved: ${filePath}`);
}

/**
 * Generate slug from keyword
 */
export function generateSlug(keyword: string, id: number): string {
    const slug = keyword
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9가-힣-]/g, '');
    return `${id}-${slug}`;
}
