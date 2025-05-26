const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const openaiService = require('../services/openaiService');

// 인증 미들웨어를 모든 라우트에 적용
router.use(auth);

// ✅ GET: 전체 일정 조회 (자신의 일정만)
router.get('/', async (req, res) => {
  try {
    // req.user에서 userId 추출 (auth 미들웨어에서 설정됨)
    const userId = req.user.userId;
    
    // 사용자 자신의 일정만 조회
    const schedules = await Schedule.find({ userId });
    
    console.log(`   ▶ 일정 개수: ${schedules.length}, 사용자: ${userId}`);
    res.json(schedules);
  } catch (err) {
    console.error('❌ GET /api/schedules 에러:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST: 일정 등록
router.post('/', async (req, res) => {
  try {
    // req.user에서 userId 추출 (auth 미들웨어에서 설정됨)
    const userId = req.user.userId;
    
    // 요청 본문의 userId를 auth 미들웨어에서 확인된 userId로 설정
    const scheduleData = {
      ...req.body,
      userId
    };
    
    const schedule = new Schedule(scheduleData);
    await schedule.save();
    
    res.status(201).json({ message: '일정 등록 완료', schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ PUT: 일정 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId;
    
    // 먼저 일정이 현재 로그인한 사용자의 것인지 확인
    const schedule = await Schedule.findOne({ _id: id, userId });
    
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없거나 접근 권한이 없습니다.' });
    }
    
    // 권한 확인 후 업데이트 진행
    const updatedSchedule = await Schedule.findByIdAndUpdate(id, updates, { new: true });
    
    res.json({ message: '일정 수정 완료', schedule: updatedSchedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE: 일정 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 먼저 일정이 현재 로그인한 사용자의 것인지 확인
    const schedule = await Schedule.findOne({ _id: id, userId });
    
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없거나 접근 권한이 없습니다.' });
    }
    
    // 일정 삭제
    await Schedule.findByIdAndDelete(id);
    
    res.json({ message: '일정 삭제 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ POST: 음성 인식 텍스트로 일정 자동 등록
router.post('/voice-input', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '음성 인식 텍스트가 필요합니다.' });
    }
    const result = await openaiService.classifyAndExtractSchedule(text);
    if (!result.time || !result.title || !result.category) {
      return res.status(400).json({ error: '시간, 일정 제목, 카테고리를 모두 말씀해 주세요.' });
    }
    const userId = req.user.userId;
    const scheduleData = { ...result, userId };
    const schedule = new Schedule(scheduleData);
    await schedule.save();
    res.status(201).json({ message: '일정 자동 등록 완료', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
