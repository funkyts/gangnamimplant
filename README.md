# Gangnamimplant Blog Automation System

AI-powered SEO blog automation system for gangnamimplant.com using Next.js 14, Claude Sonnet 4, and Together AI.

## Features

- 🤖 Automated blog post generation with Claude Sonnet 4
- 🎨 AI-generated images with Together AI Flux
- 📝 SEO-optimized MDX content (1,500+ characters)
- 🔍 Category filtering and search
- 📱 Responsive design with Tailwind CSS
- ⚡ Static site generation for optimal performance
- 🕒 Vercel Cron for daily automated publishing
- 🎯 50 pre-defined blog topics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Content**: MDX
- **AI APIs**:
  - Claude Sonnet 4 (content generation)
  - Together AI Flux (image generation)
- **Deployment**: Vercel
- **Image Optimization**: Sharp

## Project Structure

```
gangnamimplant-blog/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage (blog list)
│   ├── blog/[slug]/       # Blog post detail pages
│   ├── about/             # About page
│   └── api/cron/          # Vercel Cron endpoints
├── components/            # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   └── TableOfContents.tsx
├── lib/                   # Core utilities
│   ├── posts.ts          # MDX file management
│   ├── claude-generator.ts  # Claude API integration
│   ├── image-generator.ts   # Together AI integration
│   └── auto-generator.ts    # Automation orchestrator
├── content/
│   ├── blog-topics.json  # 50 blog topics
│   └── blog/             # Generated MDX files
├── prompts/
│   └── seo-writing-rules.md  # SEO guidelines
├── scripts/
│   └── generate-daily.ts # Manual generation script
└── public/images/blog/   # Generated images
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys:
  - Anthropic API key (Claude)
  - Together AI API key

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.local.example` to `.env.local` and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
TOGETHER_API_KEY=your-together-key-here
CRON_SECRET=your-random-secret-string
NEXT_PUBLIC_SITE_URL=https://gangnamimplant.com
```

3. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Usage

### Manual Post Generation

Generate blog posts locally:

```bash
# Generate 10 posts (default)
npm run generate

# Generate specific number of posts
npm run generate 5
```

This will:
1. Select unpublished topics from `content/blog-topics.json`
2. Generate 3 images per post using Together AI
3. Generate SEO-optimized content using Claude
4. Save MDX files to `content/blog/`
5. Update `blog-topics.json` with published status

### Automated Daily Publishing

Vercel Cron automatically generates 10 posts daily at 9:00 AM KST.

Configure in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/generate-posts",
    "schedule": "0 9 * * *"
  }]
}
```

## Content Structure

### Blog Topics

`content/blog-topics.json` contains 50 pre-defined topics:

```json
{
  "id": 1,
  "target_keyword": "임플란트 1개 가격",
  "title": "2025년 강남 임플란트 1개 가격 총정리",
  "category": "임플란트 가격",
  "published": false,
  "slug": null
}
```

### MDX Frontmatter

Generated posts include:

```yaml
---
title: "2025년 강남 임플란트 1개 가격 총정리"
description: "강남 임플란트 가격을 병원별로 비교하고..."
keywords: "임플란트 가격, 강남 임플란트"
category: "임플란트 가격"
publishedAt: "2025-02-14T09:00:00.000Z"
featuredImage: "/images/blog/implant-price-123.webp"
author: "강남임플란트치과"
---
```

## SEO Features

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags
- ✅ Canonical URLs
- ✅ JSON-LD schema markup (BlogPosting, FAQPage)
- ✅ Sitemap.xml (auto-generated)
- ✅ Robots.txt
- ✅ Alt text for all images
- ✅ WebP image optimization
- ✅ Lazy loading

## Deployment

### Deploy to Vercel

1. Push code to GitHub

2. Import repository in Vercel

3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `TOGETHER_API_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_SITE_URL`

4. Deploy!

### Custom Domain

Configure your domain (gangnamimplant.com) in Vercel:

1. Add domain in Vercel project settings
2. Update DNS records to point to Vercel
3. Optionally use Cloudflare for CDN

## API Cost Estimation

For 50 blog posts:

- **Claude API**: ~$1.00
- **Together AI**: ~$0.30
- **Total**: ~$1.30

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## Troubleshooting

### Images not generating

- Check `TOGETHER_API_KEY` is valid
- Verify API quota/credits
- Check network connectivity

### Posts not generating

- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota
- Review logs for errors

### Cron not running

- Ensure `CRON_SECRET` matches in Vercel
- Check Vercel Cron logs in dashboard
- Verify cron schedule syntax

## License

All rights reserved © 2025 강남임플란트치과

## Support

For issues or questions:

- Email: contact@gangnamimplant.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
