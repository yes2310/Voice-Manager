const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// SSL 인증서 디렉토리 생성
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir);
}

console.log('🔐 자체 서명 SSL 인증서 생성 중...');

try {
  // OpenSSL이 설치되어 있는지 확인
  try {
    execSync('openssl version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ OpenSSL이 설치되지 않았습니다.');
    console.log('Windows에서 OpenSSL 설치 방법:');
    console.log('1. https://slproweb.com/products/Win32OpenSSL.html 에서 다운로드');
    console.log('2. 또는 Git Bash 사용: openssl 명령어 사용 가능');
    console.log('3. 또는 WSL 사용');
    process.exit(1);
  }

  // 자체 서명 인증서 생성
  const certPath = path.join(sslDir, 'cert.pem');
  const keyPath = path.join(sslDir, 'key.pem');

  const openSSLCommand = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=VoiceManager/OU=Dev/CN=localhost"`;

  execSync(openSSLCommand, { stdio: 'inherit' });

  console.log('✅ SSL 인증서가 성공적으로 생성되었습니다!');
  console.log(`📄 인증서 파일: ${certPath}`);
  console.log(`🔑 키 파일: ${keyPath}`);
  console.log('');
  console.log('🚀 이제 HTTPS 서버를 시작할 수 있습니다.');
  console.log('⚠️  브라우저에서 "안전하지 않음" 경고가 표시되면 "고급" > "localhost로 이동"을 클릭하세요.');

} catch (error) {
  console.error('❌ 인증서 생성 실패:', error.message);
  console.log('');
  console.log('💡 대안: Git Bash 또는 WSL에서 실행해보세요:');
  console.log('openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=VoiceManager/OU=Dev/CN=localhost"');
} 