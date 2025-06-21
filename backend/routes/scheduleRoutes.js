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
    if (!result.title || !result.category) {
      return res.status(400).json({ error: '일정 제목과 카테고리를 모두 말씀해 주세요.' });
    }

    const userId = req.user.userId;
    const scheduleData = {
      title: result.title,
      categoryCode: result.category,
      startTime: result.startTime,
      endTime: result.endTime,
      userId,
      type: 'general',
      priority: '보통',
      color: '#BAE1FF',
      isAllDay: false
    };

    const schedule = new Schedule(scheduleData);
    await schedule.save();
    
    res.status(201).json({ 
      message: '일정 자동 등록 완료', 
      schedule 
    });
  } catch (err) {
    console.error('음성 인식 처리 중 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST: 프롬프트로 일정 요약 요청
router.post('/openai/summary', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }
    // OpenAI로 프롬프트 전달 및 응답 반환
    const response = await openaiService.summarizePrompt(prompt);
    res.json({ summary: response });
  } catch (err) {
    console.error('OpenAI 요약 처리 중 오류:', err);
    res.status(500).json({ error: err.message || '요약 처리 중 오류가 발생했습니다.' });
  }
});

// 오늘 일정 요약(브리핑)
router.get('/briefing', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const userId = req.user.userId;
    const schedules = await Schedule.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });

    if (schedules.length === 0) {
      return res.json({ message: '오늘은 등록된 일정이 없습니다.' });
    }

    let message = `오늘 일정은 총 ${schedules.length}건입니다.\n`;
    schedules.forEach((s, i) => {
      const time = s.isAllDay ? '하루종일' : s.startTime.toTimeString().slice(0,5);
      message += `${i + 1}. ${time} - ${s.title}\n`;
    });
    res.json({ message });
  } catch (error) {
    console.error('오늘 일정 브리핑 중 오류:', error);
    res.status(500).json({ error: '오늘 일정 브리핑에 실패했습니다.' });
  }
});

module.exports = router;
