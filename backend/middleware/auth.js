const jwt = require('jsonwebtoken');

// JWT 시크릿 키 (실제 프로덕션에서는 환경 변수로 관리)
const JWT_SECRET = 'your_jwt_secret_key';

// JWT 인증 미들웨어
const auth = (req, res, next) => {
  try {
    // 헤더에서 Authorization 값 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }
    
    // Bearer 토큰 형식 검증 및 토큰 추출
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '유효하지 않은 토큰 형식입니다.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 검증된 사용자 정보를 요청 객체에 추가
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('인증 에러:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

module.exports = auth; 