// app.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
const scheduleRoutes = require('./routes/scheduleRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 동적 ORIGIN 설정
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://localhost:3000',
    'https://localhost:3001',
    /https?:\/\/.*\.ngrok\.io$/,
  ];
  
  // 현재 서버의 IP 주소를 자동으로 추가
  const PORT = process.env.PORT || 3001;
  const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
  
  // 현재 시스템의 모든 네트워크 인터페이스에서 IP 주소 수집
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(interface => {
      if (!interface.internal && interface.family === 'IPv4') {
        const ip = interface.address;
        origins.push(`http://${ip}:${PORT}`);
        origins.push(`https://${ip}:${PORT}`);
        origins.push(`http://${ip}:${FRONTEND_PORT}`);
        origins.push(`https://${ip}:${FRONTEND_PORT}`);
      }
    });
  });
  
  // 환경 변수로 설정된 호스트가 있으면 사용
  if (process.env.HOST) {
    origins.push(`http://${process.env.HOST}:${PORT}`);
    origins.push(`https://${process.env.HOST}:${PORT}`);
    origins.push(`http://${process.env.HOST}:${FRONTEND_PORT}`);
    origins.push(`https://${process.env.HOST}:${FRONTEND_PORT}`);
  }
  
  return origins;
};

// 1) CORS
app.use(cors({
  origin: getAllowedOrigins(),
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

// 5) 정적 파일 서빙 (프로덕션 배포용)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 6) 기본 라우트 (DB 연결 및 서버 실행 로직 제거 후)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// 7) 에러 핸들링 미들웨어 (DB 연결 및 서버 실행 로직 제거 후)
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

module.exports = app; // 앱 모듈 내보내기