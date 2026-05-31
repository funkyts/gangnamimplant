#!/usr/bin/env python3
"""
Gemini Nano Banana 2 (gemini-3.1-flash-image-preview) 이미지 생성

모드:
  sync  — 즉시 호출, 134장 직렬 처리 (rate limit 고려). 비용 ~$0.067/img.
  batch — Files API + Batch endpoint 제출 (24h, 50% 할인). 비용 ~$0.034/img.

env:
  GEMINI_API_KEY 또는 GOOGLE_GENERATIVE_AI_KEY

사용법:
  python scripts/generate_images_batch.py --mode sync     # 즉시 134장
  python scripts/generate_images_batch.py --mode batch    # 24h 대기 (할인)
  python scripts/generate_images_batch.py --mode sync --limit 5  # 테스트 5장만
  python scripts/generate_images_batch.py --mode sync --slug implant-1unit-price-guide
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / 'scripts'
OUTPUT_DIR = REPO / 'public' / 'images' / 'blog'


def get_api_key() -> str:
    import re as _re
    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_GENERATIVE_AI_KEY')
    if not key:
        env_file = REPO / '.env.local'
        if env_file.exists():
            text = env_file.read_text()
            m = _re.search(r'(?:GEMINI_API_KEY|GOOGLE_GENERATIVE_AI_KEY)\s*=\s*([A-Za-z0-9_\-]+)', text)
            if m:
                key = m.group(1)
    if not key:
        print('ERROR: GEMINI_API_KEY 또는 GOOGLE_GENERATIVE_AI_KEY 환경변수 / .env.local 필요',
              file=sys.stderr)
        sys.exit(2)
    return key


def load_batch():
    """가장 최신 image_batch_*.jsonl 로드"""
    batches = sorted(SCRIPTS.glob('image_batch_*.jsonl'))
    if not batches:
        print('ERROR: scripts/image_batch_*.jsonl 없음. prepare_image_prompts.py 먼저 실행.',
              file=sys.stderr)
        sys.exit(2)
    path = batches[-1]
    items = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return path, items


def sync_generate(items, api_key, out_dir: Path, sleep_sec: float = 1.5):
    """단일 sync 호출 반복. rate limit 1.5초 간격."""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print('ERROR: google-genai 필요. pip install google-genai', file=sys.stderr)
        sys.exit(2)

    client = genai.Client(api_key=api_key)
    model_id = os.environ.get('NB2_MODEL', 'gemini-3.1-flash-image-preview')
    out_dir.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = []
    for i, item in enumerate(items, 1):
        slug_id = item['id']
        prompt = item['prompt']
        out_path = out_dir / f'{slug_id}.png'
        if out_path.exists():
            print(f'  [{i}/{len(items)}] SKIP existing: {slug_id}', file=sys.stderr)
            success += 1
            continue

        try:
            print(f'  [{i}/{len(items)}] generating: {slug_id}', file=sys.stderr)
            response = client.models.generate_content(
                model=model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE'],
                ),
            )
            # Extract image bytes
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    out_path.write_bytes(part.inline_data.data)
                    success += 1
                    break
            else:
                failed.append((slug_id, 'no image in response'))
        except Exception as e:
            failed.append((slug_id, str(e)[:120]))
            print(f'    ERROR: {e}', file=sys.stderr)

        time.sleep(sleep_sec)

    print(f'\n✓ sync done: success {success} / failed {len(failed)} / total {len(items)}',
          file=sys.stderr)
    if failed:
        print('\nFailures:', file=sys.stderr)
        for sid, err in failed[:20]:
            print(f'  {sid}: {err}', file=sys.stderr)


def batch_generate(items, api_key, batch_jsonl_path: Path):
    """Gemini Batch API 제출 (preview/제한 — Vertex AI Batch 권장)."""
    try:
        from google import genai
    except ImportError:
        print('ERROR: google-genai 필요', file=sys.stderr)
        sys.exit(2)

    client = genai.Client(api_key=api_key)

    # Files API 업로드 + Batch 생성 시도
    # 주의: 이미지 모델의 Batch API 가 preview SDK 에서 정확한 형식이 유동적.
    # 안 되면 sync 권장.
    try:
        file = client.files.upload(
            file=str(batch_jsonl_path),
            config={'display_name': batch_jsonl_path.name, 'mime_type': 'application/jsonl'},
        )
        print(f'  uploaded file: {file.name}', file=sys.stderr)

        job = client.batches.create(
            model='models/gemini-3.1-flash-image-preview',
            src=file.name,
            config={'display_name': 'gangnamimplant-image-batch'},
        )
        print(f'  batch job: {job.name}', file=sys.stderr)
        print(f'  state: {job.state}', file=sys.stderr)

        # Save job name for later polling
        (SCRIPTS / 'last_batch_job.txt').write_text(job.name, encoding='utf-8')
        print(f'\n✓ batch submitted. Job: {job.name}', file=sys.stderr)
        print(f'  Poll status: scripts/check_batch.py {job.name}', file=sys.stderr)
        print(f'  Typical wait: 6-24 hours', file=sys.stderr)
    except Exception as e:
        print(f'\nERROR: batch mode failed: {e}', file=sys.stderr)
        print('이미지 batch 모드는 preview 단계. sync 모드 권장.', file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['sync', 'batch'], default='sync')
    parser.add_argument('--limit', type=int, default=0, help='처리 개수 제한 (테스트용)')
    parser.add_argument('--slug', type=str, default=None, help='특정 slug 만 (id prefix)')
    parser.add_argument('--out-dir', type=str, default=str(OUTPUT_DIR))
    parser.add_argument('--sleep', type=float, default=1.5, help='sync 호출 간격(초)')
    args = parser.parse_args()

    api_key = get_api_key()
    batch_path, items = load_batch()
    print(f'batch source: {batch_path}', file=sys.stderr)
    print(f'total prompts: {len(items)}', file=sys.stderr)

    if args.slug:
        items = [i for i in items if i['id'].startswith(args.slug)]
        print(f'filtered by slug "{args.slug}": {len(items)}', file=sys.stderr)
    if args.limit:
        items = items[: args.limit]
        print(f'limit {args.limit}: {len(items)}', file=sys.stderr)

    out_dir = Path(args.out_dir)

    if args.mode == 'sync':
        sync_generate(items, api_key, out_dir, sleep_sec=args.sleep)
    else:
        batch_generate(items, api_key, batch_path)


if __name__ == '__main__':
    main()
