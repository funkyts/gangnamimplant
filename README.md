# 강남임플란트 정보 (gangnamimplant.com)

라이브치과병원이 운영하는 임플란트 정보 사이트. Next.js 14 + MDX + Vercel.

> **사이트 정체성**: 라이브치과병원이 운영하는 임플란트 정보 사이트입니다. 의료기관이 아니며, 임플란트 가격·시술·관리·보험 등에 대한 일반적인 정보를 의료진 감수를 거쳐 제공합니다.

---

## 룰북

모든 글 작성·검수·코드 패치는 [상위 폴더의 `_rules/`](../_rules/) 13개 룰북을 따른다. 인덱스: [../CLAUDE.md](../CLAUDE.md).

### 룰북 카테고리
- **정체성·신뢰** — `01-POSITIONING`, `02-YMYL_TRUST`, `03-MEDICAL_AD_LAW`
- **글 작성** — `04-WRITING_RULES`, `11-KEYWORD_RESEARCH`, `12-DWELL_TIME_WRITING`
- **기술 SEO** — `05-SCHEMA_RULES`, `06-SLUG_URL_RULES`, `10-SEO_DEEP_DIVE`
- **자산·링크** — `07-IMAGE_RULES`, `08-INTERNAL_LINK_RULES`
- **검수** — `09-REVIEW_CHECKLIST` (자동 lint), `13-CONTENT_REVIEW` (정성)

---

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Content**: MDX
- **AI**:
  - Claude Sonnet 4 (글 생성)
  - Together AI Flux (이미지 생성)
- **Deployment**: Vercel + Cloudflare
- **Domain**: gangnamimplant.com (운영 주체: 라이브치과병원)

## 디렉토리 구조

```
gangnamimplant-blog/
├── app/                          # Next.js app router
│   ├── layout.tsx               # 전역 Org/WebSite JSON-LD, OG, Twitter, 인증 토큰
│   ├── page.tsx                 # 홈
│   ├── about/                   # 사이트 소개 (정체성·NAP·감수자·sameAs)
│   ├── contact/                 # 정보 문의(A) / 상담 안내(B) 분리
│   ├── blog/[slug]/             # 블로그 글 (MedicalWebPage + Article + Breadcrumb + FAQPage)
│   ├── blog/category/[slug]/    # 카테고리 hub (CollectionPage)
│   ├── sitemap.ts               # 카테고리 hub + 이미지 어노테이션 포함
│   ├── robots.ts                # robots.txt
│   ├── rss/                     # RSS feed
│   └── api/cron/                # Vercel Cron (일일 자동 발행)
├── components/
│   ├── Header.tsx, Footer.tsx, PostCard.tsx
│   ├── TableOfContents.tsx
│   ├── MedicalReviewerBox.tsx  # 감수자 (최정우 원장) 자동 박스
│   └── MedicalDisclaimer.tsx   # 의학 정보 면책 자동
├── lib/
│   ├── site-config.ts          # SITE/OPERATOR/REVIEWER/SAME_AS/BRANCHES/OPENING_HOURS
│   ├── schema.ts               # Dentist + MedicalWebPage + Article JSON-LD 생성
│   ├── posts.ts                # MDX 파싱 + frontmatter
│   ├── claude-generator.ts     # 자동 발행 (룰북 호환)
│   └── image-generator.ts      # Together AI 이미지
├── content/
│   ├── blog/                   # 48개 글 (영문 슬러그)
│   └── blog/_backup_pre_migrate/  # 마이그레이션 전 원본 53개
├── prompts/
│   └── seo-writing-rules.md    # 룰북 압축본 (Claude 생성용)
├── scripts/
│   ├── lint_post.py            # 자동 lint (16개 checker)
│   ├── migrate_posts.py        # 일괄 마이그레이션
│   └── redirects.generated.json  # 53건 301 매핑
└── public/images/              # 로고 + OG 기본 + 블로그 이미지
```

---

## 시작

### Prerequisites
- Node.js 18+
- Python 3.10+ (lint/migrate 용)
- PyYAML (`pip install pyyaml`)
- API 키: Anthropic, Together AI

### Install

```bash
npm install
cp .env.local.example .env.local
# .env.local 의 ANTHROPIC_API_KEY, TOGETHER_API_KEY, NAP 환경변수 채우기
```

### Dev

```bash
npm run dev    # http://localhost:3000
```

### Build

```bash
npm run build  # SSG 빌드 (모든 글 + 카테고리 hub)
npm start      # production 서버
```

---

## 새 글 작성 (13단계)

1. **키워드 발굴** + 검색 의도 결정 → [`11-KEYWORD_RESEARCH.md`](../_rules/11-KEYWORD_RESEARCH.md) + [`10 §1`](../_rules/10-SEO_DEEP_DIVE.md)
2. **SERP 경쟁 분석** 10분 → [`11 §5`](../_rules/11-KEYWORD_RESEARCH.md)
3. **페이지 유형** 결정 (pillar/cluster/longtail) → [`04 §1`](../_rules/04-WRITING_RULES.md)
4. **영문 슬러그** → [`06`](../_rules/06-SLUG_URL_RULES.md)
5. **frontmatter** (reviewer/lastReviewed/searchIntent/keywords 포함) → [`04 §2`](../_rules/04-WRITING_RULES.md)
6. **본문 + Hook + 단락 미끼** → [`12 §2~6`](../_rules/12-DWELL_TIME_WRITING.md) + [`03`](../_rules/03-MEDICAL_AD_LAW.md) + [`08`](../_rules/08-INTERNAL_LINK_RULES.md)
7. **키워드 12위치 배치** 확인 → [`10 §2`](../_rules/10-SEO_DEEP_DIVE.md)
8. **References 섹션** (정부/학회 1순위 출처 1개+) → [`02 §3`](../_rules/02-YMYL_TRUST_RULES.md)
9. **이미지 + alt/캡션** → [`07`](../_rules/07-IMAGE_RULES.md)
10. **자동 lint** — `python scripts/lint_post.py content/blog/<file>.mdx`
11. **정성 5단계 검수** → [`13`](../_rules/13-CONTENT_REVIEW.md)
12. **빌드** — `npm run build`
13. **발행** + GSC/Naver SC 인덱싱 요청

> 감수자 박스 (`<MedicalReviewerBox>`) + 의학 면책 (`<MedicalDisclaimer>`) 은 [app/blog/[slug]/page.tsx](app/blog/%5Bslug%5D/page.tsx) 가 자동 삽입. MDX 본문에 박지 마세요.

## 자동 발행

```bash
npm run generate     # 10개 자동 생성 (수동 트리거)
# Vercel Cron: 매일 09:00 KST → /api/cron/generate-posts
```

## 검수 / lint

```bash
# 단일 글
python scripts/lint_post.py content/blog/<file>.mdx

# 전체 (JSON)
python scripts/lint_post.py --json content/blog/*.mdx

# References URL HTTP 200 확인 (느림)
python scripts/lint_post.py --check-urls content/blog/<file>.mdx
```

BLOCKING > 0 → exit 1 (발행 차단). 자세한 코드는 [`_rules/09 §3`](../_rules/09-REVIEW_CHECKLIST.md).

## SEO 검증 (배포 전후)

1. [Google Rich Results Test](https://search.google.com/test/rich-results) — 홈 + 글 1편 (`MedicalWebPage`, `FAQPage` 통과)
2. [Schema Markup Validator](https://validator.schema.org/) — 에러 0
3. [PageSpeed Insights](https://pagespeed.web.dev/) — LCP < 2.5s, CLS < 0.1
4. Google Search Console — sitemap 등록, 인덱싱 추이
5. Naver Search Advisor — sitemap 등록

## 환경 변수

```bash
# 외부 API
ANTHROPIC_API_KEY=
TOGETHER_API_KEY=
CRON_SECRET=

# 사이트
NEXT_PUBLIC_SITE_URL=https://gangnamimplant.com

# 운영 주체 (라이브치과병원) — site-config.ts 기본값에 NAP 박혀있음, env 로 override 가능
NEXT_PUBLIC_OPERATOR_URL=https://livedentalcenter.com
NEXT_PUBLIC_OPERATOR_TEL=1599-2275
NEXT_PUBLIC_OPERATOR_BIZ_REG=120-12-10090
NEXT_PUBLIC_OPERATOR_STREET=논현로105길 48 라이브빌딩 1, 2층
NEXT_PUBLIC_OPERATOR_MED_LIC=   # 의료기관 등록번호 (있으면 입력)

# 감수자 (최정우 원장)
NEXT_PUBLIC_REVIEWER_URL=https://livedentalcenter.com/about/
```

## 라이브치과 그룹 entity 구조

```
liveliveh.com           (브랜드 본진)
    │
    ├─── livedentalcenter.com   (공식 홈페이지)
    │
    └─── gangnamimplant.com     (강남 임플란트 위성 정보지, 본 사이트)
```

세 도메인 NAP 글자 단위 일치 + `sameAs` schema 상호 참조 → entity association.

## 라이선스

운영: 라이브치과병원 © 2026
