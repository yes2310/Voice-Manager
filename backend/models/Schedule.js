const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // user 테이블과 연결
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,

  // 일정 종류에 따라 시간 정보 다르게 입력됨
  startTime: Date,   // 일반/반복 일정
  endTime: Date,     // 일반/반복 일정
  dueDate: Date,     // 기한 일정

  isRepeating: {
    type: Boolean,
    default: false,
  },
  repeatPattern: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
  },

  categoryCode: {
    type: String,
    enum: ['school', 'housework', 'work', 'selfdev', 'family', 'health', 'event', 'goal'],
  },

  priority: {
    type: String,
    enum: ['높음', '보통', '낮음'],
    default: '보통',
  },

  type: {
    type: String,
    enum: ['general', 'deadline', 'repeat'],
    default: 'general',
  },

  // 새로 추가된 색상 필드
  color: {
    type: String,
    default: '#BAE1FF',
  },

  isCompleted: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 추가
});

module.exports = mongoose.model('Schedule', scheduleSchema);