require('dotenv').config({ path: require('path').join(__dirname, '.env') }); // 환경 변수 로드. backend/.env를 명시적으로 지정

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const app = require('./app'); // 분리된 app.js를 가져옵니다.

// 포트와 환경 설정 (하드코딩)
const HTTPS_PORT = 3000; // 내부 HTTPS 포트 (고정)
const HTTP_PORT = 80; // HTTP 표준 포트 (외부 접속용)
const NODE_ENV = 'production'; // 프로덕션 모드 (고정)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://yes2310.duckdns.org:27017/scheduleApp';

// DB 연결
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// HTTP에서 HTTPS로 리디렉션하는 미들웨어
const redirectToHTTPS = (req, res) => {
  const host = req.headers.host.split(':')[0]; // 포트 번호 제거
  const redirectUrl = `https://${host}`;
  console.log(`🔄 HTTP → HTTPS 리다이렉트: ${req.url} → ${redirectUrl}${req.url}`);
  res.writeHead(301, { Location: `${redirectUrl}${req.url}` });
  res.end();
};

// SSL 인증서 경로 (Cloudflare Origin Certificate)
const sslKeyPath = path.join(__dirname, 'ssl', 'cloudflare-key.key');
const sslCertPath = path.join(__dirname, 'ssl', 'cloudflare-cert.pem');

let sslOptions;

// SSL 인증서 확인 및 로드
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };
  console.log('🔒 Cloudflare Origin Certificate 사용 중');
} else {
  // SSL 인증서가 없으면 자체 서명 인증서 생성
  console.log('⚠️ SSL 인증서를 찾을 수 없습니다. 자체 서명 인증서를 생성합니다...');
  
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });
  
  sslOptions = {
    key: pems.private,
    cert: pems.cert,
  };
  console.log('🔑 자체 서명 SSL 인증서 생성 완료');
}

// HTTP 리디렉션 서버 생성 및 시작
const httpServer = http.createServer(redirectToHTTPS);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`🔄 HTTP 리디렉션 서버 실행 중: http://0.0.0.0:${HTTP_PORT} → https://yes2310.xyz`);
});

// HTTPS 서버 생성 및 시작
const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTPS 서버 실행 중: https://0.0.0.0:${HTTPS_PORT}`);
  console.log(`📱 로컬 접속: https://localhost:${HTTPS_PORT}`);
  console.log(`🌐 외부 접속은 리버스 프록시를 통해: https://yes2310.xyz`);
  console.log(`💡 리버스 프록시 설정 필요: 80/443 → ${HTTPS_PORT}`);
});

// 에러 핸들링
httpsServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${HTTPS_PORT}이 이미 사용 중입니다. 다른 포트를 사용하거나 실행 중인 프로세스를 종료하세요.`);
  } else {
    console.error('❌ HTTPS 서버 에러:', err.message);
  }
  process.exit(1);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${HTTP_PORT}이 이미 사용 중입니다.`);
  } else {
    console.error('❌ HTTP 서버 에러:', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 서버 종료 신호 받음...');
  httpsServer.close(() => {
    console.log('✅ HTTPS 서버 종료됨');
  });
  httpServer.close(() => {
    console.log('✅ HTTP 서버 종료됨');
  });
  mongoose.connection.close();
}); 