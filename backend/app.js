// app.js

const express = require('express');
const cors = require('cors');
const scheduleRoutes = require('./routes/scheduleRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 1) CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// 2) JSON body parser — 반드시 로그 미들웨어보다 먼저!
app.use(express.json());

// 3) 모든 요청에 대한 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '********';
    console.log('Body:', logBody);
  }
  next();
});

// 4) 라우터 설정
app.use('/api/schedules', scheduleRoutes);
app.use('/api/auth', authRoutes);

// 6) 기본 라우트 (DB 연결 및 서버 실행 로직 제거 후)
app.get('/', (req, res) => res.send('🎉 서버 정상 작동 중!'));

// 7) 에러 핸들링 미들웨어 (DB 연결 및 서버 실행 로직 제거 후)
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

module.exports = app; // 앱 모듈 내보내기