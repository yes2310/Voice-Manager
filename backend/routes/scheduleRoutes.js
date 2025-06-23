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

// ✅ POST: 음성 인식 텍스트 파싱만 (저장하지 않음)
router.post('/voice-parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '음성 인식 텍스트가 필요합니다.' });
    }

    const result = await openaiService.classifyAndExtractSchedule(text);
    if (!result.title || !result.category) {
      return res.status(400).json({ error: '시간, 일정 제목, 카테고리를 모두 말씀해 주세요.' });
    }

    // KST 시간을 그대로 사용 (변환하지 않음)
    const startTime = result.startTime;
    const endTime = result.endTime;

    console.log(`🕐 KST 시간 사용: "${startTime}"`);

    // 파싱된 결과만 반환 (저장하지 않음)
    const scheduleData = {
      title: result.title,
      categoryCode: result.category,
      startTime: startTime,
      endTime: endTime,
      type: 'general',
      priority: '보통',
      color: '#BAE1FF',
      isAllDay: result.isAllDay || false,
      description: result.description || ''
    };

    res.json({
      message: '음성 인식 파싱 완료',
      schedule: scheduleData
    });
  } catch (err) {
    console.error('음성 인식 파싱 중 오류:', err);
    
    // OpenAI 응답이 포함된 특별한 에러인 경우
    if (err.message === 'OPENAI_RESPONSE' && err.openaiMessage) {
      return res.status(400).json({ 
        error: 'OPENAI_RESPONSE',
        openaiMessage: err.openaiMessage 
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST: 음성 인식 텍스트로 일정 자동 등록 (기존 API - 호환성 유지)
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

    // KST 시간을 그대로 저장 (변환하지 않음)
    const startTime = result.startTime;
    const endTime = result.endTime;

    const scheduleData = {
      title: result.title,
      categoryCode: result.category,
      startTime: startTime,
      endTime: endTime,
      userId,
      type: 'general',
      priority: '보통',
      color: '#BAE1FF',
      isAllDay: result.isAllDay || false
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

// 일정 요약(브리핑) - 오늘/내일/이번주/이번달
router.get('/briefing', async (req, res) => {
  try {
    const { type = 'today' } = req.query;
    const today = new Date();
    let startDate, endDate, periodText;

    console.log(`📅 브리핑 요청: type=${type}, 현재시간=${today}`);

    switch (type) {
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        startDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
        endDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
        periodText = '내일';
        break;

      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일부터
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일까지
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0);
        endDate = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59);
        periodText = '이번 주';
        break;

      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        periodText = '이번 달';
        break;

      default: // 'today'
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        periodText = '오늘';
    }

    const userId = req.user.userId;

    console.log(`🔍 검색 범위: ${startDate} ~ ${endDate}`);
    console.log(`👤 사용자: ${userId}`);

    const schedules = await Schedule.find({
      userId,
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });

    console.log(`📋 찾은 일정 수: ${schedules.length}`);
    if (schedules.length > 0) {
      console.log('📝 일정 목록:', schedules.map(s => ({ title: s.title, startTime: s.startTime })));
    }

    if (schedules.length === 0) {
      return res.json({ message: `${periodText}은 등록된 일정이 없습니다.` });
    }

    let message = `${periodText} 일정은 총 ${schedules.length}건입니다.\n`;
    console.log(`💬 생성된 메시지 시작: "${periodText} 일정은 총 ${schedules.length}건입니다."`);

    schedules.forEach((s, i) => {
      const date = type === 'today' || type === 'tomorrow' ? '' : `${s.startTime.getMonth() + 1}월 ${s.startTime.getDate()}일 `;
      const time = s.isAllDay ? '하루종일' : s.startTime.toTimeString().slice(0, 5);
      const lineMessage = `${i + 1}. ${date}${time} - ${s.title}`;
      message += lineMessage + '\n';
      console.log(`📄 추가된 줄: "${lineMessage}"`);
    });

    console.log(`✅ 최종 메시지: "${message}"`);
    console.log(`📤 응답 전송: { message: "${message}" }`);

    // 캐시 방지 헤더 추가
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ message });
  } catch (error) {
    console.error('일정 브리핑 중 오류:', error);
    res.status(500).json({ error: '일정 브리핑에 실패했습니다.' });
  }
});

module.exports = router;
