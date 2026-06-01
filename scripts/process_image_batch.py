#!/usr/bin/env python3
"""
Gemini 생성 PNG 이미지 → WebP 최적화 + mdx frontmatter / 본문 갱신

작업:
1. public/images/blog/<slug>-hero.png (Gemini 출력)
   → <slug>-hero.webp (1200x1200, q82)
2. <slug>-info.png → <slug>-info.webp (1200x800)
3. mdx frontmatter:
   - featuredImage: /images/blog/<slug>-hero.webp
   - featuredImageAlt: (image_meta.json 의 alt)
4. mdx 본문:
   - 첫 H2 직후에 인포그래픽 inline 박기 (기존 본문 이미지 위치는 정리)
5. 기존 옛 이미지 파일 (의미 없는 타임스탬프 파일명) 백업 폴더로 이동

의존성:
  Pillow (pip install Pillow)
  PyYAML

사용법:
  python scripts/process_image_batch.py              # 전체
  python scripts/process_image_batch.py --slug X     # 단일
  python scripts/process_image_batch.py --dry-run    # 미리보기
  python scripts/process_image_batch.py --no-cleanup # 옛 이미지 백업 안 함
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
    from PIL import Image
except ImportError as e:
    print(f'ERROR: {e}. pip install Pillow PyYAML', file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / 'scripts'
CONTENT = REPO / 'content' / 'blog'
IMAGES = REPO / 'public' / 'images' / 'blog'

FM_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n(.*)', re.DOTALL)


def load_meta():
    path = SCRIPTS / 'image_meta.json'
    if not path.exists():
        print('ERROR: scripts/image_meta.json 없음. prepare_image_prompts.py 먼저.',
              file=sys.stderr)
        sys.exit(2)
    return json.loads(path.read_text(encoding='utf-8'))


def convert_to_webp(png_path: Path, webp_path: Path, target_size: tuple[int, int]):
    img = Image.open(png_path).convert('RGB')
    if img.size != target_size:
        img = img.resize(target_size, Image.LANCZOS)
    img.save(webp_path, format='WEBP', quality=82, method=6)
    return webp_path.stat().st_size


def patch_mdx(mdx_path: Path, slug: str, meta_entry: dict, dry_run: bool = False) -> bool:
    text = mdx_path.read_text(encoding='utf-8')
    m = FM_RE.match(text)
    if not m:
        print(f'  no frontmatter: {mdx_path.name}', file=sys.stderr)
        return False
    fm = yaml.safe_load(m.group(1)) or {}
    body = m.group(2)

    changed = False

    # frontmatter: featuredImage + featuredImageAlt
    hero_path = f'/images/blog/{meta_entry["hero"]["file"]}'
    if fm.get('featuredImage') != hero_path:
        fm['featuredImage'] = hero_path
        changed = True
    if fm.get('featuredImageAlt') != meta_entry['hero']['alt']:
        fm['featuredImageAlt'] = meta_entry['hero']['alt']
        changed = True

    # 본문: 기존 ![](...) 들 처리
    # 전략:
    #   (1) 본문 첫 H2 직전(또는 첫 H2 직후)에 hero 이미지가 이미 들어있으면 새 hero 경로로 교체
    #   (2) 기존 본문 이미지들은 모두 제거하고 첫 H2 직후에 인포그래픽 한 장만 박는다
    # 단순화: 본문 안 모든 `![...](/images/blog/...)` 를 제거 후 첫 H2 직후 인포그래픽 1장 박기
    body = re.sub(r'!\[[^\]]*\]\(/images/blog/[^\)]+\)\s*', '', body)

    # 인포그래픽 insert
    info_path = f'/images/blog/{meta_entry["info"]["file"]}'
    info_alt = meta_entry['info']['alt']
    info_line = f'\n![{info_alt}]({info_path})\n'

    h2_match = re.search(r'\n## [^\n]+\n', body)
    if h2_match:
        idx = h2_match.end()
        new_body = body[:idx] + info_line + body[idx:]
    else:
        new_body = body + info_line
    if new_body != body:
        body = new_body
        changed = True

    if dry_run:
        print(f'  [dry-run] would patch: {mdx_path.name}', file=sys.stderr)
        return changed

    if changed:
        yaml_text = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
        mdx_path.write_text(f'---\n{yaml_text}---\n{body}', encoding='utf-8')
        print(f'  patched: {mdx_path.name}', file=sys.stderr)
    return changed


def cleanup_old_images(meta: dict, dry_run: bool = False) -> int:
    """meta 가 알고 있는 새 파일명 외 옛 이미지 모두 백업 폴더로 이동."""
    new_files = set()
    for slug, e in meta.items():
        new_files.add(e['hero']['file'])
        new_files.add(e['info']['file'])
        # 원본 PNG 도 보존 (재변환용)
        new_files.add(e['hero']['file'].replace('.webp', '.png'))
        new_files.add(e['info']['file'].replace('.webp', '.png'))

    backup_dir = IMAGES.parent / f'blog_legacy_{datetime.now().strftime("%Y%m%d")}'
    moved = 0
    for f in IMAGES.iterdir():
        if f.is_file() and f.name not in new_files:
            if dry_run:
                print(f'  [dry-run] would move legacy: {f.name}', file=sys.stderr)
            else:
                if not backup_dir.exists():
                    backup_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(f), str(backup_dir / f.name))
            moved += 1
    if not dry_run and moved > 0:
        print(f'\n✓ moved {moved} legacy images → {backup_dir}', file=sys.stderr)
    return moved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--slug', type=str, help='특정 slug 만')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--no-cleanup', action='store_true')
    parser.add_argument('--no-convert', action='store_true', help='PNG→WebP 스킵 (mdx 만 갱신)')
    args = parser.parse_args()

    meta = load_meta()
    targets = {args.slug: meta[args.slug]} if args.slug else meta

    total_size = 0
    converted = 0
    patched = 0
    skipped = 0

    for slug, entry in targets.items():
        # WebP 변환
        if not args.no_convert:
            hero_png = IMAGES / f'{slug}-hero.png'
            hero_webp = IMAGES / entry['hero']['file']
            info_png = IMAGES / f'{slug}-info.png'
            info_webp = IMAGES / entry['info']['file']

            if hero_png.exists():
                if not args.dry_run:
                    sz = convert_to_webp(hero_png, hero_webp, (1200, 1200))
                    total_size += sz
                converted += 1
            elif not hero_webp.exists():
                print(f'  MISSING hero: {slug}', file=sys.stderr)
                skipped += 1
                continue

            if info_png.exists():
                if not args.dry_run:
                    sz = convert_to_webp(info_png, info_webp, (1200, 800))
                    total_size += sz
                converted += 1
            elif not info_webp.exists():
                print(f'  MISSING info: {slug}', file=sys.stderr)

        # mdx 갱신
        mdx_path = CONTENT / f'{slug}.mdx'
        if mdx_path.exists():
            if patch_mdx(mdx_path, slug, entry, dry_run=args.dry_run):
                patched += 1

    print(f'\n=== summary ===', file=sys.stderr)
    print(f'  converted: {converted} PNG→WebP', file=sys.stderr)
    print(f'  patched: {patched} mdx files', file=sys.stderr)
    print(f'  skipped: {skipped}', file=sys.stderr)
    if total_size:
        print(f'  new images total: {total_size / 1024:.1f} KB', file=sys.stderr)

    # cleanup
    if not args.no_cleanup and not args.slug:
        cleanup_old_images(meta, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
