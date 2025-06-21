require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // organization: process.env.OPENAI_ORG_ID, // 필요시 주석 해제
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello! Summarize today\'s schedule.' }
      ],
      max_tokens: 50,
    });
    console.log('✅ OpenAI 응답:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI 요청 에러:', error.status, error.message);
    if (error.response) {
      console.error('상세 에러:', await error.response.json());
    }
  }
}

testOpenAI();