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
  description: {
    type: String,
    default: '',
  },

  // 일정 종류에 따라 시간 정보 다르게 입력됨
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  dueDate: Date,     // 기한 일정

  isRepeating: {
    type: Boolean,
    default: false,
  },
  repeatPattern: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', null],
    required: false,
    default: null,
  },

  categoryCode: {
    type: String,
    enum: ['school', 'housework', 'work', 'selfdev', 'family', 'health', 'event', 'goal'],
    required: true,
  },

  priority: {
    type: String,
    enum: ['낮음', '보통', '높음'],
    default: '보통',
  },

  type: {
    type: String,
    enum: ['general', 'meeting', 'task', 'reminder'],
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
  },

  isAllDay: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 추가
});

module.exports = mongoose.model('Schedule', scheduleSchema);