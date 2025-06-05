const OpenAI = require('openai');

/**
 * 텍스트에서 카테고리 및 일정 정보를 추출하는 함수
 * @param {string} text - 음성 인식 결과 텍스트
 * @returns {Promise<{category: string, title: string, startTime: string, endTime: string}>}
 */
async function classifyAndExtractSchedule(text) {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY
  });

  const prompt = `다음 문장에서 일정 정보를 추출해줘. 시간은 24시간제로 표시하고, 시작 시간과 종료 시간을 모두 포함해줘.
문장: "${text}"

응답 형식:
{
  "category": "카테고리",
  "title": "일정 제목",
  "startTime": "YYYY-MM-DD HH:mm",
  "endTime": "YYYY-MM-DD HH:mm"
}

카테고리는 다음 중 하나여야 함: school(학업), housework(집안일), work(업무), selfdev(자기계발), family(가족), health(건강), event(이벤트), goal(목표)
시간이 명시되지 않은 경우 현재 시간부터 1시간 후로 설정해줘.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '너는 일정 관리 도우미야. 사용자의 음성 입력을 분석해서 일정 정보를 추출해줘.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 256
  });

  const content = response.choices[0].message.content;
  try {
    const result = JSON.parse(content);
    // 현재 시간을 기본값으로 사용
    const now = new Date();
    if (!result.startTime) {
      result.startTime = now.toISOString();
    }
    if (!result.endTime) {
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
      result.endTime = endTime.toISOString();
    }
    return result;
  } catch (e) {
    console.error('OpenAI 응답 파싱 실패:', content);
    throw new Error('일정 정보를 추출하는데 실패했습니다. 다시 시도해주세요.');
  }
}

module.exports = { classifyAndExtractSchedule }; 