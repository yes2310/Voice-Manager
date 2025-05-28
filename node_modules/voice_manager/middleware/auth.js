const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // 실제로는 환경변수로 관리

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}; 