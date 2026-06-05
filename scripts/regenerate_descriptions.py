#!/usr/bin/env python3
"""
모든 글의 description 을 Claude Haiku 로 재생성한다.

목적:
- SEO 가치 향상: 글마다 고유한 가치 제안 (CTR ↑)
- 길이 통일: 120~155자 (Google SERP snippet 최적)
- 패턴 회피: "...완벽 가이드", "...총정리" 같은 템플릿 어미 회피

사용:
  python scripts/regenerate_descriptions.py              # 전체 글
  python scripts/regenerate_descriptions.py --limit 3    # 테스트
  python scripts/regenerate_descriptions.py --dry-run    # 출력만, 파일 미수정
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    import yaml
except ImportError:
    print('PyYAML required: pip install pyyaml', file=sys.stderr)
    sys.exit(2)

import urllib.request
import urllib.error

REPO = Path(__file__).resolve().parent.parent
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
        return None, None, text
    fm = yaml.safe_load(m.group(1)) or {}
    body = m.group(2)
    return fm, body, text


def write_post(path: Path, fm: dict, body: str):
    fm_str = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000).rstrip()
    out = f"---\n{fm_str}\n---\n{body}"
    path.write_text(out, encoding='utf-8')


PROMPT_TEMPLATE = """당신은 한국 의료·치과 정보지의 SEO 카피라이터입니다. 글의 description (메타 설명) 을 작성해 주세요.

## 원칙
1. 길이: 120자 이상 155자 이하 (한국어 기준, 띄어쓰기 포함)
2. 글의 **고유한 가치 제안** 을 담는다 — 글이 답하는 구체적인 질문, 제공하는 구체적인 정보를 1개 이상 명시
3. SERP 클릭 유도 — 독자가 검색했을 때 "내가 찾던 글" 이라고 느낄 단어 선택
4. 금지 어미·표현:
   - "~ 완벽 가이드", "~ 총정리", "~ 모든 것", "~ A to Z" 같은 무성의 마무리
   - "지금 바로", "꼭 알아야 할", "절대로", "반드시" 같은 자극·강요
   - "전문가가 알려주는", "병원이 추천하는" 같은 권위 자랑 (의료법 56조 위반 가능)
5. 톤: 객관·정보 안내. 인사·과장 X. 평서 종결 (~ 합니다, ~ 입니다).
6. 첫 문장은 글의 핵심 주제·범위. 두 번째 문장은 글이 제공하는 구체적인 정보(수치·항목·맥락) 또는 독자 상황.
7. 반드시 한 단락. 줄바꿈 X.

## 입력 글
제목: {title}
카테고리: {category}
키워드: {keywords}
기존 description: {old_description}
본문 첫 1500자:
---
{body_excerpt}
---

## 응답
JSON 만 출력. 다른 텍스트·markdown·코드펜스 X:
{{"description": "여기에 새로 작성한 120~155자 description"}}
"""


def call_claude(api_key: str, prompt: str, retries: int = 3) -> str:
    url = 'https://api.anthropic.com/v1/messages'
    payload = {
        'model': 'claude-haiku-4-5-20251001',
        'max_tokens': 600,
        'messages': [{'role': 'user', 'content': prompt}],
    }
    data = json.dumps(payload).encode('utf-8')
    headers = {
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
    }
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=60) as resp:
                obj = json.loads(resp.read().decode('utf-8'))
                return obj['content'][0]['text']
        except urllib.error.HTTPError as e:
            last_err = f'HTTP {e.code}: {e.read().decode("utf-8", errors="ignore")[:200]}'
            time.sleep(2 ** attempt)
        except Exception as e:
            last_err = repr(e)
            time.sleep(2 ** attempt)
    raise RuntimeError(f'Claude API failed: {last_err}')


def parse_json_response(text: str) -> dict:
    text = text.strip()
    # strip code fences if any
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```\s*$', '', text)
    return json.loads(text)


def char_len(s: str) -> int:
    return len(s.replace(' ', ''))  # 띄어쓰기 제외 글자 수가 아니라 단순 길이 사용
    # 실제로 SERP 는 전체 길이 기준이므로 그냥 len(s) 가 맞음.


def regenerate_for_post(api_key: str, path: Path, dry_run: bool) -> dict:
    fm, body, raw = load_post(path)
    if fm is None:
        return {'slug': path.stem, 'status': 'SKIP (no frontmatter)'}
    title = fm.get('title', '')
    category = fm.get('category', '')
    keywords = fm.get('keywords', [])
    if isinstance(keywords, list):
        keywords_str = ', '.join(keywords)
    else:
        keywords_str = str(keywords)
    old_description = fm.get('description', '')

    body_excerpt = body[:1500] if body else ''
    prompt = PROMPT_TEMPLATE.format(
        title=title,
        category=category,
        keywords=keywords_str,
        old_description=old_description,
        body_excerpt=body_excerpt,
    )

    try:
        response_text = call_claude(api_key, prompt)
        parsed = parse_json_response(response_text)
        new_desc = parsed.get('description', '').strip()
    except Exception as e:
        return {'slug': path.stem, 'status': f'ERROR: {e}'}

    new_len = len(new_desc)
    if new_len < 80 or new_len > 200:
        return {
            'slug': path.stem,
            'status': f'OUT_OF_RANGE ({new_len}자)',
            'old': old_description,
            'new': new_desc,
        }

    fm['description'] = new_desc
    if not dry_run:
        write_post(path, fm, body)

    return {
        'slug': path.stem,
        'status': 'OK',
        'len_old': len(old_description),
        'len_new': new_len,
        'old': old_description[:60] + '...' if len(old_description) > 60 else old_description,
        'new': new_desc,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=0, help='처리할 글 수 제한 (0=전체)')
    ap.add_argument('--dry-run', action='store_true', help='파일 미수정, 출력만')
    ap.add_argument('--slug', type=str, default='', help='특정 slug 1개만')
    args = ap.parse_args()

    api_key = get_api_key()

    if args.slug:
        files = [CONTENT / f'{args.slug}.mdx']
        if not files[0].exists():
            print(f'NOT FOUND: {files[0]}')
            sys.exit(1)
    else:
        files = sorted(CONTENT.glob('*.mdx'))
        if args.limit > 0:
            files = files[: args.limit]

    print(f'총 {len(files)}개 글 처리 (dry-run={args.dry_run})')
    results = []
    for i, f in enumerate(files, 1):
        print(f'[{i}/{len(files)}] {f.stem}', flush=True)
        r = regenerate_for_post(api_key, f, args.dry_run)
        results.append(r)
        print(f'  → {r["status"]} ({r.get("len_old", "?")}자 → {r.get("len_new", "?")}자)', flush=True)
        if 'new' in r:
            print(f'  NEW: {r["new"]}', flush=True)
        time.sleep(0.3)

    ok = sum(1 for r in results if r['status'] == 'OK')
    err = sum(1 for r in results if r['status'].startswith('ERROR'))
    oor = sum(1 for r in results if r['status'].startswith('OUT_OF_RANGE'))
    print(f'\n=== 요약 ===')
    print(f'OK: {ok}')
    print(f'ERROR: {err}')
    print(f'OUT_OF_RANGE: {oor}')

    # 로그 저장
    log_path = REPO / 'scripts' / f'regenerate_descriptions_log.json'
    log_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'로그: {log_path}')


if __name__ == '__main__':
    main()
