#!/usr/bin/env python3
"""
글-specific 이미지 프롬프트 생성 (Claude API 활용)

룰북 _rules/14-IMAGE_RULES_NB2.md §9 절차 자동화:
1. 글 frontmatter + 본문 첫 1500자 추출
2. Claude API 로 글 분석 → JSON 응답 (핵심 명사, unique 각도, hero subject 영어, infographic 토픽, 한글 alt)
3. 5블록 프롬프트로 wrap → image_meta.json 갱신

출력:
- scripts/image_meta_v2.json (새 글-specific 매핑)
- scripts/image_batch_v2_YYYYMMDD.jsonl

사용법:
  python scripts/analyze_post_for_image.py              # 전체 67 글
  python scripts/analyze_post_for_image.py --limit 5    # 테스트 5 글
  python scripts/analyze_post_for_image.py --slug X     # 단일 글
  python scripts/analyze_post_for_image.py --sample 10  # sample 10개 stdout 출력 (검수용)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print('PyYAML required: pip install pyyaml', file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / 'scripts'
CONTENT = REPO / 'content' / 'blog'

FM_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n(.*)', re.DOTALL)


def get_api_key() -> str:
    key = os.environ.get('ANTHROPIC_API_KEY')
    if not key:
        env_file = REPO / '.env.local'
        if env_file.exists():
            text = env_file.read_text()
            m = re.search(r'ANTHROPIC_API_KEY\s*=\s*([A-Za-z0-9_\-]+)', text)
            if m:
                key = m.group(1)
    if not key:
        print('ERROR: ANTHROPIC_API_KEY 필요', file=sys.stderr)
        sys.exit(2)
    return key


def load_post(path: Path):
    text = path.read_text(encoding='utf-8')
    m = FM_RE.match(text)
    if not m:
        return None, None
    fm = yaml.safe_load(m.group(1)) or {}
    body = m.group(2)
    return fm, body


ANALYZE_PROMPT_TEMPLATE = """당신은 의학 정보지의 이미지 프롬프트 작가입니다. 임플란트·치과 도메인의 글을 분석해 글-specific 이미지 컨셉을 생성합니다.

## 입력 글
제목: {title}
설명: {description}
키워드: {keywords}
카테고리: {category}
본문 첫 1500자:
---
{body_excerpt}
---

## 작업
이 글에만 어울리는 이미지 컨셉을 JSON 으로 출력하세요. 핵심: **카테고리 일반 정물 X. 이 글에만 어울리는 specific 명사·도구·상황 반영**.

## 제약 (필수)
- 사람·얼굴·환자 신체·비포애프터·피·절개 묘사 절대 금지
- 브랜드 로고·종교 심볼·시계·달력 금지
- Hero subject 는 영어, 1~3 정물·아이콘 조합
- Infographic 토픽은 영어, 글에서 추출되는 specific 데이터·단계·비교
- Alt 는 한글 30-60자, 메인 키워드 포함, 의료광고법 표현 (BEST/최고/완벽/100%/지금예약) 금지

## 출력 JSON 형식 (정확히 이 형식)
```json
{{
  "key_nouns": ["명사1", "명사2", "명사3"],
  "unique_angle": "이 글의 unique 각도 한 줄",
  "hero_subject": "<글-specific 영어 subject 묘사, 1~3개 정물/아이콘 조합>",
  "info_topic": "<글에서 추출되는 specific 데이터/단계 영어로 묘사>",
  "hero_alt_kr": "<한글 30-60자 alt, 메인 키워드 포함>",
  "info_alt_kr": "<한글 30-60자 alt, 메인 키워드 포함>"
}}
```

JSON 외 텍스트 출력하지 마세요."""


def call_claude(prompt: str, api_key: str, model: str = 'claude-haiku-4-5-20251001') -> dict:
    """Claude API 단일 호출 → JSON 응답 파싱"""
    import urllib.request as _ur

    req_body = {
        'model': model,
        'max_tokens': 1024,
        'messages': [{'role': 'user', 'content': prompt}],
    }
    req = _ur.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(req_body).encode('utf-8'),
        headers={
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
    )
    try:
        with _ur.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        raise RuntimeError(f'Claude API 호출 실패: {e}')

    text = ''
    for block in data.get('content', []):
        if block.get('type') == 'text':
            text += block.get('text', '')

    # JSON 파싱 — ```json ... ``` 또는 raw JSON
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if not m:
        raise ValueError(f'JSON 응답 없음: {text[:200]}')
    return json.loads(m.group(0))


def make_hero_prompt(subject: str) -> str:
    return (
        f'A clean, calm medical illustration of {subject}, '
        'minimalist Korean editorial medical illustration, soft natural lighting from upper left, '
        'flat shapes with subtle texture, hand-painted feel, clinical clean impression, '
        'centered composition with 60% empty space, no foreground clutter, eye-level perspective, '
        'soft white background #FFFFFF, light gray accents #F5F7FA, '
        'clinical blue #0066CC as single accent color, calm mint #B5D8D2 or warm beige #EAE4D6 secondary tone, '
        'strict rules: no people, no faces, no patient bodies, no before/after, no blood, no incisions, '
        'no readable text, no brand logos (no Osstem, no Straumann), no religious symbols, '
        'no clock or calendar, square aspect ratio 1:1'
    )


def make_info_prompt(topic: str) -> str:
    return (
        f'A clean editorial infographic with abstract icon-based card layout: {topic}. '
        'Numbered card style with rounded corners (cards numbered 1, 2, 3, 4 in arabic numerals only), '
        'each card contains ONLY a simple abstract icon or symbol — NO Korean text inside cards, NO English text, '
        'NO title or header text at the top of the image, NO descriptive paragraphs, '
        'numbers are arabic only (1, 2, 3, 4 / 6.5% / 80-120). '
        'Use universal symbols: stopwatch for time, calendar for dates, drop for liquid, arrow for direction, '
        'check mark for confirmation, percentage sign for ratio, etc. '
        'Soft white background #FFFFFF, light gray section dividers, '
        'clinical blue #0066CC accent on numbers and card borders, '
        'single mustard #C9A227 highlight for emphasis (use sparingly), '
        'flat illustration aesthetic, generous white space, '
        'strict rules: ABSOLUTELY no Korean characters/Hangul anywhere in the image, '
        'no English words, no readable text labels, no titles, no headers, no captions, '
        'no people, no faces, no brand logos, no religious symbols, 3:2 aspect ratio (1200×800)'
    )


def analyze_post(path: Path, api_key: str) -> dict:
    fm, body = load_post(path)
    if fm is None:
        return None

    slug = fm.get('slug') or path.stem
    title = fm.get('title') or ''
    description = fm.get('description') or ''
    keywords = fm.get('keywords') or []
    if isinstance(keywords, list):
        keywords_str = ', '.join(str(k) for k in keywords)
    else:
        keywords_str = str(keywords)
    category = fm.get('category') or ''

    # 본문 첫 1500자 (frontmatter 제외, H2 까지 본문)
    body_excerpt = body[:1500].replace('\n\n', '\n')

    prompt = ANALYZE_PROMPT_TEMPLATE.format(
        title=title,
        description=description,
        keywords=keywords_str,
        category=category,
        body_excerpt=body_excerpt,
    )

    result = call_claude(prompt, api_key)
    result['slug'] = slug
    return result


def build_meta(analyses: list[dict]) -> dict:
    meta = {}
    for a in analyses:
        slug = a['slug']
        meta[slug] = {
            'hero': {
                'file': f'{slug}-hero.webp',
                'alt': a['hero_alt_kr'],
                'prompt': make_hero_prompt(a['hero_subject']),
                'subject': a['hero_subject'],
            },
            'info': {
                'file': f'{slug}-info.webp',
                'alt': a['info_alt_kr'],
                'prompt': make_info_prompt(a['info_topic']),
                'topic': a['info_topic'],
            },
            'key_nouns': a['key_nouns'],
            'unique_angle': a['unique_angle'],
        }
    return meta


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--slug', type=str, default=None)
    parser.add_argument('--sample', type=int, default=0, help='랜덤 sample N개만 분석 + stdout 출력')
    parser.add_argument('--sleep', type=float, default=0.4, help='API 호출 간격')
    parser.add_argument('--model', type=str, default='claude-haiku-4-5-20251001')
    args = parser.parse_args()

    api_key = get_api_key()
    posts = sorted(CONTENT.glob('*.mdx'))

    if args.slug:
        posts = [p for p in posts if p.stem == args.slug]
    if args.limit:
        posts = posts[: args.limit]
    if args.sample:
        import random
        random.seed(42)
        posts = random.sample(posts, min(args.sample, len(posts)))

    print(f'대상: {len(posts)} 글', file=sys.stderr)

    analyses = []
    failed = []
    for i, p in enumerate(posts, 1):
        try:
            a = analyze_post(p, api_key)
            if a:
                analyses.append(a)
                print(f'  [{i}/{len(posts)}] {p.stem}: {a["hero_subject"][:70]}...', file=sys.stderr)
        except Exception as e:
            failed.append((p.stem, str(e)[:100]))
            print(f'  [{i}/{len(posts)}] FAIL {p.stem}: {e}', file=sys.stderr)
        time.sleep(args.sleep)

    if args.sample:
        # Sample 모드: stdout 으로 검수용 출력
        print('\n' + '=' * 60)
        print(f'SAMPLE {len(analyses)} 글 검수 출력')
        print('=' * 60 + '\n')
        for a in analyses:
            print(f'## {a["slug"]}')
            print(f'  핵심 명사: {a["key_nouns"]}')
            print(f'  Unique 각도: {a["unique_angle"]}')
            print(f'  Hero subject: {a["hero_subject"]}')
            print(f'  Hero alt: {a["hero_alt_kr"]}')
            print(f'  Info topic: {a["info_topic"]}')
            print(f'  Info alt: {a["info_alt_kr"]}')
            print()
        return

    # 정식 모드: meta + batch jsonl 저장
    meta = build_meta(analyses)
    today = datetime.now().strftime('%Y%m%d')
    meta_path = SCRIPTS / 'image_meta_v2.json'
    batch_path = SCRIPTS / f'image_batch_v2_{today}.jsonl'

    with meta_path.open('w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    with batch_path.open('w', encoding='utf-8') as f:
        for slug, entry in meta.items():
            f.write(json.dumps({'id': f'{slug}-hero', 'prompt': entry['hero']['prompt']}, ensure_ascii=False) + '\n')
            f.write(json.dumps({'id': f'{slug}-info', 'prompt': entry['info']['prompt']}, ensure_ascii=False) + '\n')

    print(f'\n✓ meta v2: {meta_path}', file=sys.stderr)
    print(f'✓ batch v2: {batch_path} ({len(meta) * 2} prompts)', file=sys.stderr)
    if failed:
        print(f'\n실패 {len(failed)}건:', file=sys.stderr)
        for s, e in failed:
            print(f'  {s}: {e}', file=sys.stderr)


if __name__ == '__main__':
    main()
