// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import moment from 'moment';
import 'moment/locale/ko';
import CustomToolbar from './CustomToolbar';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';

dayjs.extend(utc);
dayjs.extend(timezone);

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const pastelColors = [
  "#FFB3BA", "#FFDFBA", "#FFFFBA",
  "#BAFFC9", "#BAE1FF", "#C6B4FF", "#FFC6FF",
];
const CATEGORY_OPTIONS = [
  { value: 'school', label: '학업' },
  { value: 'housework', label: '집안일' },
  { value: 'work', label: '업무' },
  { value: 'selfdev', label: '자기계발' },
  { value: 'family', label: '가족' },
  { value: 'health', label: '건강' },
  { value: 'event', label: '이벤트' },
  { value: 'goal', label: '목표' },
];
const PRIORITY_OPTIONS = [
  { value: '높음', label: '높음' },
  { value: '보통', label: '보통' },
  { value: '낮음', label: '낮음' },
];
const TYPE_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'deadline', label: '기한' },
  { value: 'repeat', label: '반복' },
];

// Calendar component separated for use with PrivateRoute
function CalendarApp() {
  const { currentUser, token, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [manualEvent, setManualEvent] = useState({
    date: '', startTime: '', endTime: '',
    title: '', memo: '', color: pastelColors[0],
    categoryCode: CATEGORY_OPTIONS[0].value,
    priority: PRIORITY_OPTIONS[1].value,
    type: TYPE_OPTIONS[0].value,
  });
  const [editMode, setEditMode] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const recognitionRef = useRef(null);

  // Load schedules
  useEffect(() => {
    (async () => {
      try {
        const data = await api.schedules.getAll();
        setEvents(data.map(item => ({
          id: item._id,
          _id: item._id,
          title: item.title,
          start: dayjs.utc(item.startTime).local().toDate(),
          end: dayjs.utc(item.endTime).local().toDate(),
          memo: item.description,
          color: item.color || pastelColors[0],
          categoryCode: item.categoryCode,
          priority: item.priority,
          type: item.type,
        })));
      } catch (err) {
        console.error('일정 불러오기 중 에러:', err);
        if (err.message === '인증 실패') {
          logout();
        }
      }
    })();
  }, [logout]);

  // Create schedule
  const createSchedule = async evt => {
    const body = {
      title: evt.title,
      description: evt.memo,
      startTime: evt.start.toISOString(),
      endTime: evt.end.toISOString(),
      dueDate: null,
      isRepeating: false,
      repeatPattern: null,
      categoryCode: evt.categoryCode,
      priority: evt.priority,
      type: evt.type,
      isCompleted: false,
      color: evt.color,
    };
    const result = await api.schedules.create(body);
    return result.schedule;
  };

  // Update schedule
  const updateSchedule = async evt => {
    const body = {
      title: evt.title,
      description: evt.memo,
      startTime: evt.start.toISOString(),
      endTime: evt.end.toISOString(),
      categoryCode: evt.categoryCode,
      priority: evt.priority,
      type: evt.type,
      color: evt.color,
    };
    return api.schedules.update(evt._id, body);
  };

  // Speech Recognition
  const startRecognition = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('이 브라우저는 Web Speech API를 지원하지 않습니다.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setRecording(true);
      setTranscript('');
    };

    rec.onresult = event => {
      const text = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
    };

    rec.onerror = err => console.error('음성 인식 에러:', err);
    rec.onend = () => setRecording(false);

    recognitionRef.current = rec;
    rec.start();
  };
  const stopRecognition = () => recognitionRef.current?.stop();

  // Select slot -> manual add modal
  const handleSelectSlot = slotInfo => {
    const d = dayjs(slotInfo.start);
    setManualEvent({
      date: d.format('YYYY-MM-DD'),
      startTime: d.format('HH:mm'),
      endTime: d.add(1, 'hour').format('HH:mm'),
      title: '',
      memo: '',
      color: pastelColors[0],
      categoryCode: CATEGORY_OPTIONS[0].value,
      priority: PRIORITY_OPTIONS[1].value,
      type: TYPE_OPTIONS[0].value,
    });
    setShowModal(true);
  };

  const handleManualChange = e => {
    const { name, value } = e.target;
    setManualEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async e => {
    e.preventDefault();
    const { date, startTime, endTime, title, memo, color, categoryCode, priority, type } = manualEvent;
    if (!date || !startTime || !endTime || !title) return;
    const start = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    const end = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    const tmpId = `tmp-${Date.now()}`;
    const tmpEvt = { id: tmpId, title, start, end, memo, color, categoryCode, priority, type };
    setEvents(prev => [...prev, tmpEvt]);
    setShowModal(false);
    try {
      const saved = await createSchedule(tmpEvt);
      setEvents(prev => prev.map(ev => ev.id === tmpId ? { ...ev, id: saved._id, _id: saved._id } : ev));
    } catch (err) {
      console.error(err);
      setEvents(prev => prev.filter(ev => ev.id !== tmpId));
    }
  };

  // Event click -> edit modal
  const handleSelectEvent = evt => {
    setEditEvent({
      ...evt,
      date: dayjs(evt.start).format('YYYY-MM-DD'),
      startTime: dayjs(evt.start).format('HH:mm'),
      endTime: dayjs(evt.end).format('HH:mm'),
      memo: evt.memo,
      color: evt.color,
      categoryCode: evt.categoryCode,
      priority: evt.priority,
      type: evt.type,
    });
    setEditMode(true);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    const { date, startTime, endTime, memo, color, categoryCode, priority, type, _id } = editEvent;
    const start = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    const end = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    const updatedEvt = { ...editEvent, start, end, memo, color, categoryCode, priority, type };
    setEvents(prev => prev.map(ev => ev.id === _id ? updatedEvt : ev));
    setEditMode(false);
    try {
      await updateSchedule(updatedEvt);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop
  const onEventDrop = async ({ event, start, end }) => {
    const updated = { ...event, start, end };
    setEvents(prev => prev.map(ev => ev.id === event.id ? updated : ev));
    if (event._id) {
      try {
        await updateSchedule(updated);
      } catch (err) {
        console.error(err);
      }
    }
  };
  const onEventResize = async ({ event, start, end }) => {
    const updated = { ...event, start, end };
    setEvents(prev => prev.map(ev => ev.id === event.id ? updated : ev));
    if (event._id) {
      try {
        await updateSchedule(updated);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Styles
  const eventStyleGetter = event => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '0.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      color: '#1F2937',
      padding: '4px 8px',
      fontSize: '0.875rem',
      fontWeight: 500,
      border: 'none',
      display: 'block',
    }
  });

  const minTime = new Date(); minTime.setHours(0, 0, 0);
  const maxTime = new Date(); maxTime.setHours(23, 59, 59);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-gray-800">Voice Manager</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200 transition"
          >
            {currentUser?.name || currentUser?.email}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* 음성 버튼 */}
        <div className="flex justify-center space-x-4">
          {!recording ? (
            <button
              onClick={startRecognition}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              음성 인식 시작
            </button>
          ) : (
            <button
              onClick={stopRecognition}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              음성 인식 중지
            </button>
          )}
        </div>

        {/* 실시간 인식 텍스트 박스: recording 중이거나 transcript 있을 때만 */}
        {(recording || transcript) && (
          <div className="max-w-5xl mx-auto bg-gray-200 rounded-md p-4 text-gray-800 mb-6 min-h-[3rem]">
            {transcript || '음성을 인식 중입니다...'}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <DnDCalendar
            localizer={localizer}
            events={events}
            date={currentDate}
            view={currentView}
            onNavigate={d => setCurrentDate(d)}
            onView={v => setCurrentView(v)}
            components={{ toolbar: CustomToolbar }}
            eventPropGetter={eventStyleGetter}
            startAccessor="start"
            endAccessor="end"
            selectable
            resizable
            style={{ height: '70vh' }}
            defaultView="week"
            views={['month', 'week', 'day']}
            min={minTime}
            max={maxTime}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
          />
        </div>
      </main>

      {/* 수동 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <h3 className="text-2xl font-semibold">일정 추가</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* 날짜 */}
              <div>
                <label className="block text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={manualEvent.date}
                  onChange={handleManualChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 시간 */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">시작 시간</label>
                  <input
                    type="time"
                    name="startTime"
                    value={manualEvent.startTime}
                    onChange={handleManualChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">종료 시간</label>
                  <input
                    type="time"
                    name="endTime"
                    value={manualEvent.endTime}
                    onChange={handleManualChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {/* 제목 */}
              <div>
                <label className="block text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  name="title"
                  value={manualEvent.title}
                  onChange={handleManualChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 메모 */}
              <div>
                <label className="block text-gray-700 mb-1">메모</label>
                <input
                  type="text"
                  name="memo"
                  value={manualEvent.memo}
                  onChange={handleManualChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 색상 선택 */}
              <div>
                <label className="block text-gray-700 mb-1">색상 선택</label>
                <div className="flex space-x-2">
                  {pastelColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setManualEvent(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        manualEvent.color === color ? 'border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* 분류 */}
              <div>
                <label className="block text-gray-700 mb-1">분류</label>
                <select
                  name="categoryCode"
                  value={manualEvent.categoryCode}
                  onChange={handleManualChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 우선순위 */}
              <div>
                <label className="block text-gray-700 mb-1">우선순위</label>
                <select
                  name="priority"
                  value={manualEvent.priority}
                  onChange={handleManualChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 유형 */}
              <div>
                <label className="block text-gray-700 mb-1">유형</label>
                <select
                  name="type"
                  value={manualEvent.type}
                  onChange={handleManualChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 프로필 모달 */}
      {showProfileModal && (
        <Profile onClose={() => setShowProfileModal(false)} />
      )}

      {/* 수정 모달 */}
      {editMode && editEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <h3 className="text-2xl font-semibold">일정 수정</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* 날짜 */}
              <div>
                <label className="block text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={editEvent.date}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 시간 */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">시작 시간</label>
                  <input
                    type="time"
                    name="startTime"
                    value={editEvent.startTime}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">종료 시간</label>
                  <input
                    type="time"
                    name="endTime"
                    value={editEvent.endTime}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {/* 제목 */}
              <div>
                <label className="block text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  name="title"
                  value={editEvent.title}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 메모 */}
              <div>
                <label className="block text-gray-700 mb-1">메모</label>
                <input
                  type="text"
                  name="memo"
                  value={editEvent.memo}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 색상 선택 */}
              <div>
                <label className="block text-gray-700 mb-1">색상 선택</label>
                <div className="flex space-x-2">
                  {pastelColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditEvent(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${editEvent.color === color ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* 분류 */}
              <div>
                <label className="block text-gray-700 mb-1">분류</label>
                <select
                  name="categoryCode"
                  value={editEvent.categoryCode}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 우선순위 */}
              <div>
                <label className="block text-gray-700 mb-1">우선순위</label>
                <select
                  name="priority"
                  value={editEvent.priority}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 유형 */}
              <div>
                <label className="block text-gray-700 mb-1">유형</label>
                <select
                  name="type"
                  value={editEvent.type}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App component with Router and Auth context
function App() {
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot-password'

  const handleLoginSuccess = (userData) => {
    console.log('로그인 성공:', userData);
    // 로그인 성공 후 메인 페이지로 리다이렉트
    window.location.href = '/';
  };

  const handleRegisterSuccess = (view = 'login') => {
    setAuthView(view);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            authView === 'login' ? (
              <Login 
                onLogin={handleLoginSuccess} 
                onForgotPassword={() => setAuthView('forgot-password')}
                onRegister={() => setAuthView('register')}
              />
            ) : authView === 'register' ? (
              <Register onRegisterSuccess={handleRegisterSuccess} />
            ) : (
              <ForgotPassword 
                onSuccess={() => setAuthView('login')}
                onBackToLogin={() => setAuthView('login')}
              />
            )
          } />
          <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
          <Route path="/reset-password" element={<ResetPassword onSuccess={() => window.location.href = '/login'} />} />
          <Route path="/" element={
            <PrivateRoute>
              <CalendarApp />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;