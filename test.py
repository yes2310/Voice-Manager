from schedule_classifier import classify_and_extract_schedule

if __name__ == "__main__":
    user_input = "오늘 오후 10시부터 11시까지 학교 팀플 있어"
    try:
        result = classify_and_extract_schedule(user_input)
        print("최종 결과:", result)
    except Exception as e:
        print("오류 발생:", e)
