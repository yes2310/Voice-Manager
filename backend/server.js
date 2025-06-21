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
const HTTP_PORT = 80; // HTTP 표준 포트 (80)
const NODE_ENV = 'production'; // 프로덕션 모드 (고정)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://yes2310.duckdns.org:27017/scheduleApp';

// DB 연결
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// HTTP에서 HTTPS로 리디렉션하는 미들웨어
const redirectToHTTPS = (req, res) => {
  const host = req.headers.host.split(':')[0]; // 포트 제거
  const redirectURL = `https://${host}${req.url}`;

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
const isDevelopment = NODE_ENV !== 'production';

if (isDevelopment) {
  // 개발 환경: HTTP만 사용
  http.createServer(app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🚀 HTTP 서버 실행 중 (개발모드): http://0.0.0.0:${HTTPS_PORT}`);
    console.log(`📱 로컬 접속: http://localhost:${HTTPS_PORT}`);
    console.log('환경 변수 확인:', {
      PORT: HTTPS_PORT,
      MONGODB_URI: MONGODB_URI,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
    });
  });
} else {
  // 프로덕션 환경: HTTP 리다이렉트 서버 + HTTPS 메인 서버
  
  // HTTP 리다이렉트 서버 (80 포트) - 관리자 권한 필요할 수 있음
  http.createServer(redirectToHTTPS).listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`🔄 HTTP 리디렉션 서버 실행 중: http://0.0.0.0:${HTTP_PORT} → https://yes2310.xyz`);
  });

  // HTTPS 메인 서버 (3000 포트)
  https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🚀 HTTPS 서버 실행 중: https://0.0.0.0:${HTTPS_PORT}`);
    console.log(`📱 로컬 접속: https://localhost:${HTTPS_PORT}`);
    console.log(`🌐 외부 접속: https://yes2310.xyz`);
    console.log('💡 포트 설정:');
    console.log(`   - HTTP(${HTTP_PORT}) → HTTPS 리다이렉트`);
    console.log(`   - HTTPS(${HTTPS_PORT}) → 메인 서버`);
    console.log('환경 변수 확인:', {
      HTTPS_PORT: HTTPS_PORT,
      HTTP_PORT: HTTP_PORT,
      NODE_ENV: NODE_ENV,
      MONGODB_URI: MONGODB_URI,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
    });
  });
} 