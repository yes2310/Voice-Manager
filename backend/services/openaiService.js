const OpenAI = require('openai');

/**
 * 텍스트에서 카테고리 및 일정 정보를 추출하는 함수 (예시)
 * @param {string} text - 음성 인식 결과 텍스트
 * @returns {Promise<{category: string, title: string, date: string, time: string}>}
 */
async function classifyAndExtractSchedule(text) {
  // 함수 안에서 인스턴스 생성 (환경 변수 보장)
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `다음 문장에서 카테고리, 일정 제목, 시간(24시간제)을 JSON 형식으로 추출해줘.\n문장: "${text}"\n결과 예시: {"category": "회의", "title": "팀 회의", "time": "15:00"}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '너는 일정 관리 도우미야.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 256
  });

  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('OpenAI 응답 파싱 실패: ' + content);
  }
}

module.exports = { classifyAndExtractSchedule }; 