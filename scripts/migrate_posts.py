#!/usr/bin/env python3
"""
gangnamimplant.com 53개 글 일괄 마이그레이션 — 룰북 호환으로

작업:
1. frontmatter 정규화 — date→publishedAt, author 통일, keywords 배열화,
   reviewer/lastReviewed/pageType/slug 자동 추가
2. 본문 볼드(**...**) 제거 (B17)
3. 의료광고법 금지어 사전 치환 (B9)
4. 외부 도메인 화이트리스트 외 링크 제거/References 이동
5. References 섹션 미존재 시 카테고리 기본 출처 자동 삽입
6. 중복 슬러그 페어 식별 + 301 매핑 산출 → next.config.js 갱신용 JSON

사용법:
    python scripts/migrate_posts.py --dry-run             # 미리보기 (기본)
    python scripts/migrate_posts.py --apply               # 실제 패치 (백업 자동)
    python scripts/migrate_posts.py --apply --no-backup   # 백업 없이 (git 추적 시)
    python scripts/migrate_posts.py --report report.json  # 변경 사항 JSON 저장
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print('ERROR: PyYAML required. pip install pyyaml', file=sys.stderr)
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = REPO_ROOT / 'content' / 'blog'

# ── 룰북 호환 상수 ───────────────────────────────────────────────
DEFAULT_AUTHOR = '강남임플란트 정보 편집부'
DEFAULT_REVIEWER = {
    'name': '최정우',
    'title': '원장',
    'organization': '라이브치과병원',
    'url': 'https://liveliveh.com',
}
LIVEDENTAL_HUB = 'https://livedentalcenter.com'
LIVELIVEH = 'https://liveliveh.com'
OWN_DOMAIN = 'gangnamimplant.com'

# 카테고리 슬러그 매핑 (_rules/06 §3)
CATEGORY_SLUG = {
    '임플란트 가격': 'implant-price',
    '임플란트-비용': 'implant-price',
    '임플란트 비용': 'implant-price',
    '임플란트 시술': 'implant-procedure',
    '임플란트 관리': 'implant-care',
    '임플란트 브랜드': 'implant-brands',
    '임플란트 보험': 'implant-insurance',
    '치아 크라운': 'dental-crown',
    '일반 치과 정보': 'dental-general',
    '치과 선택 가이드': 'dental-clinic-guide',
}

# 카테고리별 기본 References (정부/학회 1순위 출처) — _rules/02 §3
DEFAULT_REFS = {
    'implant-price': [
        ('보건복지부, 「치과 임플란트 건강보험 적용 안내」', 'https://www.mohw.go.kr'),
        ('건강보험심사평가원, 「치과 진료비 통계」', 'https://www.hira.or.kr'),
    ],
    'implant-procedure': [
        ('대한구강악안면임플란트학회, 「임플란트 시술 가이드라인」', 'https://www.kaomi.org'),
        ('대한치과의사협회', 'https://www.kda.or.kr'),
    ],
    'implant-care': [
        ('대한치과의사협회, 「임플란트 관리 안내」', 'https://www.kda.or.kr'),
        ('대한치주과학회', 'https://www.koreaperio.org'),
    ],
    'implant-brands': [
        ('식품의약품안전처, 「의료기기 정보」', 'https://www.mfds.go.kr'),
    ],
    'implant-insurance': [
        ('국민건강보험공단, 「치과 임플란트 보험 적용」', 'https://www.nhis.or.kr'),
        ('보건복지부', 'https://www.mohw.go.kr'),
    ],
    'dental-crown': [
        ('대한치과보철학회', 'https://www.kap.or.kr'),
        ('대한치과의사협회', 'https://www.kda.or.kr'),
    ],
    'dental-general': [
        ('대한치과의사협회', 'https://www.kda.or.kr'),
        ('보건복지부', 'https://www.mohw.go.kr'),
    ],
    'dental-clinic-guide': [
        ('대한치과의사협회, 「치과 선택 안내」', 'https://www.kda.or.kr'),
    ],
}
GENERIC_REFS = [
    ('대한치과의사협회', 'https://www.kda.or.kr'),
    ('보건복지부', 'https://www.mohw.go.kr'),
]

# ── 명시적 중복 페어 매핑 (구형 + 신형 → 통합 영문 슬러그) ─────
# 사용자 결정: 신형 우선. 같은 타겟 슬러그로 들어오는 두 파일은 신형이 그 슬러그 점유,
# 구형은 백업 후 삭제 + 301 매핑.
EXPLICIT_PAIRS = {
    '1-임플란트-1개-가격': 'implant-1unit-price-guide',
    '2026-02-15-01-1-임플란트-1개-가격': 'implant-1unit-price-guide',
    '임플란트-29만원': 'implant-29man-truth',
    '2026-02-15-02-29만원-임플란트-진짜-가능할까-숨겨진-비용-확인하기': 'implant-29man-truth',
    '오스템-임플란트-가격': 'osstem-implant-price',
    '2026-02-15-03-오스템-임플란트-1개-가격과-장단점-완벽-가이드': 'osstem-implant-price',
    '뼈이식-임플란트-과정': 'implant-bone-graft-process',
    '2026-02-15-04-임플란트-뼈이식-과정과-실패-증상-총정리': 'implant-bone-graft-process',
    '크라운-종류': 'dental-crown-types',
    '2026-02-15-06-치아-크라운-종류별-가격-비교-세라믹-지르코니아-PFM': 'dental-crown-types',
}

# 신형이 같은 타겟 슬러그 점유 우선 — 이 셋이 신형 (구형은 신형 처리 후 삭제)
NEW_FORMAT_PRIORITY = {
    '2026-02-15-01-1-임플란트-1개-가격',
    '2026-02-15-02-29만원-임플란트-진짜-가능할까-숨겨진-비용-확인하기',
    '2026-02-15-03-오스템-임플란트-1개-가격과-장단점-완벽-가이드',
    '2026-02-15-04-임플란트-뼈이식-과정과-실패-증상-총정리',
    '2026-02-15-06-치아-크라운-종류별-가격-비교-세라믹-지르코니아-PFM',
}

# 명시적 title/slug 치환 — 의료광고법 위반 제목 일반화
EXPLICIT_TITLE_OVERRIDE = {
    '2026-02-15-10-강남역-임플란트-잘하는-치과-BEST-5-2026년': {
        'title': '강남역 임플란트 치과 선택 시 체크리스트 (2026년)',
        'slug': 'gangnam-station-implant-checklist',
    },
}

# 금지어 자동 치환 사전 — _rules/03 §3 권장 치환표
BANNED_REPLACE = [
    (re.compile(r'\bBEST\s?\d*\b', re.IGNORECASE), '체크리스트'),
    (re.compile(r'\bTOP\s?\d*\b', re.IGNORECASE), '주요'),
    (re.compile(r'베스트\s?\d*'), '주요'),
    (re.compile(r'1등\s?임플란트'), '주요 임플란트'),
    (re.compile(r'잘하는\s?(곳|치과|병원|의사)'), '신뢰할 수 있는 치과'),
    (re.compile(r'추천\s?치과'), '치과 선택 시 참고할 정보'),
    (re.compile(r'추천\s?병원'), '병원 선택 시 참고할 정보'),
    (re.compile(r'추천\s?임플란트'), '임플란트 선택 시 참고할 정보'),
    (re.compile(r'최고의\s?(임플란트|치과|병원|브랜드|선택)'), r'우수한 \1'),
    (re.compile(r'최고\s?수준의'), '높은 수준의'),
    (re.compile(r'최고(?=\s?(예요|입니다|로|로서|이다))'), '주요'),
    (re.compile(r'유일한\s?(방법|선택|치료)'), r'주요 \1'),
    (re.compile(r'유일(?=\s?(한|하게))'), '주요'),
    (re.compile(r'완벽(?!\s?주의)(?=\s?(가이드|정리|비교|이해|안내))'), '전체'),
    (re.compile(r'완벽하게'), '꼼꼼히'),
    (re.compile(r'100\s?%\s?(성공|만족|보장|안전)'), '높은 \\1률이 보고됨'),
    (re.compile(r'100\s?%'), '대부분'),
    (re.compile(r'무조건'), '일반적으로'),
    (re.compile(r'절대(?!\s?안전)'), '거의'),
    (re.compile(r'확실히'), '일반적으로'),
    (re.compile(r'보장(?!\s?(기간|범위|내용))'), '권장'),
    (re.compile(r'무통(?=\s?(시술|임플란트))'), '통증 관리가 적용된'),
    (re.compile(r'최첨단'), '최신'),
    (re.compile(r'부작용\s?없는?'), '부작용 발생률이 낮은'),
    (re.compile(r'부작용이?\s?없습니다'), '부작용 발생률이 낮습니다'),
    (re.compile(r'평생\s?보장'), '장기 사용을 위한 관리'),
    (re.compile(r'명의(?=\s?(가|를|와|에게))'), '경험 많은 의료진'),
    (re.compile(r'명원'), '경험이 풍부한 의료기관'),
    (re.compile(r'가장\s?저렴한'), '합리적인 비용의'),
    (re.compile(r'가장\s?좋은'), '권장되는'),
    (re.compile(r'가장\s?안전한'), '안전성이 높은'),
    (re.compile(r'가장\s?싼'), '합리적인 비용의'),
    (re.compile(r'가장\s?빠른'), '비교적 빠른'),
    (re.compile(r'최저가'), '합리적인 비용'),
    (re.compile(r'최저\s?비용'), '합리적인 비용'),
    (re.compile(r'지금\s?예약하세요'), '자세한 상담은 의료기관에 문의하세요'),
    (re.compile(r'지금\s?(예약|신청|상담받|문의하)'), '자세한 상담은 의료기관에 문의'),
    (re.compile(r'특가'), ''),
    (re.compile(r'할인\s?이벤트'), ''),
    (re.compile(r'선착순'), ''),
    (re.compile(r'한정\s?(이벤트|할인|판매)'), ''),
    (re.compile(r'오늘만'), ''),
    (re.compile(r'이번\s?달만'), ''),
    (re.compile(r'환자\s?후기'), '일반적인 시술 경험'),
    (re.compile(r'시술\s?후기'), '일반적인 시술 경과'),
    (re.compile(r'비포\s?애프터'), '일반적인 변화'),
    (re.compile(r'Before\s?[&\-]\s?After', re.IGNORECASE), '일반적인 변화'),
]

# 슬러그 영문 변환 사전 (_rules/06 §2)
SLUG_DICT = {
    '강남 임플란트': 'gangnam-implant',
    '강남임플란트': 'gangnam-implant',
    '임플란트 1개 가격': 'implant-1unit-price',
    '임플란트 가격': 'implant-price',
    '오스템 임플란트': 'osstem-implant',
    '오스템': 'osstem',
    '임플란트 뼈이식': 'implant-bone-graft',
    '뼈이식': 'bone-graft',
    '임플란트 시술 기간': 'implant-duration',
    '치아 크라운': 'dental-crown',
    '크라운': 'crown',
    '지르코니아 크라운': 'zirconia-crown',
    '지르코니아': 'zirconia',
    '올세라믹': 'all-ceramic',
    '세라믹': 'ceramic',
    'PFM 크라운': 'pfm-crown',
    'pfm': 'pfm',
    '임플란트 보험': 'implant-insurance',
    '65세 임플란트 보험': 'implant-insurance-senior',
    '임플란트 부작용': 'implant-side-effects',
    '임플란트 수명': 'implant-lifespan',
    '임플란트 통증': 'implant-pain',
    '임플란트 양치': 'implant-oral-care',
    '임플란트 음주': 'implant-alcohol',
    '임플란트 흡연': 'implant-smoking',
    '당뇨 임플란트': 'diabetes-implant',
    '임플란트 종류': 'implant-types',
    '임플란트 vs 브릿지': 'implant-vs-bridge',
    '강남역 치과': 'gangnam-station-dental',
    '일요일 진료 치과': 'sunday-dental-clinic',
    '임플란트 29만원': 'implant-29man-truth',
    '29만원 임플란트': 'implant-29man-truth',
    '치아 교정': 'orthodontics',
    '교정 기간': 'orthodontics-duration',
    '세라믹 교정': 'ceramic-braces',
    '강남역 치아교정': 'gangnam-orthodontics',
    '임플란트 보철치료': 'implant-prosthetic',
    '보철치료': 'dental-prosthetic',
    '앞니 임플란트': 'front-tooth-implant',
    '어금니 임플란트': 'molar-implant',
    '무치악 임플란트': 'edentulous-implant',
    '임플란트 발치 즉시': 'immediate-implant',
    '임플란트 식사': 'implant-eating',
    '임플란트 실밥 제거': 'implant-suture-removal',
    '임플란트 실패': 'implant-failure',
    '임플란트 운동': 'implant-exercise',
    '임플란트 정기검진': 'implant-checkup',
    '임플란트 치실': 'implant-floss',
    '임플란트 ct': 'implant-ct',
    '임플란트 mri': 'implant-mri',
    '임플란트 2차 수술': 'implant-secondary-surgery',
    '임플란트 뼈이식 후 양치': 'implant-graft-oral-care',
    '임플란트 뼈이식 포함 가격': 'implant-graft-price',
    '치과 스케일러': 'dental-scaler',
    '치아 개수': 'tooth-count',
    '치아 신경': 'tooth-nerve',
    '치아 미백': 'tooth-whitening',
    '치아미백': 'tooth-whitening',
    '치아 미백제': 'tooth-whitening-agent',
    '치아미백제': 'tooth-whitening-agent',
    '크라운 종류': 'crown-types',
    '흡연 임플란트': 'smoking-implant',
}


@dataclass
class MigrationReport:
    file: str
    changes: list[str] = field(default_factory=list)
    new_slug: str | None = None
    duplicate_of: str | None = None
    keep: bool = True


def to_english_slug(value: str) -> str:
    s = value.strip()
    if s in SLUG_DICT:
        return SLUG_DICT[s]
    parts = [p for p in re.split(r'[\s\-]+', s) if p]
    out = []
    for p in parts:
        if p in SLUG_DICT:
            out.append(SLUG_DICT[p])
        elif re.match(r'^[a-z0-9\-]+$', p, re.IGNORECASE):
            out.append(p.lower())
        else:
            out.append(p)
    result = '-'.join(out).lower()
    result = re.sub(r'[^a-z0-9\-]', '', result)
    result = re.sub(r'-+', '-', result).strip('-')
    return result or 'untitled'


def infer_english_slug(filename: str, title: str) -> str:
    base = filename.replace('.mdx', '')
    base = re.sub(r'^\d+-', '', base)  # "1-..." 제거
    base = re.sub(r'^\d{4}-\d{2}-\d{2}-\d+-', '', base)  # 날짜 prefix 제거

    direct_kw_match = None
    for kw, slug in sorted(SLUG_DICT.items(), key=lambda kv: -len(kv[0])):
        if kw in title or kw.replace(' ', '-') in base or kw in base:
            direct_kw_match = slug
            break

    if direct_kw_match:
        return direct_kw_match

    return to_english_slug(base)


FRONTMATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n(.*)', re.DOTALL)


def load_post(path: Path):
    text = path.read_text(encoding='utf-8')
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text, ''
    fm = yaml.safe_load(m.group(1)) or {}
    return fm, m.group(2), m.group(1)


def dump_post(fm: dict, body: str) -> str:
    yaml_text = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return f'---\n{yaml_text}---\n{body}'


def normalize_frontmatter(fm: dict, filename: str, report: MigrationReport) -> dict:
    new = dict(fm)
    stem = filename.replace('.mdx', '')

    # 명시적 title 치환 (의료광고법 위반 제목 일반화)
    if stem in EXPLICIT_TITLE_OVERRIDE:
        override = EXPLICIT_TITLE_OVERRIDE[stem]
        new['title'] = override['title']
        new['slug'] = override['slug']
        report.changes.append(
            f'frontmatter: title 일반화 → "{override["title"]}", slug={override["slug"]}'
        )

    if 'date' in new and 'publishedAt' not in new:
        d = new.pop('date')
        if isinstance(d, str) and len(d) == 10:
            new['publishedAt'] = f'{d}T00:00:00.000Z'
        else:
            new['publishedAt'] = str(d)
        report.changes.append(f'frontmatter: date → publishedAt ({new["publishedAt"]})')
    elif 'date' in new:
        new.pop('date')

    if isinstance(new.get('keywords'), str):
        new['keywords'] = [k.strip() for k in new['keywords'].split(',') if k.strip()]
        report.changes.append('frontmatter: keywords string → list')

    if new.get('author') in ('강남임플란트치과', '강남임플란트', None, ''):
        new['author'] = DEFAULT_AUTHOR
        report.changes.append(f'frontmatter: author → {DEFAULT_AUTHOR}')

    if 'reviewer' not in new:
        new['reviewer'] = dict(DEFAULT_REVIEWER)
        report.changes.append('frontmatter: reviewer (최정우 원장) 추가')

    if 'lastReviewed' not in new:
        new['lastReviewed'] = datetime.now().strftime('%Y-%m-%d')
        report.changes.append(f'frontmatter: lastReviewed = {new["lastReviewed"]}')

    if 'dateModified' not in new:
        new['dateModified'] = new.get('publishedAt') or new['lastReviewed']

    if 'pageType' not in new:
        title = new.get('title', '')
        if any(kw in title for kw in ['종합', '완벽', '전체', '가이드']):
            new['pageType'] = 'cluster'
        else:
            new['pageType'] = 'longtail'
        report.changes.append(f'frontmatter: pageType = {new["pageType"]}')

    if 'slug' not in new:
        # 명시적 페어 매핑이 있으면 그 슬러그 사용
        if stem in EXPLICIT_PAIRS:
            new['slug'] = EXPLICIT_PAIRS[stem]
        else:
            new['slug'] = infer_english_slug(filename, new.get('title', ''))
        report.changes.append(f'frontmatter: slug = {new["slug"]}')
        report.new_slug = new['slug']

    if not new.get('featuredImageAlt'):
        title = new.get('title', '').replace(' - ', ' ').strip()
        new['featuredImageAlt'] = f'{title} 일러스트'
        report.changes.append('frontmatter: featuredImageAlt 추가')

    return new


def strip_bold(body: str, report: MigrationReport) -> str:
    """본문 **X** 또는 __X__ 제거. 룰북 [04] §6 본문 볼드 금지."""
    count_before = len(re.findall(r'\*\*[^\*\n]+\*\*', body)) + len(re.findall(r'__[^_\n]+__', body))
    if count_before > 0:
        body = re.sub(r'\*\*([^\*\n]+)\*\*', r'\1', body)
        body = re.sub(r'__([^_\n]+)__', r'\1', body)
        report.changes.append(f'본문: 볼드 마크다운 {count_before}개 제거')
    return body


def replace_banned(body: str, report: MigrationReport) -> str:
    total = 0
    for pat, repl in BANNED_REPLACE:
        body, n = pat.subn(repl, body)
        total += n
    if total > 0:
        report.changes.append(f'본문: 금지어 사전 치환 {total}건')
    # 빈 칸 정리
    body = re.sub(r' {2,}', ' ', body)
    body = re.sub(r'  ([\.\,!\?])', r'\1', body)
    return body


def clean_external_links(body: str, report: MigrationReport) -> str:
    """화이트리스트 외 외부 도메인 링크를 라이브치과 그룹 으로 치환하거나 텍스트화."""
    whitelist = [
        'livedentalcenter.com', 'liveliveh.com', 'gangnamimplant.com',
        'mohw.go.kr', 'nhis.or.kr', 'hira.or.kr', 'mfds.go.kr', 'kdca.go.kr',
        'kda.or.kr', 'kaomi.org', 'kaomfs.or.kr', 'kacd.kr', 'koreaperio.org',
        'kap.or.kr',
        'amc.seoul.kr', 'severance.healthcare', 'samsunghospital.com',
        'msdmanuals.com', 'snuh.org', 'snubh.org',
        'doctorsnews.co.kr', 'medigatenews.com', 'kma.org',
        'koreahealthlog.com', 'healthchosun.com', 'kormedi.com', 'mdtoday.co.kr',
    ]

    def replace_link(m):
        anchor = m.group(1)
        url = m.group(2)
        host_m = re.match(r'https?://([^/\s\)]+)', url)
        if not host_m:
            return m.group(0)
        host = host_m.group(1).lower().replace('www.', '')
        if any(host == d or host.endswith('.' + d) for d in whitelist):
            return m.group(0)
        # blockquote 안의 livedentalcenter 외부 링크는 제거하고 텍스트만 남김
        return anchor

    new_body, n = re.subn(r'\[([^\]]+)\]\((https?://[^)]+)\)', replace_link, body)
    if n != len(re.findall(r'\[[^\]]+\]\(https?://[^)]+\)', body)):
        # 실제 변경 횟수 다시 계산
        changed = sum(
            1 for m in re.finditer(r'\[([^\]]+)\]\((https?://[^)]+)\)', body)
            if not any((
                lambda host: host == d or host.endswith('.' + d)
            )(re.match(r'https?://([^/\s\)]+)', m.group(2)).group(1).lower().replace('www.', ''))
              for d in whitelist if re.match(r'https?://([^/\s\)]+)', m.group(2)))
        )
        if changed > 0:
            report.changes.append(f'본문: 화이트리스트 외 외부 링크 {changed}개 텍스트화')

    # blockquote "함께 보면 좋은 글" 박스에서 livedentalcenter 인용은 유지
    return new_body


def ensure_references(body: str, fm: dict, report: MigrationReport) -> str:
    if re.search(r'##\s*참고\s*자료', body):
        return body
    cat_slug = CATEGORY_SLUG.get(fm.get('category', ''), 'dental-general')
    refs = DEFAULT_REFS.get(cat_slug, GENERIC_REFS)
    refs_md = '\n## 참고 자료\n\n'
    for i, (name, url) in enumerate(refs, 1):
        # MDX-safe markdown link (autolink <URL> 은 MDX JSX parser 가 깨짐)
        refs_md += f'{i}. [{name}]({url})\n'
    refs_md += '\n'
    body = body.rstrip() + '\n' + refs_md
    report.changes.append(f'본문: References 섹션 추가 (카테고리={cat_slug}, 출처 {len(refs)}개)')
    return body


def find_duplicate_pairs(all_posts: list[tuple[Path, dict, str]]) -> dict[str, str]:
    """명시적 페어 매핑 기반. {구형 slug: 통합 영문 slug} 301 매핑.
    auto 매칭은 한국어 슬러그 ↔ 한국어 제목 비교가 부정확해서 명시 표를 신뢰원으로 사용.
    """
    pairs: dict[str, str] = {}
    # 신형은 새 슬러그로 rename 되지만, redirects 가 필요한 건 *구형 URL* 만
    # (신형 URL 자체는 살아있지만 영문 슬러그로 옮겨가므로 그것도 redirect 필요)
    for path, _fm, _ in all_posts:
        stem = path.stem
        if stem in EXPLICIT_PAIRS:
            pairs[stem] = EXPLICIT_PAIRS[stem]
    return pairs


def process_post(path: Path) -> MigrationReport:
    report = MigrationReport(file=str(path.relative_to(REPO_ROOT)))
    fm, body, _ = load_post(path)
    if fm is None:
        report.changes.append('ERROR: frontmatter 파싱 실패')
        return report

    fm = normalize_frontmatter(fm, path.name, report)
    body = strip_bold(body, report)
    body = replace_banned(body, report)
    body = clean_external_links(body, report)
    body = ensure_references(body, fm, report)

    report._new_text = dump_post(fm, body)  # type: ignore
    report._new_slug_filename = fm['slug']  # type: ignore
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--no-backup', action='store_true')
    parser.add_argument('--report', type=str, help='변경 사항 JSON 저장 경로')
    parser.add_argument('--only', type=str, help='단일 파일만 처리 (디버그)')
    args = parser.parse_args()

    if args.only:
        paths = [CONTENT_DIR / args.only]
    else:
        paths = sorted(CONTENT_DIR.glob('*.mdx'))

    if not paths:
        print('lint 대상 없음', file=sys.stderr)
        sys.exit(2)

    # 1단계: 전부 파싱
    all_posts = []
    for p in paths:
        fm, body, _ = load_post(p)
        if fm is not None:
            all_posts.append((p, fm, body))

    # 2단계: 중복 페어 산출
    pairs = find_duplicate_pairs(all_posts)
    print(f'\n══ 중복 페어 (구형 → 신형 슬러그 301 매핑) {len(pairs)}건 ══')
    for old, new in pairs.items():
        print(f'  /blog/{old} → /blog/{new}/')

    # 3단계: 마이그레이션 dry-run
    print(f'\n══ 마이그레이션 dry-run ({len(paths)}파일) ══')
    reports = []
    change_counter: Counter = Counter()
    for p in paths:
        report = process_post(p)
        reports.append(report)
        for c in report.changes:
            key = c.split(':')[0] if ':' in c else c.split('(')[0]
            change_counter[key.strip()] += 1

    print()
    print('변경 카테고리별 횟수:')
    for k, v in change_counter.most_common():
        print(f'  {v:>4}건  {k}')

    if args.report:
        with open(args.report, 'w', encoding='utf-8') as f:
            json.dump({
                'duplicate_pairs': pairs,
                'reports': [
                    {'file': r.file, 'changes': r.changes,
                     'new_slug': getattr(r, '_new_slug_filename', None)}
                    for r in reports
                ],
            }, f, ensure_ascii=False, indent=2)
        print(f'\n리포트 저장: {args.report}')

    if not args.apply:
        print('\n[dry-run] 변경 사항이 적용되지 않았습니다. 실제 적용은 --apply')
        return

    # 4단계: 실제 적용
    print('\n══ 실제 적용 ══')
    backup_dir = CONTENT_DIR / '_backup_pre_migrate'
    if not args.no_backup:
        backup_dir.mkdir(exist_ok=True)
        for p in paths:
            shutil.copy2(p, backup_dir / p.name)
        print(f'백업: {backup_dir}')

    # 처리 순서 — 신형 우선이 같은 슬러그 점유하도록
    sorted_items = sorted(zip(reports, paths),
        key=lambda rp: (0 if rp[1].stem in NEW_FORMAT_PRIORITY else 1, rp[1].name))

    for r, p in sorted_items:
        new_text = getattr(r, '_new_text', None)
        new_slug_filename = getattr(r, '_new_slug_filename', None)
        if new_text is None or new_slug_filename is None:
            continue

        new_path = CONTENT_DIR / f'{new_slug_filename}.mdx'
        if new_path != p and new_path.exists():
            # 페어 통합: 타겟이 이미 있으면 구형은 백업으로만 남기고 삭제
            if p.stem in EXPLICIT_PAIRS:
                p.unlink()
                print(f'  removed (duplicate): {p.name} (kept: {new_path.name})')
                continue
            else:
                print(f'  SKIP (target exists): {p.name} → {new_path.name}')
                continue

        new_path.write_text(new_text, encoding='utf-8')
        if new_path != p:
            p.unlink()
            print(f'  rename + patch: {p.name} → {new_path.name}')
        else:
            print(f'  patch: {p.name}')

    # 5단계: 301 매핑 JSON 생성 (next.config.js 갱신용)
    redirects = []
    for old, new in pairs.items():
        redirects.append({
            'source': f'/blog/{old}',
            'destination': f'/blog/{new}/',
            'permanent': True,
        })
    redirects_path = REPO_ROOT / 'scripts' / 'redirects.generated.json'
    with open(redirects_path, 'w', encoding='utf-8') as f:
        json.dump(redirects, f, ensure_ascii=False, indent=2)
    print(f'\n301 매핑: {redirects_path}')
    print('next.config.js 의 redirects() 에 이 배열을 박으세요.')


if __name__ == '__main__':
    main()
