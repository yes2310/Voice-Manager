require('dotenv').config({ path: require('path').join(__dirname, '.env') }); // 환경 변수 로드. backend/.env를 명시적으로 지정

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const app = require('./app'); // 분리된 app.js를 가져옵니다.

const PORT = process.env.PORT || 3000;
const HTTP_PORT = 8080; // HTTP 포트 (80 대신 8080 사용 - 관리자 권한 불필요)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://yes2310.duckdns.org:27017/scheduleApp';

// DB 연결
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// HTTP에서 HTTPS로 리디렉션하는 미들웨어
const redirectToHTTPS = (req, res) => {
  const host = req.headers.host.split(':')[0]; // 포트 제거
  const redirectURL = `https://${host}:${PORT}${req.url}`;

  console.log(`🔄 HTTP → HTTPS 리디렉션: ${req.url} → ${redirectURL}`);

  res.writeHead(301, {
    'Location': redirectURL
  });
  res.end();
};

// SSL 인증서 경로 (Cloudflare Origin Certificate)
const sslKeyPath = path.join(__dirname, 'ssl', 'cloudflare-key.key');
const sslCertPath = path.join(__dirname, 'ssl', 'cloudflare-cert.pem');

// SSL 인증서 파일 존재 확인 및 생성
const ensureSSLCertificates = () => {
  const sslDir = path.join(__dirname, 'ssl');

  // ssl 디렉토리가 없으면 생성
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
  }

  // Cloudflare 인증서가 있는지 확인
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    console.log('🔒 Cloudflare Origin Certificate 사용 중');
    return;
  }

  // Cloudflare 인증서가 없으면 자체 서명된 인증서 생성
  console.log('🔐 자체 서명된 SSL 인증서를 생성합니다...');

  try {
    // 기본 자체 서명된 인증서 경로
    const fallbackKeyPath = path.join(__dirname, 'ssl', 'server.key');
    const fallbackCertPath = path.join(__dirname, 'ssl', 'server.crt');

    // selfsigned를 사용하여 자체 서명된 인증서 생성
    const attrs = [{ name: 'commonName', value: '220.68.27.138' }];
    const pems = selfsigned.generate(attrs, {
      days: 365,
      keySize: 2048,
      extensions: [{
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: '220.68.27.138' },
          { type: 2, value: 'localhost' },
          { type: 7, ip: '220.68.27.138' },
          { type: 7, ip: '127.0.0.1' }
        ]
      }]
    });

    // 파일 저장 (fallback 경로에 저장)
    fs.writeFileSync(fallbackKeyPath, pems.private);
    fs.writeFileSync(fallbackCertPath, pems.cert);

    console.log('⚠️  자체 서명된 SSL 인증서 생성 완료 (Cloudflare 인증서를 권장합니다)');
  } catch (error) {
    console.error('❌ SSL 인증서 생성 실패:', error.message);
    throw error;
  }
};

// SSL 인증서 확인/생성
ensureSSLCertificates();

// HTTPS 서버 옵션
const httpsOptions = {
  key: fs.readFileSync(sslKeyPath),
  cert: fs.readFileSync(sslCertPath)
};

// 개발 환경에서는 HTTP만 사용 (HTTPS 복잡성 제거)
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  // 개발 환경: HTTP만 사용
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HTTP 서버 실행 중 (개발모드): http://0.0.0.0:${PORT}`);
    console.log('환경 변수 확인:', {
      PORT: process.env.PORT,
      MONGODB_URI: process.env.MONGODB_URI,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
    });
  });
} else {
  // 프로덕션 환경: HTTPS 사용
  // HTTP 서버 실행 (HTTPS로 리디렉션)
  http.createServer(redirectToHTTPS).listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`🔄 HTTP 리디렉션 서버 실행 중: http://0.0.0.0:${HTTP_PORT} → https://0.0.0.0:${PORT}`);
  });

  // HTTPS 서버 실행 (모든 인터페이스에서 접속 가능)
  https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HTTPS 서버 실행 중: https://0.0.0.0:${PORT}`);
    console.log(`📱 외부 접속: https://220.68.27.138:${PORT}`);
    console.log('환경 변수 확인:', {
      PORT: process.env.PORT,
      MONGODB_URI: process.env.MONGODB_URI,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
    });
  });
} 