require('dotenv').config(); // 환경 변수 로드. 최상단에 위치해야 합니다.

const mongoose = require('mongoose');
const app = require('./app'); // 분리된 app.js를 가져옵니다.

const PORT = process.env.PORT || 3000;

// DB 연결
mongoose.connect('mongodb://yes2310.duckdns.org:27017/scheduleApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
}); 