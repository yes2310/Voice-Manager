const jwt = require('jsonwebtoken');

// JWT 시크릿 키 (실제 프로덕션에서는 환경 변수로 관리)
const JWT_SECRET = 'your_jwt_secret_key';

// JWT 인증 미들웨어
const auth = (req, res, next) => {
  // 현재 경로 로깅
  console.log(`[인증] 요청 경로: ${req.originalUrl}`);
  
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('[인증] 실패: 토큰 없음');
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('[인증] 실패: 잘못된 토큰 형식');
      return res.status(401).json({ error: '유효하지 않은 토큰 형식입니다' });
    }
    
    // Bearer 접두사 제거
    const token = authHeader.substring(7);
    
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 검증된 사용자 정보를 요청 객체에 추가
    req.user = decoded;
    console.log(`[인증] 성공: 사용자 ID ${decoded.userId}`);
    
    next();
  } catch (error) {
    console.log('[인증] 오류:', error.message);
    res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
};

module.exports = auth; 