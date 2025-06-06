import os
from openai import OpenAI
from datetime import datetime, timedelta
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# OpenAI 클라이언트 인스턴스 생성
client = OpenAI(api_key=api_key)

CATEGORY_MAPPING = {
    "school": "학업",
    "housework": "가사",
    "work": "업무",
    "selfdev": "자기계발",
    "family": "가족",
    "health": "건강",
    "event": "행사",
    "goal": "목표",
}


def get_today_string(offset=0):
    return (datetime.now() + timedelta(days=offset)).strftime("%Y-%m-%d")


def classify_and_extract_schedule(text):
    today = get_today_string()
    tomorrow = get_today_string(1)
    day_after = get_today_string(2)
    three_days_later = get_today_string(3)

    prompt = f"""당신은 일정을 분석하는 AI 어시스턴트입니다. 
다음 카테고리 중 하나를 선택하여 일정을 분류해주세요:
- school (학업): 학교, 학원, 공부, 시험, 과제 관련
- housework (가사): 청소, 빨래, 요리, 정리 등 가사 관련
- work (업무): 회의, 프로젝트, 업무 관련
- selfdev (자기계발): 독서, 운동, 취미, 강의 등 개인 성장 관련
- family (가족): 가족 모임, 가족 행사, 가족 관련
- health (건강): 병원, 건강검진, 운동, 식단 관련
- event (행사): 모임, 파티, 축하, 기념일 등 행사 관련
- goal (목표): 목표 달성, 계획, 리뷰 관련

현재 날짜: {today}

응답은 다음 JSON 형식으로 해주세요:
{{
  "title": "일정 제목",
  "startTime": "YYYY-MM-DD HH:mm",
  "endTime": "YYYY-MM-DD HH:mm",
  "category": "카테고리 코드",
  "isAllDay": true
}}

날짜 처리 규칙:
1. 날짜가 언급되지 않은 경우 {today} 사용
2. "오늘"은 {today} 사용
3. "내일"은 {tomorrow} 사용
4. "모레"는 {day_after} 사용
5. "글피"는 {three_days_later} 사용

시간 처리 규칙:
1. "오전/아침"은 00:00-11:59
2. "오후"는 12:00-23:59
3. "저녁"은 18:00-23:59
4. "새벽"은 00:00-05:59
5. 시간이 언급되지 않은 경우 하루종일로 설정
"""

    print("GPT에 요청 중...")

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": text},
        ],
        temperature=0.7,
        max_tokens=500,
    )

    content = response.choices[0].message.content
    print("GPT 응답:\n", content)

    try:
        result = eval(content) if isinstance(content, str) else content
    except Exception:
        raise ValueError("GPT 응답을 JSON 형식으로 해석할 수 없습니다.")

    if not result.get("title") or not result.get("category"):
        raise ValueError("일정 제목 또는 카테고리가 누락되었습니다.")

    if result["category"] not in CATEGORY_MAPPING:
        raise ValueError("유효하지 않은 카테고리 코드입니다.")

    return result
