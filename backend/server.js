require('dotenv').config(); // 환경 변수 로드. 최상단에 위치해야 합니다.

const mongoose = require('mongoose');
const app = require('./app'); // 분리된 app.js를 가져옵니다.

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-manager';

// DB 연결
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log('환경 변수 확인:', {
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
  });
}); 