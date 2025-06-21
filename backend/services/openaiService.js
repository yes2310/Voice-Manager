const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CATEGORY_MAPPING = {
  school: '학업',
  housework: '가사',
  work: '업무',
  selfdev: '자기계발',
  family: '가족',
  health: '건강',
  event: '행사',
  goal: '목표',
};

function getDateString(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/**
 * 텍스트에서 카테고리 및 일정 정보를 추출하는 함수
 * @param {string} text - 음성 인식 결과 텍스트
 * @returns {Promise<{category: string, title: string, startTime: string, endTime: string, isAllDay: boolean}>}
 */
const classifyAndExtractSchedule = async (text) => {
  try {
    console.log('OpenAI API 호출 시작:', text);

    const today = getDateString(0);
    const tomorrow = getDateString(1);
    const dayAfter = getDateString(2);

    const systemPrompt = `당신은 일정을 분석하는 AI 어시스턴트입니다. 
다음 카테고리 중 하나를 선택하여 일정을 분류해주세요:
- school (학업): 학교, 학원, 공부, 시험, 과제 관련
- housework (가사): 청소, 빨래, 요리, 정리 등 가사 관련
- work (업무): 회의, 프로젝트, 업무 관련
- selfdev (자기계발): 독서, 운동, 취미, 강의 등 개인 성장 관련
- family (가족): 가족 모임, 가족 행사, 가족 관련
- health (건강): 병원, 건강검진, 운동, 식단 관련
- event (행사): 모임, 파티, 축하, 기념일 등 행사 관련
- goal (목표): 목표 달성, 계획, 리뷰 관련

현재 날짜: ${today}

응답은 다음 JSON 형식으로 해주세요:
{
  "title": "일정 제목",
  "startTime": "YYYY-MM-DD HH:mm",
  "endTime": "YYYY-MM-DD HH:mm",
  "category": "카테고리 코드",
  "isAllDay": true/false
}

날짜 처리 규칙:
1. 날짜가 언급되지 않은 경우 ${today} 사용
2. "오늘"은 ${today} 사용
3. "내일"은 ${tomorrow} 사용
4. "모레"는 ${dayAfter} 사용

시간 처리 규칙:
1. "오전/아침"은 00:00-11:59
2. "오후"는 12:00-23:59
3. "저녁"은 18:00-23:59
4. "새벽"은 00:00-05:59
5. 시간이 언급되지 않은 경우 하루종일로 설정

예시:
- "오늘 오후 2시 회의" -> startTime: "${today} 14:00", endTime: "${today} 15:00"
- "내일 아침 9시 미팅" -> startTime: "${tomorrow} 09:00", endTime: "${tomorrow} 10:00"
- "모레 저녁 7시 저녁 약속" -> startTime: "${dayAfter} 19:00", endTime: "${dayAfter} 20:00"
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('OpenAI API 응답:', response.choices[0].message.content);

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch (e) {
      // JSON이 아니면 에러 메시지 반환
      throw new Error('일정 정보를 추출하는데 실패했습니다. 다시 시도해주세요.');
    }

    if (!result.title || !result.category) {
      throw new Error('일정 제목과 카테고리를 모두 말씀해 주세요.');
    }
    if (!Object.keys(CATEGORY_MAPPING).includes(result.category)) {
      throw new Error('유효하지 않은 카테고리입니다.');
    }

    if (!result.startTime) {
      result.startTime = `${today} 00:00`;
      result.endTime = `${today} 23:59`;
      result.isAllDay = true;
    }

    return result;
  } catch (error) {
    console.error('OpenAI API 호출 중 오류:', error);
    if (error.message.includes('JSON')) {
      throw new Error('일정 정보를 추출하는데 실패했습니다. 다시 시도해주세요.');
    }
    if (error.code === 'invalid_api_key') {
      throw new Error('OpenAI API 키가 유효하지 않습니다. 관리자에게 문의해주세요.');
    }
    throw new Error('일정 분석 중 오류가 발생했습니다: ' + error.message);
  }
};

module.exports = {
  classifyAndExtractSchedule,
};
