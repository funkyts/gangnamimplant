#!/usr/bin/env python3
"""
migrate_posts.py 가 SLUG_DICT 사전 누락으로 잘못 슬러그를 부여하거나 SKIP 한
7개 파일에 대해 (1) 정상 영문 슬러그 부여 + (2) SKIP 된 파일은 frontmatter 패치도 적용.

migrate_posts.py 의 변환 함수 재사용.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from migrate_posts import (  # noqa: E402
    load_post, dump_post, normalize_frontmatter, strip_bold,
    replace_banned, clean_external_links, ensure_references,
    MigrationReport, CONTENT_DIR,
)

FIXES = [
    # (현재 파일명, 새 영문 슬러그, 한글 원본 URL — 301 매핑용)
    ('02-15-05.mdx', 'implant-treatment-duration',
     '2026-02-15-05-임플란트-치료-기간은-단계별-과정-설명'),
    ('02-15-08.mdx', 'implant-temporary-tooth-cost',
     '2026-02-15-08-임플란트-시술-중-임시-치아-비용과-관리법'),
    ('untitled.mdx', 'sunday-dental-clinic', '일요일-치과'),
    ('dental-crown.mdx', 'dental-crown-price-comparison',
     '2026-02-15-07-2025년-치아-크라운-가격표-재질별-비용-차이'),
    ('치아미백.mdx', 'tooth-whitening', '치아미백'),
    ('치아미백제.mdx', 'tooth-whitening-agent', '치아미백제'),
    ('흡연-임플란트.mdx', 'smoking-implant', '흡연-임플란트'),
]

# SKIP 됐던 파일 — migrate 이력 없음, 룰북 호환 normalize 적용 필요
NEEDS_FULL_PATCH = {'치아미백.mdx', '치아미백제.mdx', '흡연-임플란트.mdx'}


def main():
    extra_redirects = []
    for old_name, new_slug, old_url in FIXES:
        old_path = CONTENT_DIR / old_name
        if not old_path.exists():
            print(f'  SKIP missing: {old_name}')
            continue

        fm, body, _ = load_post(old_path)
        if fm is None:
            print(f'  no fm: {old_name}')
            continue

        report = MigrationReport(file=str(old_path))

        if old_name in NEEDS_FULL_PATCH:
            fm = normalize_frontmatter(fm, old_name, report)
            body = strip_bold(body, report)
            body = replace_banned(body, report)
            body = clean_external_links(body, report)
            body = ensure_references(body, fm, report)

        fm['slug'] = new_slug

        new_path = CONTENT_DIR / f'{new_slug}.mdx'
        if new_path.exists() and new_path != old_path:
            print(f'  SKIP target exists: {old_name} → {new_path.name}')
            continue

        new_text = dump_post(fm, body)
        new_path.write_text(new_text, encoding='utf-8')
        if new_path != old_path:
            old_path.unlink()

        change_str = f' ({len(report.changes)} changes)' if report.changes else ''
        print(f'  {old_name} → {new_slug}.mdx{change_str}')
        extra_redirects.append({
            'source': f'/blog/{old_url}',
            'destination': f'/blog/{new_slug}/',
            'permanent': True,
        })

    # 추가 301 매핑 산출 (redirects.generated.json 에 append)
    import json
    redirects_path = Path(__file__).parent / 'redirects.generated.json'
    if redirects_path.exists():
        existing = json.loads(redirects_path.read_text(encoding='utf-8'))
    else:
        existing = []
    existing.extend(extra_redirects)
    redirects_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\n  301 매핑 총 {len(existing)}건 → {redirects_path}')


if __name__ == '__main__':
    main()
