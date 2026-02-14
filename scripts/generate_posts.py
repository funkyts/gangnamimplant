import json
import os
import random
import datetime
import time
from pathlib import Path
from typing import List, Dict
import re

# 라이브러리 의존성을 줄이고 직접 제어하기 위해 requests 사용
import requests

# 설정
# .env.local 파일 등에서 환경변수로 ANTHROPIC_API_KEY가 로드되어 있어야 함
# 또는 직접 키를 입력받아야 함. 여기서는 환경변수 우선.
API_KEY = os.getenv("ANTHROPIC_API_KEY") 
CONTENT_DIR = Path("content/blog")

if not API_KEY:
    # 로컬 개발 환경의 .env.local 파일을 읽어오는 로직 추가 (필요 시)
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if line.startswith('ANTHROPIC_API_KEY='):
                    API_KEY = line.split('=')[1].strip().strip('"').strip("'")
                    break
    except:
        pass

if not API_KEY:
    print("Error: ANTHROPIC_API_KEY not found in environment variables or .env.local")
    exit(1)
else:
    # 키 검증용 출력 (보안상 일부만)
    print(f"Debug: API Key loaded. Starts with: {API_KEY[:5]}... Ends with: ...{API_KEY[-4:]}")

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def generate_post_content(topic, seo_rules, anchor_links):
    """
    Claude API를 사용하여 블로그 글 내용을 생성합니다. (requests 직접 호출)
    """
    
    # 앵커 링크 정보 문자열로 변환 (상위 7개 랜덤 선택하여 자연스럽게 유도)
    selected_anchors = random.sample(anchor_links, min(len(anchor_links), 7))
    anchor_info = "\n".join([f"- 문맥에 맞으면 자연스럽게 '{', '.join(link['keywords'])}' 관련 내용에서 [링크 텍스트]({link['url']}) 형태로 연결" for link in selected_anchors])

    prompt = f"""
{seo_rules}

---

## 작성 주제 정보
- **제목**: {topic['title']}
- **메인 키워드**: {topic['target_keyword']}
- **검색 의도**: {topic['search_intent']}
- **카테고리**: {topic['category']}

## 추가 지침 (매우 중요)
1. **함께 보면 좋은 글 (CTA 버튼)**:
   - 글의 중간과 끝부분에 각각 1개씩, 총 2개의 "함께 보면 좋은 글" 링크를 넣어주세요.
   - 단순 텍스트 링크가 아니라, 눈에 띄는 버튼 형태로 보이게 스타일링하거나 강조해주세요. (예: `> **함께 보면 좋은 글**: [제목](URL)`)
   - 링크 타겟은 위 앵커 링크 목록이나 블로그 내 다른 글을 참조하세요.

2. **자연스러운 앵커링 (필수)**:
   - 글을 작성하다가 아래 키워드나 관련 내용이 나오면 **자연스럽게** 텍스트에 하이퍼링크를 걸어주세요.
   - 억지로 끼워 넣지 말고, 흐름상 자연스러울 때만 넣으세요.
   {anchor_info}

3. **라이브치과 우호적 작성 (티 나지 않게)**:
   - "라이브치과를 가세요"라고 직접 광고하지 마세요.
   - 대신 "임상 경험이 풍부하고 사후관리를 평생 보장하는 병원을 찾으세요", "자체 기공실이 있는 곳이 유리합니다", "정품 인증서를 주는 곳인지 확인하세요" 등 **라이브치과의 장점을 '좋은 병원의 기준'으로 제시**하세요.
   - 독자가 읽고 나면 "아, 이런 조건을 갖춘 병원이 좋은 곳이구나"라고 느끼게 하고, 결국 라이브치과를 선택하게 유도하세요.

4. **형식**:
   - 마크다운 포맷 준수
   - 프론트매터(Frontmatter)는 제외하고 순수 본문만 작성해주세요.
   - 서론부터 바로 시작하세요.

위 가이드라인을 완벽히 지켜서, 검색 엔티티 최적화(SEO)된 고품질 원고를 작성해주세요.
"""

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    data = {
        "model": "claude-3-7-sonnet-20250219",
        "max_tokens": 4000,
        "temperature": 0.7,
        "system": "당신은 국내 최고의 치과 마케팅 전문 작가이자 SEO 전문가입니다. 독자의 공감을 이끌어내고 자연스럽게 설득하는 글쓰기에 탁월합니다.",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            return result['content'][0]['text']
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error generating content for {topic['title']}: {e}")
        return None

def save_post(topic, content, date, index):
    """
    생성된 글을 마크다운 파일로 저장합니다.
    """
    # Frontmatter 생성
    frontmatter = f"""---
title: "{topic['title']}"
description: "{topic['title']}에 대한 상세 가이드. {topic['target_keyword']} 정보와 꿀팁을 확인하세요."
date: "{date.strftime('%Y-%m-%d')}"
category: "{topic['category']}"
author: "강남임플란트"
---

"""
    
    # 파일명 생성 (YYYY-MM-DD-slug.md)
    # slug가 없으면 제목으로 생성
    slug = topic.get('slug')
    if not slug:
        slug = re.sub(r'[^a-zA-Z0-9가-힣]+', '-', topic['title']).strip('-')
    
    filename = f"{date.strftime('%Y-%m-%d')}-{index:02d}-{slug}.mdx"
    filepath = CONTENT_DIR / filename
    
    # 디렉토리 생성
    os.makedirs(CONTENT_DIR, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter + content)
    
    print(f"Saved: {filepath}")

def main():
    topics = load_json("content/blog-topics.json")
    seo_rules = load_file("prompts/seo-writing-rules.md")
    anchor_links = load_json("content/anchor_links.json")
    
    # 50개 글 생성
    # 하루에 10개씩 발행
    start_date = datetime.date.today()
    posts_per_day = 10
    
    print(f"Total topics: {len(topics)}")
    
    for i, topic in enumerate(topics):
        # 발행일 계산
        day_offset = i // posts_per_day
        publish_date = start_date + datetime.timedelta(days=day_offset)
        
        print(f"[{i+1}/{len(topics)}] Generating: {topic['title']} (Date: {publish_date})")
        
        # 실제 생성 (테스트 시에는 주석 처리하거나 1개만 실행)
        content = generate_post_content(topic, seo_rules, anchor_links)
        
        if content:
            save_post(topic, content, publish_date, i+1)
        else:
            print("Failed to generate content.")

if __name__ == "__main__":
    main()
