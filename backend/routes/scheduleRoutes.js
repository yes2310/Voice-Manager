const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// ✅ GET: 전체 일정 조회
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find({});
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST: 일정 등록
router.post('/', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json({ message: '일정 등록 완료', schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // { startTime, endTime, ... }
    const schedule = await Schedule.findByIdAndUpdate(id, updates, { new: true });
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    }
    res.json({ message: '일정 수정 완료', schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// routes/scheduleRoutes.js
router.get('/', async (req, res) => {
  console.log('📥 GET /api/schedules 호출됨');
  try {
    const schedules = await Schedule.find({});
    console.log(`   ▶ 일정 개수: ${schedules.length}`);
    res.json(schedules);
  } catch (err) {
    console.error('❌ GET /api/schedules 에러:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
