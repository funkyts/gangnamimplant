#!/usr/bin/env python3
"""
48개 글 frontmatter 분석 → Nano Banana 2 배치용 image_prompt + image_alt 산출

규칙: _rules/14-IMAGE_RULES_NB2.md
- 글당 2장: hero (의학 일러스트) + infographic (비교/단계 카드)
- 5블록 프롬프트 구조 (SUBJECT → STYLE → COMPOSITION → COLOR → STRICT RULES)
- alt: 한글, 30-60자, 메인 키워드 포함, 의료광고법 금지어 0

출력:
- scripts/image_batch_YYYYMMDD.jsonl  (Gemini Batch 입력)
- scripts/image_meta.json  (slug별 hero/info 파일명 + alt 매핑, 후속 mdx 갱신용)
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print('PyYAML required: pip install pyyaml', file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent
CONTENT = REPO / 'content' / 'blog'

FM_RE = re.compile(r'^---\s*\n(.*?)\n---', re.DOTALL)

# ── 카테고리 → 시각 컨셉 매핑 (_rules/14 §2) ─────────────────
HERO_CONCEPTS = {
    'implant-price': 'a single dental implant fixture (titanium screw shape) standing upright beside a small stack of three plain coins on a clean surface',
    'implant-procedure': 'a stylized 4-step dental implant procedure diagram (placement → osseointegration → abutment → crown) arranged horizontally with simple icons',
    'implant-care': 'a still life of a toothbrush, an interdental brush, and a small dental floss container arranged neatly on a clean surface',
    'implant-brands': 'two minimal dental implant fixture silhouettes side by side without any labels, one slightly taller than the other',
    'implant-insurance': 'a single clean document sheet (no readable text) with a tiny dental implant fixture lying on top, beside a simple pen',
    'dental-crown': 'three minimal dental crown shapes in a row (each a slightly different soft color tone), abstract not detailed',
    'dental-general': 'a stylized cross-section of a healthy tooth showing simplified internal structure (enamel, dentin, pulp) with clean labels removed',
    'dental-clinic-guide': 'a minimal dental clinic chair with overhead light, completely unoccupied, in a calm room with no people',
    'cosmetic-dentistry': 'a tooth whitening tray and a small tube arranged on a clean surface, with a tiny mirror in soft focus',
    'orthodontics': 'four minimal orthodontic appliance icons in a row (metal, ceramic, clear aligner, lingual) without any text labels',
    'dental-prosthetic': 'a single dental crown abstract shape resting on a clean cloth, soft lighting',
    'preventive-treatment': 'a dental scaler tool and a small mouthwash bottle arranged minimally',
    'general-treatment': 'a single tooth with a faint root indication, abstract and clean, on a soft white surface',
    'treatment-comparison': 'two contrasting dental treatment icons side by side on a balance-scale composition (one implant fixture, one bridge silhouette), abstract',
}

INFO_CONCEPTS = {
    'implant-price': 'comparing 국산 vs 수입 dental implant average price ranges (e.g. 80–120만원 / 150–250만원) in two-column card layout',
    'implant-procedure': 'showing 4 implant treatment stages (1단계: 진단, 2단계: 식립, 3단계: 골유합, 4단계: 보철) as numbered horizontal cards with duration ranges',
    'implant-care': 'daily implant care checklist with 4 numbered items (아침, 식후, 저녁, 정기검진) as vertical cards',
    'implant-brands': 'comparing 국산 (오스템 등) vs 수입 (스트라우만 등) implant brand characteristics in two-column layout (no actual brand names rendered)',
    'implant-insurance': 'showing 65세 이상 implant insurance application 3-step flow (자격 확인 → 진료 → 청구) as horizontal numbered cards',
    'dental-crown': 'comparing 지르코니아 / 올세라믹 / PFM crown types in 3 vertical cards with key feature labels (1-2 Korean words each)',
    'dental-general': 'showing 3 dental treatment phases (예방 / 진단 / 치료) as numbered horizontal cards',
    'dental-clinic-guide': 'a checklist of 5 dental clinic selection criteria (전문의, 장비, 경험, 비용, 사후관리) as numbered vertical cards',
    'cosmetic-dentistry': 'comparing 전문가 미백 vs 자가 미백 in two-column card layout with effect and duration labels',
    'orthodontics': 'comparing 4 orthodontic methods (메탈, 세라믹, 투명, 설측) cost and duration in 4-column card layout',
    'dental-prosthetic': 'comparing 크라운 vs 브릿지 vs 임플란트 in 3-column card layout',
    'preventive-treatment': '3-step preventive dental care flow (스케일링 → 검진 → 관리) as numbered cards',
    'general-treatment': '3 general dental treatment categories (충치, 신경, 잇몸) as 3-column cards',
    'treatment-comparison': 'two-column comparison of two treatments with pros/cons labels',
}


# ── Slug-specific overrides (특정 글에 더 정확한 컨셉 매핑) ─────
SLUG_OVERRIDES = {
    'implant-1unit-price-guide': {
        'hero_extra': 'with a focus on a single titanium implant fixture',
        'info_topic': 'comparing 국산 (80-120만원) vs 수입 (150-250만원) implant price ranges in two large cards',
    },
    'implant-29man-truth': {
        'hero': 'a single plain coin and a separate small dental implant fixture on a clean surface, suggesting the gap between advertised and actual price',
        'info_topic': 'breakdown of hidden implant costs (광고가, 지대주, 크라운, 뼈이식) in 4 vertical cards',
    },
    'osstem-implant-price': {
        'hero': 'a minimal dental implant fixture silhouette in soft profile (no logo or brand mark) on a clean surface beside small coins',
        'info_topic': 'comparing implant grade options (SA, SOI, premium) price ranges in 3 vertical cards (no brand names)',
    },
    'implant-bone-graft-process': {
        'hero': 'a stylized cross-section of a jawbone with a small implant fixture being placed, surrounded by tiny abstract bone graft particles (small dots)',
        'info_topic': 'showing bone graft types (자가골, 동종골, 이종골, 합성골) characteristics in 4-column card layout',
    },
    'dental-crown-types': {
        'hero': 'three abstract dental crown shapes side by side in subtly different tones (each labeled 지르코니아 / 올세라믹 / PFM with single short labels)',
        'info_topic': 'comparing 지르코니아 / 올세라믹 / PFM crowns (강도, 심미성, 가격) in 3-column card layout',
    },
    'sunday-dental-clinic': {
        'hero': 'a minimal clock showing 일요일 mark with a calm dental clinic icon, no people',
        'info_topic': 'weekend dental clinic visit checklist as numbered cards',
    },
    'smoking-implant': {
        'hero': 'a small dental implant fixture beside a stylized no-smoking icon, very minimal, no actual cigarette',
        'info_topic': 'smoking cessation timeline before implant (1주, 2주, 1개월, 2개월) as horizontal stage cards',
    },
}


def load_post(path: Path):
    text = path.read_text(encoding='utf-8')
    m = FM_RE.match(text)
    if not m:
        return None
    return yaml.safe_load(m.group(1)) or {}


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
        f'A clean Korean editorial infographic {topic}, '
        'numbered card style with rounded corners or two-column comparison layout, '
        'short Korean labels in clean sans-serif (1-2 Korean words per label only, e.g. 국산 / 수입 / 1단계), '
        'large numerical range labels with bold typography where applicable, '
        'soft white background #FFFFFF, light gray section dividers, '
        'clinical blue #0066CC accent on numbers and headers, '
        'single mustard #C9A227 highlight for emphasis (use sparingly, max 1 spot), '
        'flat illustration aesthetic, generous white space, '
        'strict rules: no people, no faces, no brand logos, no detailed body text sentences, '
        'no religious symbols, 3:2 aspect ratio (1200×800)'
    )


def make_alt(fm: dict, kind: str, subject_hint: str) -> str:
    """한글 alt 생성. 메인 키워드 포함, 30~60자."""
    title = fm.get('title') or ''
    # 메인 키워드는 keywords[0] 또는 title 첫 부분
    kws = fm.get('keywords')
    if isinstance(kws, list) and kws:
        main_kw = kws[0]
    elif isinstance(kws, str):
        main_kw = kws.split(',')[0].strip()
    else:
        main_kw = title.split(' - ')[0].split(' ')[0]

    if kind == 'hero':
        alt = f'{subject_hint} — {main_kw} 안내 일러스트'
    else:
        alt = f'{main_kw} 비교 인포그래픽 — {subject_hint}'

    # 60자 제한
    if len(alt) > 58:
        alt = alt[:57] + '…'
    return alt


HERO_KOREAN_HINT = {
    'implant-price': '임플란트 픽스처와 동전 정물',
    'implant-procedure': '임플란트 시술 4단계 도해',
    'implant-care': '칫솔과 치간칫솔 관리 도구 정물',
    'implant-brands': '임플란트 브랜드 비교 도해',
    'implant-insurance': '임플란트 보험 서류 정물',
    'dental-crown': '크라운 종류 비교 도해',
    'dental-general': '치아 단면 해부 도해',
    'dental-clinic-guide': '단순 진료실 인테리어 정물',
    'cosmetic-dentistry': '치아 미백 도구 정물',
    'orthodontics': '교정 장치 4종 도해',
    'dental-prosthetic': '보철 크라운 정물',
    'preventive-treatment': '예방 치료 도구 정물',
    'general-treatment': '치아 단면 도해',
    'treatment-comparison': '치료 비교 도해',
}

INFO_KOREAN_HINT = {
    'implant-price': '국산·수입 가격 범위 비교',
    'implant-procedure': '시술 단계별 진료 일정',
    'implant-care': '일일 관리 체크리스트',
    'implant-brands': '국산·수입 브랜드 특징 비교',
    'implant-insurance': '65세 보험 적용 흐름',
    'dental-crown': '크라운 종류별 특징 비교',
    'dental-general': '진료 3단계 흐름',
    'dental-clinic-guide': '치과 선택 5가지 체크',
    'cosmetic-dentistry': '미백 방법별 효과 비교',
    'orthodontics': '교정 방법별 비용·기간',
    'dental-prosthetic': '크라운·브릿지·임플란트 비교',
    'preventive-treatment': '예방 관리 3단계',
    'general-treatment': '일반 진료 카테고리',
    'treatment-comparison': '치료 옵션 비교',
}

# 카테고리 → slug 매핑 (frontmatter.category 한글 → 영문 slug)
CAT_KOR_TO_SLUG = {
    '임플란트 가격': 'implant-price',
    '임플란트-비용': 'implant-price',
    '임플란트 비용': 'implant-price',
    '임플란트 시술': 'implant-procedure',
    '임플란트 관리': 'implant-care',
    '임플란트 브랜드': 'implant-brands',
    '임플란트 종류': 'implant-brands',
    '임플란트 보험': 'implant-insurance',
    '치아 크라운': 'dental-crown',
    '치아 보철': 'dental-prosthetic',
    '일반 치과 정보': 'dental-general',
    '치과 정보': 'dental-general',
    '치과 선택 가이드': 'dental-clinic-guide',
    '심미 치료': 'cosmetic-dentistry',
    '치아 교정': 'orthodontics',
    '예방 치료': 'preventive-treatment',
    '일반 치료': 'general-treatment',
    '치료 비교': 'treatment-comparison',
}


def main():
    posts = sorted(CONTENT.glob('*.mdx'))
    print(f'분석 대상: {len(posts)} 글', file=sys.stderr)

    batch = []
    meta = {}

    for p in posts:
        fm = load_post(p)
        if fm is None:
            continue

        slug = fm.get('slug') or p.stem
        cat_kor = fm.get('category', '')
        cat_slug = CAT_KOR_TO_SLUG.get(cat_kor, 'dental-general')

        override = SLUG_OVERRIDES.get(slug, {})

        # Hero
        hero_subject = override.get('hero') or override.get('hero_extra') or HERO_CONCEPTS.get(cat_slug, HERO_CONCEPTS['dental-general'])
        if 'hero_extra' in override and 'hero' not in override:
            hero_subject = f"{HERO_CONCEPTS.get(cat_slug, HERO_CONCEPTS['dental-general'])}, {override['hero_extra']}"
        hero_prompt = make_hero_prompt(hero_subject)
        hero_alt = make_alt(fm, 'hero', HERO_KOREAN_HINT.get(cat_slug, '의학 일러스트'))

        # Info
        info_topic = override.get('info_topic') or INFO_CONCEPTS.get(cat_slug, INFO_CONCEPTS['dental-general'])
        info_prompt = make_info_prompt(info_topic)
        info_alt = make_alt(fm, 'info', INFO_KOREAN_HINT.get(cat_slug, '비교 인포그래픽'))

        # Batch lines
        batch.append({'id': f'{slug}-hero', 'prompt': hero_prompt})
        batch.append({'id': f'{slug}-info', 'prompt': info_prompt})

        meta[slug] = {
            'hero': {
                'file': f'{slug}-hero.webp',
                'alt': hero_alt,
                'prompt': hero_prompt,
            },
            'info': {
                'file': f'{slug}-info.webp',
                'alt': info_alt,
                'prompt': info_prompt,
            },
        }

    # Output
    today = datetime.now().strftime('%Y%m%d')
    batch_path = Path(__file__).parent / f'image_batch_{today}.jsonl'
    meta_path = Path(__file__).parent / 'image_meta.json'

    with batch_path.open('w', encoding='utf-8') as f:
        for line in batch:
            f.write(json.dumps(line, ensure_ascii=False) + '\n')
    with meta_path.open('w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f'\n✓ batch: {batch_path} ({len(batch)} prompts)', file=sys.stderr)
    print(f'✓ meta: {meta_path} ({len(meta)} posts)', file=sys.stderr)
    print(f'\n총 글: {len(meta)}, 총 이미지: {len(batch)} (글당 2장)', file=sys.stderr)
    print(f'배치 예상 비용 (~$0.034/img): ${len(batch) * 0.034:.2f}', file=sys.stderr)


if __name__ == '__main__':
    main()
