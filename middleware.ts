/**
 * URL Redirect Middleware
 *
 * next.config.js 의 redirects() 가 한글 source 를 path-to-regexp 로 매칭 못해
 * 옛 한글 슬러그 URL 이 404 반환되는 문제를 우회.
 *
 * decodeURIComponent + trailing slash 정규화 후 직접 lookup.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import redirectsRaw from './scripts/redirects.generated.json';

// Build lookup map: 정규화된 source path → destination
const REDIRECT_MAP = new Map<string, string>();
for (const r of redirectsRaw as Array<{ source: string; destination: string }>) {
    const normalized = r.source.replace(/\/$/, '');
    if (!REDIRECT_MAP.has(normalized)) {
        REDIRECT_MAP.set(normalized, r.destination);
    }
}

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // decode (한글 → raw) + trailing slash 제거로 일관 비교
    let decoded: string;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        decoded = pathname;
    }
    const lookupKey = decoded.replace(/\/$/, '');

    const destination = REDIRECT_MAP.get(lookupKey);
    if (destination) {
        const url = request.nextUrl.clone();
        url.pathname = destination;
        // search 보존
        url.search = search;
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/blog/:path*',
};
