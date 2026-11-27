import GithubSlugger from 'github-slugger';

export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

/**
 * 본문 MDX에서 H2/H3를 뽑는다. id는 rehype-slug와 같은 github-slugger로 만들어
 * 화면의 heading id와 정확히 맞춘다(같은 문서 안 중복은 -1, -2 접미사).
 */
export function extractHeadings(content: string): TocHeading[] {
    const slugger = new GithubSlugger();
    const out: TocHeading[] = [];
    let inFence = false;
    for (const line of content.split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
        if (!m) continue;
        const text = m[2]
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/[*_`]/g, '')
            .trim();
        const id = slugger.slug(text);
        const level = m[1].length;
        if (level === 2 || level === 3) out.push({ id, text, level });
    }
    return out;
}
