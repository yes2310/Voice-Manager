const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { classifyAndExtractSchedule } = require('../services/openaiService');
const Schedule = require('../models/Schedule');

// 모든 일정 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id });
    res.json(schedules);
  } catch (error) {
    console.error('일정 조회 중 오류:', error);
    res.status(500).json({ error: '일정을 불러오는데 실패했습니다.' });
  }
});

// 일정 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const schedule = new Schedule({
      ...req.body,
      userId: req.user._id
    });
    await schedule.save();
    res.status(201).json({ schedule });
  } catch (error) {
    console.error('일정 생성 중 오류:', error);
    res.status(500).json({ error: '일정을 생성하는데 실패했습니다.' });
  }
});

// 일정 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('일정 수정 중 오류:', error);
    res.status(500).json({ error: '일정을 수정하는데 실패했습니다.' });
  }
});

// 일정 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    }
    res.json({ message: '일정이 삭제되었습니다.' });
  } catch (error) {
    console.error('일정 삭제 중 오류:', error);
    res.status(500).json({ error: '일정을 삭제하는데 실패했습니다.' });
  }
});

// 음성 인식으로 일정 추가
router.post('/voice-input', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '음성 인식 텍스트가 필요합니다.' });
    }

    const result = await classifyAndExtractSchedule(text);
    
    // 필수 필드 검증
    if (!result.title || !result.category) {
      throw new Error('시간, 일정 제목, 카테고리를 모두 말씀해 주세요.');
    }

    const schedule = new Schedule({
      title: result.title,
      description: '',
      startTime: result.startTime,
      endTime: result.endTime,
      categoryCode: result.category,
      priority: '보통',
      type: 'general',
      isCompleted: false,
      color: '#BAE1FF',
      isAllDay: result.isAllDay || false,
      userId: req.user._id
    });

    await schedule.save();
    res.status(201).json({ schedule });
  } catch (error) {
    console.error('음성 인식 일정 추가 중 오류:', error);
    res.status(500).json({ error: error.message || '일정을 추가하는데 실패했습니다.' });
  }
});

module.exports = router; 