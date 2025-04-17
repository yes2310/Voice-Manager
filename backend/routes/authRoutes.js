const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const router = express.Router();

// JWT 시크릿 키 (실제 프로덕션에서는 환경 변수로 관리)
const JWT_SECRET = 'your_jwt_secret_key';

// 비밀번호 재설정 토큰 저장소 (실제 프로덕션에서는 데이터베이스에 저장)
const passwordResetTokens = new Map();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 이메일 중복 검사
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    
    // 새 사용자 생성
    const user = new User({
      name,
      email,
      password, // 저장 전에 User 모델에서 자동으로 해싱됨
    });
    
    await user.save();
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      userId: user._id
    });
    
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 사용자 검색
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' } // 토큰 유효 기간: 24시간
    );
    
    res.json({
      message: '로그인 성공',
      token,
      userId: user._id,
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

// 회원탈퇴
router.delete('/delete', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[회원탈퇴] 삭제 요청 - 사용자 ID: ${userId}`);
    
    // 사용자 삭제
    const deleteResult = await User.findByIdAndDelete(userId);
    
    if (!deleteResult) {
      console.log(`[회원탈퇴] 실패 - 사용자를 찾을 수 없음: ${userId}`);
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 사용자의 모든 일정 삭제 (Schedule 모델을 가져와야 함)
    const Schedule = require('../models/Schedule');
    await Schedule.deleteMany({ userId });
    
    console.log(`[회원탈퇴] 성공 - 사용자 ID: ${userId}`);
    res.json({ message: '계정이 성공적으로 삭제되었습니다.' });
    
  } catch (error) {
    console.error('[회원탈퇴] 오류:', error);
    res.status(500).json({ error: '계정 삭제 중 오류가 발생했습니다.' });
  }
});

// 회원탈퇴 - 두 번째 엔드포인트 (호환성을 위해)
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[회원탈퇴] 삭제 요청(/delete-account) - 사용자 ID: ${userId}`);
    
    // 사용자 삭제
    const deleteResult = await User.findByIdAndDelete(userId);
    
    if (!deleteResult) {
      console.log(`[회원탈퇴] 실패 - 사용자를 찾을 수 없음: ${userId}`);
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 사용자의 모든 일정 삭제
    const Schedule = require('../models/Schedule');
    await Schedule.deleteMany({ userId });
    
    console.log(`[회원탈퇴] 성공 - 사용자 ID: ${userId}`);
    res.json({ message: '계정이 성공적으로 삭제되었습니다.' });
    
  } catch (error) {
    console.error('[회원탈퇴] 오류:', error);
    res.status(500).json({ error: '계정 삭제 중 오류가 발생했습니다.' });
  }
});

// 비밀번호 재설정 요청
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 사용자 검색
    const user = await User.findOne({ email });
    if (!user) {
      // 보안을 위해 사용자가 없어도 성공 메시지 반환
      return res.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });
    }
    
    // 임시 토큰 생성 (유효기간 1시간)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1시간
    
    // 토큰 저장 (실제로는 데이터베이스에 저장)
    passwordResetTokens.set(resetToken, {
      userId: user._id.toString(),
      expiry: resetTokenExpiry
    });
    
    // 이메일 전송 로직이 들어갈 자리
    // 실제로는 여기서 이메일을 보내야 함
    console.log(`[DEV] 비밀번호 재설정 토큰: ${resetToken} 사용자: ${email}`);
    
    res.json({ 
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      resetToken // 개발용으로만 포함, 실제로는 제거해야 함
    });
    
  } catch (error) {
    console.error('비밀번호 재설정 요청 에러:', error);
    res.status(500).json({ error: '비밀번호 재설정 요청 처리 중 오류가 발생했습니다.' });
  }
});

// 비밀번호 재설정 (새 비밀번호 설정)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // 토큰 검증
    const resetData = passwordResetTokens.get(token);
    
    if (!resetData) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
    }
    
    // 토큰 만료 확인
    if (Date.now() > resetData.expiry) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ error: '만료된 토큰입니다. 다시 요청해주세요.' });
    }
    
    // 사용자 찾기
    const user = await User.findById(resetData.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 비밀번호 업데이트
    user.password = newPassword;
    await user.save();
    
    // 사용한 토큰 삭제
    passwordResetTokens.delete(token);
    
    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    res.status(500).json({ error: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 