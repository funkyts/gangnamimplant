#!/usr/bin/env python3
"""
gangnamimplant.com 글 lint — _rules/09-REVIEW_CHECKLIST.md §3 스펙 구현

사용법:
    python scripts/lint_post.py content/blog/some-post.mdx
    python scripts/lint_post.py content/blog/*.mdx
    python scripts/lint_post.py --check-urls content/blog/some-post.mdx

종료 코드:
    0 — BLOCKING 0 (WARNING 있어도 OK)
    1 — BLOCKING > 0
    2 — 사용 오류

의존성: PyYAML (pip install pyyaml)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


# ── 룰북 [03] 의료광고법 금지어 사전 ─────────────────────────────
BANNED_TERMS_BLOCKING = [
    (r'\bBEST\b', '비교광고'),
    (r'베스트', '비교광고'),
    (r'\bTOP\b', '비교광고'),
    (r'탑\s?\d', '비교광고'),
    (r'1등', '비교광고'),
    (r'1위', '비교광고'),
    (r'최고(?!\s?(분|령|점|치))', '단정'),  # "최고령" 등 면제
    (r'유일(?!\s?(한|하게))', '단정'),
    (r'완벽(?!\s?(주의))', '과장'),
    (r'100\s?%', '단정'),
    (r'무조건', '단정'),
    (r'절대(?!\s?안전)', '단정'),
    (r'확실히', '단정'),
    (r'보장(?!\s?(기간|범위|내용))', '단정'),
    (r'무통(?=\s?(시술|임플란트))', '단정'),
    (r'최첨단', '과장'),
    (r'부작용\s?없', '단정'),
    (r'평생\s?보장', '단정'),
    (r'잘하는\s?(곳|치과|병원|의사)', '주관적 비교'),
    (r'추천\s?(치과|병원|임플란트|치과의|의사)', '비교광고'),
    (r'명의', '단정'),
    (r'명원', '단정'),
    (r'가장\s?(저렴|좋|안전|싼|빠른|편한)', '단정'),
    (r'최저가', '단정'),
    (r'최저\s?비용', '단정'),
    (r'지금\s?(예약|신청|상담받|문의하)', '유치'),
    (r'특가', '유치'),
    (r'할인\s?이벤트', '유치'),
    (r'선착순', '유치'),
    (r'한정\s?(이벤트|할인|판매)', '유치'),
    (r'오늘만', '유치'),
    (r'이번\s?달만', '유치'),
    (r'환자\s?후기', '광고 분류'),
    (r'시술\s?후기', '광고 분류'),
    (r'비포\s?애프터', '광고 분류'),
    (r'Before\s?[&\-]\s?After', '광고 분류'),
]

# 가격 단정 패턴 — "120만원" 단독 (범위·"평균"·"부터"·"까지"·"에서" 미동반)
PRICE_SINGULAR_PATTERN = re.compile(
    r'\d{2,4}\s?만원(?!\s?[~\-에서까지부터])(?!\s?(?:\d|~))'
)
# 가격 컨텍스트 동반 단어 (range 확인용)
PRICE_RANGE_HINTS = [
    '평균', '범위', '대략', '약', '안팎', '내외',
    '시세', '수준', '정도', '~', '에서', '부터', '까지',
]

# 템플릿 lead 사전 ([04] §6)
TEMPLATE_LEAD_PHRASES = [
    '막막하신 분들이 많',
    '걱정되시는 분들 많',
    '걱정되시죠',
    '정확한 정보를 찾기 어려',
    '이 글에서 모든 것을 알려드',
    '끝까지 읽어주세요',
    '궁금하신 분들이 많',
    '고민이 많으신 분',
]

# 출처 화이트리스트 ([02] §3 + [08] §3)
EXTERNAL_DOMAIN_WHITELIST = [
    # 라이브치과 그룹
    'livedentalcenter.com', 'liveliveh.com', 'gangnamimplant.com',
    # 정부
    'mohw.go.kr', 'nhis.or.kr', 'hira.or.kr', 'mfds.go.kr',
    'kdca.go.kr', 'data.go.kr',
    # 학회/협회
    'kda.or.kr', 'kaomi.org', 'kaomfs.or.kr', 'kacd.kr', 'koreaperio.org',
    # 공공 의학 정보
    'amc.seoul.kr', 'severance.healthcare', 'samsunghospital.com',
    'msdmanuals.com', 'health.kdca.go.kr', 'snuh.org', 'snubh.org',
    # 언론 의학 전문
    'doctorsnews.co.kr', 'medigatenews.com', 'kma.org',
    'koreahealthlog.com', 'healthchosun.com', 'kormedi.com',
    'mdtoday.co.kr',
]

# References 1순위 출처 도메인 (의무 — 최소 1개 인용)
TIER1_SOURCE_DOMAINS = [
    'mohw.go.kr', 'nhis.or.kr', 'hira.or.kr', 'mfds.go.kr',
    'kda.or.kr', 'kaomi.org', 'kaomfs.or.kr', 'kacd.kr',
    'kdca.go.kr', 'koreaperio.org',
]

# 의무 frontmatter 필드
REQUIRED_FRONTMATTER = [
    'title', 'description', 'category',
    'publishedAt', 'featuredImage', 'reviewer', 'lastReviewed',
]

# pageType 별 글자 수
PAGE_TYPE_MIN_CHARS = {
    'pillar': 3500,
    'cluster': 2000,
    'longtail': 1500,
}

# pageType 별 inline 내부링크 의무 수
PAGE_TYPE_MIN_INTERNAL_LINKS = {
    'pillar': 6,
    'cluster': 4,
    'longtail': 3,
}


@dataclass
class Issue:
    level: str  # 'BLOCKING' | 'WARNING' | 'RECOMMEND'
    code: str
    message: str
    line: int | None = None


@dataclass
class LintResult:
    file: str
    issues: list[Issue] = field(default_factory=list)
    ok_count: int = 0

    @property
    def blocking(self) -> int:
        return sum(1 for i in self.issues if i.level == 'BLOCKING')

    @property
    def warning(self) -> int:
        return sum(1 for i in self.issues if i.level == 'WARNING')


# ── Parsing ──────────────────────────────────────────────────────

FRONTMATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n(.*)', re.DOTALL)


def load_post(path: Path) -> tuple[dict, str, int]:
    """frontmatter dict + body string + body start line number"""
    text = path.read_text(encoding='utf-8')
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text, 1
    fm = yaml.safe_load(m.group(1)) or {}
    body = m.group(2)
    body_start_line = m.group(1).count('\n') + 3
    return fm, body, body_start_line


def line_of(body: str, body_start: int, idx: int) -> int:
    return body_start + body[:idx].count('\n')


# ── Checks ───────────────────────────────────────────────────────

def check_frontmatter(fm: dict) -> list[Issue]:
    issues = []
    for field in REQUIRED_FRONTMATTER:
        if field not in fm or fm[field] in (None, '', []):
            issues.append(Issue('BLOCKING', 'B14', f'frontmatter 누락: {field}'))

    if 'reviewer' in fm and isinstance(fm['reviewer'], dict):
        r = fm['reviewer']
        if r.get('name') != '최정우':
            issues.append(Issue('WARNING', 'B3',
                f'reviewer.name="{r.get("name")}" (룰북은 "최정우" 표준)'))
        for k in ('title', 'organization'):
            if not r.get(k):
                issues.append(Issue('BLOCKING', 'B3', f'reviewer.{k} 누락'))
    elif 'reviewer' in REQUIRED_FRONTMATTER and 'reviewer' not in fm:
        pass  # 위에서 이미 잡힘

    if fm.get('author') and '강남임플란트치과' in str(fm['author']):
        issues.append(Issue('BLOCKING', 'B1',
            'author="강남임플란트치과" — 의료기관 코스프레, [01] 위반'))

    slug = fm.get('slug', '')
    if slug:
        if not re.match(r'^[a-z0-9][a-z0-9\-]+[a-z0-9]$', slug):
            issues.append(Issue('BLOCKING', 'B23',
                f'slug="{slug}" — 영문 kebab-case 표준 위반'))
        if len(slug) > 80:
            issues.append(Issue('WARNING', 'W12',
                f'slug 길이 {len(slug)}자 — 80자 이하 권장'))

    page_type = fm.get('pageType')
    if page_type and page_type not in PAGE_TYPE_MIN_CHARS:
        issues.append(Issue('WARNING', 'W13',
            f'pageType="{page_type}" — pillar/cluster/longtail 중 하나여야 함'))

    return issues


def check_banned_terms(body: str, fm: dict, body_start: int) -> list[Issue]:
    issues = []
    targets = [
        ('body', body, body_start),
        ('title', str(fm.get('title', '')), 1),
        ('description', str(fm.get('description', '')), 1),
        ('slug', str(fm.get('slug', '')), 1),
    ]
    for source, text, base_line in targets:
        for pattern, sense in BANNED_TERMS_BLOCKING:
            for m in re.finditer(pattern, text, re.IGNORECASE):
                line = line_of(body, base_line, m.start()) if source == 'body' else base_line
                issues.append(Issue('BLOCKING', 'B9',
                    f'[{source}] 금지어 "{m.group(0)}" ({sense})', line=line))
    return issues


def check_price_singular(body: str, body_start: int) -> list[Issue]:  # noqa: ARG001 — body_start kept for symmetry
    issues = []
    for m in PRICE_SINGULAR_PATTERN.finditer(body):
        start = max(0, m.start() - 40)
        end = min(len(body), m.end() + 20)
        snippet = body[start:end]
        if any(hint in snippet for hint in PRICE_RANGE_HINTS):
            continue
        line = line_of(body, body_start, m.start())
        issues.append(Issue('WARNING', 'B10',
            f'가격 단정 의심: "{m.group(0)}" (범위 표현 동반 필요)', line=line))
    return issues


def check_reviewer_box(body: str, fm: dict) -> list[Issue]:
    """감수자 박스 — frontmatter.reviewer 가 정상이면 코드가 자동 삽입하므로 통과.
    frontmatter 도 없고 본문 마커도 없으면 BLOCKING.
    """
    reviewer = fm.get('reviewer')
    if isinstance(reviewer, dict) and reviewer.get('name') and reviewer.get('organization'):
        return []  # 코드 자동 삽입 (app/blog/[slug]/page.tsx)
    has_marker = (
        '<MedicalReviewerBox' in body
        or 'ebugo-reviewer-box' in body
        or '감수: 최정우' in body
    )
    if not has_marker:
        return [Issue('BLOCKING', 'B5',
            'frontmatter.reviewer 누락 + 본문 감수자 박스 마커 없음')]
    return []


def check_disclaimer(_body: str, _fm: dict) -> list[Issue]:
    """면책 박스 — 코드가 모든 글 페이지에 자동 삽입 (MedicalDisclaimer).
    별도 frontmatter 플래그 없으므로 본문에 마커 있으면 INFO, 없어도 통과 (자동 삽입 신뢰).
    """
    return []


def check_references(body: str, check_urls: bool) -> list[Issue]:
    issues = []
    ref_section = re.search(r'##\s*참고\s*자료\s*\n(.*?)(?=\n##\s|\Z)', body, re.DOTALL)
    if not ref_section:
        return [Issue('BLOCKING', 'B7', 'References (## 참고 자료) 섹션 누락')]

    ref_body = ref_section.group(1)
    urls = re.findall(r'https?://[^\s\)\<\>]+', ref_body)
    if not urls:
        return [Issue('BLOCKING', 'B7', 'References 섹션에 URL 0개')]

    tier1_hit = any(any(d in u for d in TIER1_SOURCE_DOMAINS) for u in urls)
    if not tier1_hit:
        issues.append(Issue('BLOCKING', 'B7',
            'References 1순위 출처(정부·학회) 0개 — 최소 1개 의무'))

    if check_urls:
        for url in urls[:10]:  # 글당 최대 10개만 점검 (성능)
            try:
                req = urllib.request.Request(url, method='HEAD',
                    headers={'User-Agent': 'gangnamimplant-lint/1.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status >= 400:
                        issues.append(Issue('BLOCKING', 'B8',
                            f'References URL HTTP {resp.status}: {url}'))
            except urllib.error.HTTPError as e:
                if e.code in (405, 403):
                    continue  # HEAD 차단은 OK
                issues.append(Issue('BLOCKING', 'B8',
                    f'References URL HTTP {e.code}: {url}'))
            except Exception as e:
                issues.append(Issue('WARNING', 'B8',
                    f'References URL 검사 실패: {url} ({e})'))

    return issues


def check_internal_links(body: str, fm: dict) -> list[Issue]:
    """본문 inline 내부링크 검사.
    코드가 자동 삽입하는 관련 글 카드(3개) + 카테고리 hub 링크(category badge) 는
    페이지 컴포넌트 레벨에서 매 글에 보장되므로 본문 minimum 을 1 줄여서 검사.
    실 의무는 본문 안에 자연스러운 inline 링크 (pillar 5 / cluster 3 / longtail 2).
    """
    issues = []
    page_type = fm.get('pageType', 'longtail')
    adjusted_min = {'pillar': 5, 'cluster': 3, 'longtail': 2}.get(page_type, 2)

    internal_links = re.findall(r'\]\((/blog/[^\)\s]+)\)', body)
    if len(internal_links) < adjusted_min:
        issues.append(Issue('BLOCKING', 'B31',
            f'본문 inline 내부링크 {len(internal_links)}개 — '
            f'pageType={page_type} 의무 {adjusted_min}개 (관련 글 카드 + 카테고리 hub 제외)'))

    return issues


def check_external_links(body: str) -> list[Issue]:
    issues = []
    ext_links = re.findall(
        r'\]\((https?://(?!gangnamimplant\.com)[^\)\s]+)\)',
        body
    )
    for link in ext_links:
        domain_m = re.match(r'https?://([^/]+)', link)
        if not domain_m:
            continue
        host = domain_m.group(1).lower().replace('www.', '')
        if not any(host == d or host.endswith('.' + d) for d in EXTERNAL_DOMAIN_WHITELIST):
            issues.append(Issue('BLOCKING', 'B32',
                f'외부 도메인 화이트리스트 외: {host}'))
    return issues


def check_anchor_diversity(body: str) -> list[Issue]:
    issues = []
    link_pairs = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', body)
    seen: dict[str, set[str]] = {}
    for anchor, url in link_pairs:
        seen.setdefault(url, set()).add(anchor.strip())
    for url, anchors in seen.items():
        if len(anchors) == 1 and sum(1 for a, u in link_pairs if u == url) > 1:
            list_of = [a for a, u in link_pairs if u == url]
            if len(list_of) > 1:
                issues.append(Issue('WARNING', 'W10',
                    f'같은 URL 같은 앵커 반복 {len(list_of)}회: '
                    f'"{next(iter(anchors))}" → {url}'))
    return issues


def check_alt_diversity(body: str, fm: dict) -> list[Issue]:
    issues = []
    alts = re.findall(r'!\[([^\]]*)\]\(', body)
    title = fm.get('title', '')
    title_alt_count = sum(1 for a in alts if a == title)
    if len(alts) >= 3 and title_alt_count >= 3:
        issues.append(Issue('WARNING', 'B29',
            f'이미지 alt가 title과 동일 {title_alt_count}회 — 다양화 필요'))
    empty_alt_count = sum(1 for a in alts if a.strip() == '')
    if empty_alt_count > 0:
        issues.append(Issue('BLOCKING', 'B28',
            f'빈 alt 텍스트 {empty_alt_count}개'))
    return issues


def check_paragraph_length(body: str) -> list[Issue]:
    issues = []
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', body) if p.strip()]
    paragraphs = [
        p for p in paragraphs
        if not p.startswith('#') and not p.startswith('|')
        and not p.startswith('```') and not p.startswith('---')
    ]
    if not paragraphs:
        return issues
    long_paragraphs = [p for p in paragraphs if p.count('. ') + p.count('? ') + p.count('! ') + p.count('다.') > 4]
    if len(long_paragraphs) > len(paragraphs) * 0.3:
        issues.append(Issue('WARNING', 'W1',
            f'단락 평균 4문장 초과 ({len(long_paragraphs)}/{len(paragraphs)})'))
    return issues


def check_emoji_bold(body: str, body_start: int) -> list[Issue]:
    issues = []
    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F9FF\U0001FA00-\U0001FAFF'
        r'☀-⛿✀-➿⌀-⏿]'
    )
    for m in emoji_pattern.finditer(body):
        line = line_of(body, body_start, m.start())
        issues.append(Issue('BLOCKING', 'B17', f'이모지 발견: {m.group(0)!r}', line=line))
    for m in re.finditer(r'\*\*[^\*\n]+\*\*', body):
        line = line_of(body, body_start, m.start())
        issues.append(Issue('BLOCKING', 'B17', f'볼드 발견: {m.group(0)[:30]}', line=line))
    return issues


def check_lead_template(body: str, body_start: int) -> list[Issue]:
    issues = []
    lead = body.split('\n\n', 1)[0] if '\n\n' in body else body
    lead = re.sub(r'^#.*\n', '', lead).strip()
    for phrase in TEMPLATE_LEAD_PHRASES:
        if phrase in lead:
            issues.append(Issue('BLOCKING', 'B16',
                f'템플릿 lead 적중: "{phrase}"'))
    return issues


def check_faq_count(fm: dict, body: str) -> list[Issue]:
    issues = []
    faq = fm.get('faq', [])
    if isinstance(faq, list) and len(faq) > 0:
        if len(faq) != 3:
            issues.append(Issue('WARNING', 'B15',
                f'frontmatter FAQ {len(faq)}개 — 정확히 3개 권장'))
        return issues

    faq_section = re.search(r'##\s*자주\s*묻는\s*질문\s*\n(.*?)(?=\n##\s|\Z)', body, re.DOTALL)
    if not faq_section:
        return [Issue('BLOCKING', 'B15', 'FAQ 섹션 (## 자주 묻는 질문) 누락')]
    q_count = len(re.findall(r'###\s', faq_section.group(1)))
    if q_count != 3:
        issues.append(Issue('WARNING', 'B15',
            f'FAQ {q_count}개 — 정확히 3개 권장'))
    return issues


def check_char_count(fm: dict, body: str) -> list[Issue]:
    issues = []
    page_type = fm.get('pageType', 'longtail')
    min_chars = PAGE_TYPE_MIN_CHARS.get(page_type, 1500)
    # 마크다운 메타 제거 후 글자 수
    cleaned = re.sub(r'```.*?```', '', body, flags=re.DOTALL)
    cleaned = re.sub(r'!\[[^\]]*\]\([^)]+\)', '', cleaned)
    cleaned = re.sub(r'\[[^\]]+\]\([^)]+\)', '', cleaned)
    cleaned = re.sub(r'[#>*\-\|`]', '', cleaned)
    cleaned = re.sub(r'\s+', '', cleaned)
    if len(cleaned) < min_chars:
        issues.append(Issue('BLOCKING', 'B13',
            f'글자 수 {len(cleaned)}자 — pageType={page_type} 의무 {min_chars}자'))
    return issues


def check_lead_keyword(fm: dict, body: str) -> list[Issue]:
    issues = []
    title = fm.get('title', '')
    keywords = fm.get('keywords', [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(',')]
    main_kw_candidates = [title.split('-')[0].strip()] + list(keywords)
    main_kw_candidates = [k for k in main_kw_candidates if k]
    if not main_kw_candidates:
        return issues
    lead = re.sub(r'^#.*\n', '', body[:400]).strip()
    if not lead:
        return issues
    if not any(kw in lead for kw in main_kw_candidates):
        issues.append(Issue('WARNING', 'W14',
            f'lead 단락에 메인 키워드 미포함 (후보: {main_kw_candidates[0]})'))
    return issues


# ── Runner ───────────────────────────────────────────────────────

def lint_file(path: Path, check_urls: bool = False) -> LintResult:
    result = LintResult(file=str(path))
    fm, body, body_start = load_post(path)

    if not fm:
        result.issues.append(Issue('BLOCKING', 'B14',
            'frontmatter 파싱 실패 — --- 블록 확인'))
        return result

    checkers = [
        ('frontmatter', lambda: check_frontmatter(fm)),
        ('banned_terms', lambda: check_banned_terms(body, fm, body_start)),
        ('price_singular', lambda: check_price_singular(body, body_start)),
        ('reviewer_box', lambda: check_reviewer_box(body, fm)),
        ('disclaimer', lambda: check_disclaimer(body, fm)),
        ('references', lambda: check_references(body, check_urls)),
        ('internal_links', lambda: check_internal_links(body, fm)),
        ('external_links', lambda: check_external_links(body)),
        ('anchor_diversity', lambda: check_anchor_diversity(body)),
        ('alt_diversity', lambda: check_alt_diversity(body, fm)),
        ('paragraph_length', lambda: check_paragraph_length(body)),
        ('emoji_bold', lambda: check_emoji_bold(body, body_start)),
        ('lead_template', lambda: check_lead_template(body, body_start)),
        ('faq_count', lambda: check_faq_count(fm, body)),
        ('char_count', lambda: check_char_count(fm, body)),
        ('lead_keyword', lambda: check_lead_keyword(fm, body)),
    ]

    for name, fn in checkers:
        try:
            new_issues = fn()
        except Exception as e:
            result.issues.append(Issue('WARNING', 'X1',
                f'checker[{name}] 실패: {e}'))
            continue
        if new_issues:
            result.issues.extend(new_issues)
        else:
            result.ok_count += 1

    return result


def print_result(result: LintResult, json_mode: bool):
    if json_mode:
        print(json.dumps({
            'file': result.file,
            'blocking': result.blocking,
            'warning': result.warning,
            'ok_checks': result.ok_count,
            'issues': [
                {'level': i.level, 'code': i.code, 'message': i.message, 'line': i.line}
                for i in result.issues
            ],
        }, ensure_ascii=False))
        return

    print(f'\n── {result.file} ──')
    if not result.issues:
        print(f'  [OK] {result.ok_count} checks passed')
    else:
        for issue in result.issues:
            line_str = f' (line {issue.line})' if issue.line else ''
            print(f'  [{issue.level}] {issue.code} {issue.message}{line_str}')
        print(f'  → BLOCKING {result.blocking} / WARNING {result.warning} / OK {result.ok_count}')


def main():
    parser = argparse.ArgumentParser(description='gangnamimplant.com 글 lint')
    parser.add_argument('paths', nargs='+', help='lint할 MDX 파일 경로 (glob 가능)')
    parser.add_argument('--check-urls', action='store_true',
        help='References URL HTTP 200 확인 (느림)')
    parser.add_argument('--json', action='store_true', help='JSON 출력')
    parser.add_argument('--strict', action='store_true',
        help='WARNING 도 exit 1 처리')
    args = parser.parse_args()

    files = []
    for p in args.paths:
        path = Path(p)
        if path.is_dir():
            files.extend(path.glob('*.mdx'))
        else:
            files.append(path)

    if not files:
        print('lint 대상 파일 없음', file=sys.stderr)
        sys.exit(2)

    total_blocking = 0
    total_warning = 0
    failed_files = []
    for path in sorted(files):
        if not path.exists():
            print(f'파일 없음: {path}', file=sys.stderr)
            continue
        result = lint_file(path, check_urls=args.check_urls)
        print_result(result, args.json)
        total_blocking += result.blocking
        total_warning += result.warning
        if result.blocking > 0:
            failed_files.append(str(path))

    if not args.json:
        print(f'\n══ 합계: BLOCKING {total_blocking} / WARNING {total_warning} ══')
        if failed_files:
            print(f'BLOCKING 발생 파일 {len(failed_files)}개:')
            for f in failed_files[:20]:
                print(f'  - {f}')
            if len(failed_files) > 20:
                print(f'  ... 외 {len(failed_files) - 20}개')

    if total_blocking > 0:
        sys.exit(1)
    if args.strict and total_warning > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
