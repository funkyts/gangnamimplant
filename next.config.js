/** @type {import('next').NextConfig} */
const generatedRedirects = require('./scripts/redirects.generated.json');

const nextConfig = {
    trailingSlash: true,
    images: {
        formats: ['image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    async redirects() {
        // _rules/06-SLUG_URL_RULES.md §4 — 한글 슬러그 → 영문 슬러그 301 매핑
        // 매핑은 scripts/redirects.generated.json (migrate_posts.py 산출)
        return generatedRedirects;
    },
};

module.exports = nextConfig;
