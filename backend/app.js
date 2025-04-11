// app.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const PORT = 3000;

// 1) CORS
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// 2) JSON body parser — 반드시 로그 미들웨어보다 먼저!
app.use(express.json());

// 3) 스케줄 로깅 미들웨어
app.use('/api/schedules', (req, res, next) => {
  console.log(`✅ [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('   ▶ Request Body:', req.body);
  }
  next();
});

// 4) 스케줄 라우터
app.use('/api/schedules', scheduleRoutes);

// 5) DB 연결
mongoose.connect('mongodb://yes2310.duckdns.org:27017/scheduleApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 6) 기본 라우트
app.get('/', (req, res) => res.send('🎉 서버 정상 작동 중!'));

// 7) 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});