// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-styles.css';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualEvent, setManualEvent] = useState({
    date: '', startTime: '', endTime: '',
    title: '', memo: '', color: pastelColors[0],
    categoryCode: CATEGORY_OPTIONS[0].value,
    priority: PRIORITY_OPTIONS[1].value,
    type: TYPE_OPTIONS[0].value,
    isAllDay: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
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
          isAllDay: item.isAllDay || false,
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
      isAllDay: evt.isAllDay || false,
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
      isAllDay: evt.isAllDay || false,
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
      isAllDay: false,
    });
    setShowModal(true);
  };

  const handleManualChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setManualEvent(prev => ({ ...prev, [name]: checked }));
    } else {
      setManualEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleManualSubmit = async e => {
    e.preventDefault();
    const { date, startTime, endTime, title, memo, color, categoryCode, priority, type, isAllDay } = manualEvent;
    if (!date || (!isAllDay && (!startTime || !endTime)) || !title) return;
    
    let start, end;
    if (isAllDay) {
      // 하루종일 이벤트인 경우 00:00부터 23:59까지로 설정
      start = dayjs.tz(`${date} 00:00`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
      end = dayjs.tz(`${date} 23:59`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    } else {
      start = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
      end = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    }
    
    const tmpId = `tmp-${Date.now()}`;
    const tmpEvt = { 
      id: tmpId, 
      title, 
      start, 
      end, 
      memo, 
      color, 
      categoryCode, 
      priority, 
      type,
      isAllDay 
    };
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

  // Event click -> view modal
  const handleSelectEvent = evt => {
    setSelectedEvent({
      ...evt,
      date: dayjs(evt.start).format('YYYY-MM-DD'),
      startTime: dayjs(evt.start).format('HH:mm'),
      endTime: dayjs(evt.end).format('HH:mm'),
      memo: evt.memo,
      color: evt.color,
      categoryCode: evt.categoryCode,
      priority: evt.priority,
      type: evt.type,
      isAllDay: evt.isAllDay || false,
    });
    setShowEventModal(true);
  };

  // Open edit modal from view modal
  const handleEditClick = () => {
    setEditEvent(selectedEvent);
    setShowEventModal(false);
    setEditMode(true);
  };

  // Delete event
  const handleDeleteEvent = async () => {
    try {
      if (!selectedEvent || !selectedEvent._id) return;
      
      await api.schedules.delete(selectedEvent._id);
      setEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
      setShowEventModal(false);
    } catch (err) {
      console.error('일정 삭제 중 오류:', err);
    }
  };

  // 이벤트 정보 수정
  const handleEditChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setEditEvent(prev => ({ ...prev, [name]: checked }));
    } else {
      setEditEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    const { date, startTime, endTime, memo, color, categoryCode, priority, type, isAllDay, _id } = editEvent;
    
    let start, end;
    if (isAllDay) {
      start = dayjs.tz(`${date} 00:00`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
      end = dayjs.tz(`${date} 23:59`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    } else {
      start = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
      end = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul').toDate();
    }
    
    const updatedEvt = { ...editEvent, start, end, memo, color, categoryCode, priority, type, isAllDay };
    setEvents(prev => prev.map(ev => ev.id === _id ? updatedEvt : ev));
    setEditMode(false);
    try {
      await updateSchedule(updatedEvt);
    } catch (err) {
      console.error('일정 업데이트 중 오류:', err);
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
      width: '100%',
    }
  });

  const minTime = new Date(); minTime.setHours(0, 0, 0);
  const maxTime = new Date(); maxTime.setHours(23, 59, 59);

  // 시간 포맷 커스터마이징
  const formats = {
    eventTimeRangeFormat: () => '' // 시간 범위를 표시하지 않음
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    if (confirmText !== '계정삭제') {
      setError('확인 텍스트가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.auth.deleteAccount();
      logout();
      // 로그아웃 후 로그인 페이지로 리디렉션
      window.location.href = '/login';
    } catch (error) {
      setError('계정 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <header className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Voice Manager</h1>
        <div className="flex items-center space-x-4 relative">
          <button
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center hover:bg-indigo-200 transition overflow-hidden border-2 border-indigo-300 hover:shadow-md"
          >
            {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
          </button>
          
          {/* 프로필 드롭다운 메뉴 */}
          {showProfileModal && (
            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl w-72 z-50 border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <p className="font-medium text-gray-800">{currentUser?.name}</p>
                <p className="text-sm text-gray-600">{currentUser?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  로그아웃
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    // 계정 관리 모달 표시
                    document.body.style.overflow = 'hidden';
                    document.getElementById('fullProfileModal').classList.remove('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  계정 관리
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* 음성 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={recording ? stopRecognition : startRecognition}
            className={`flex items-center space-x-2 px-8 py-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 ${
              recording 
                ? "bg-red-600 text-white ring-4 ring-red-300 animate-pulse" 
                : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${recording ? "animate-bounce" : ""}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
            <span className="font-medium">{recording ? "음성 인식 중지" : "음성 인식 시작"}</span>
          </button>
        </div>

        {/* 실시간 인식 텍스트 박스: recording 중이거나 transcript 있을 때만 */}
        {(recording || transcript) && (
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-4 text-gray-800 mb-6 min-h-[3rem] relative border-l-4 border-indigo-500 transition-all duration-500">
            <div className={`absolute top-0 left-0 h-full max-w-full bg-indigo-50 rounded-l-lg transition-all duration-500 ${recording ? "animate-pulse" : ""}`} style={{width: recording ? '30%' : '0%'}}></div>
            <p className="relative z-10">
              {transcript || '음성을 인식 중입니다...'}
            </p>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 border border-gray-100 hover:shadow-2xl">
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
            formats={formats}
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
              
              {/* 하루종일 체크박스 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAllDay"
                  name="isAllDay"
                  checked={manualEvent.isAllDay}
                  onChange={handleManualChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
                  하루종일
                </label>
              </div>
              
              {/* 시간 - 하루종일이 아닐 때만 표시 */}
              {!manualEvent.isAllDay && (
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
              )}
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

      {/* 전체 프로필 모달 (계정 관리) */}
      <div id="fullProfileModal" className="fixed inset-0 flex items-center justify-center bg-black/30 hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">내 계정</h2>
            <button
              onClick={() => {
                document.body.style.overflow = '';
                document.getElementById('fullProfileModal').classList.add('hidden');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-8">
            <div className="text-gray-600 mb-1">이름</div>
            <div className="text-xl font-medium">{currentUser?.name}</div>
          </div>
          
          <div className="mb-8">
            <div className="text-gray-600 mb-1">이메일</div>
            <div className="text-xl font-medium">{currentUser?.email}</div>
          </div>
          
          <hr className="my-6 border-gray-200" />
          
          <div className="mb-6">
            <button
              onClick={() => {
                setIsDeleting(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              계정 삭제
            </button>
          </div>
          
          {isDeleting && (
            <div className="border border-red-300 rounded-md p-4 bg-red-50">
              <h3 className="text-lg font-medium text-red-800 mb-2">계정 삭제 확인</h3>
              <p className="text-red-700 mb-4">
                계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">확인을 위해 "계정삭제"를 입력하세요</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== '계정삭제' || isLoading}
                  className={`px-4 py-2 ${
                    confirmText !== '계정삭제' || isLoading
                      ? 'bg-red-400'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white rounded-md transition`}
                >
                  {isLoading ? '처리 중...' : '계정 영구 삭제'}
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              document.body.style.overflow = '';
              document.getElementById('fullProfileModal').classList.add('hidden');
            }}
            className="w-full py-3 mt-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 일정 확인 모달 */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 space-y-6 border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-gray-800">일정 정보</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div 
              className="absolute top-0 left-0 h-2 w-full rounded-t-xl"
              style={{ backgroundColor: selectedEvent.color }}
            ></div>
            
            <div className="space-y-4 mt-2">
              <div>
                <div className="text-sm text-gray-500">제목</div>
                <div className="text-lg font-medium">{selectedEvent.title}</div>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">날짜</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedEvent.date}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">시작 시간</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedEvent.startTime}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">종료 시간</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedEvent.endTime}
                  </div>
                </div>
              </div>
              
              {selectedEvent.memo && (
                <div>
                  <div className="text-sm text-gray-500">메모</div>
                  <div className="p-2 bg-gray-50 rounded-md text-gray-700 mt-1">{selectedEvent.memo}</div>
                </div>
              )}
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">분류</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {CATEGORY_OPTIONS.find(opt => opt.value === selectedEvent.categoryCode)?.label || selectedEvent.categoryCode}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">우선순위</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {selectedEvent.priority}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">유형</div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {TYPE_OPTIONS.find(opt => opt.value === selectedEvent.type)?.label || selectedEvent.type}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">색상</div>
                  <div className="flex items-center mt-1">
                    <div
                      className="w-6 h-6 rounded-full mr-2 shadow-sm"
                      style={{ backgroundColor: selectedEvent.color }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* 하루종일 여부 */}
              <div>
                <div className="text-sm text-gray-500">일정 유형</div>
                <div className="flex items-center gap-1 text-gray-700 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedEvent.isAllDay ? '하루종일' : '시간 지정'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={handleDeleteEvent}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
              <button
                onClick={handleEditClick}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editMode && editEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 space-y-6 border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-gray-800">일정 수정</h3>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-400 hover:text-gray-700 text-xl transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div 
              className="absolute top-0 left-0 h-2 w-full rounded-t-xl"
              style={{ backgroundColor: editEvent.color }}
            ></div>
            
            <form onSubmit={handleEditSubmit} className="space-y-5 mt-2">
              {/* 날짜 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={editEvent.date}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>
              
              {/* 하루종일 체크박스 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsAllDay"
                  name="isAllDay"
                  checked={editEvent.isAllDay}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsAllDay" className="ml-2 block text-sm text-gray-700">
                  하루종일
                </label>
              </div>
              
              {/* 시간 - 하루종일이 아닐 때만 표시 */}
              {!editEvent.isAllDay && (
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-1 text-sm font-medium">시작 시간</label>
                    <input
                      type="time"
                      name="startTime"
                      value={editEvent.startTime}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-1 text-sm font-medium">종료 시간</label>
                    <input
                      type="time"
                      name="endTime"
                      value={editEvent.endTime}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              )}
              {/* 제목 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">제목</label>
                <input
                  type="text"
                  name="title"
                  value={editEvent.title}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>
              {/* 메모 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">메모</label>
                <textarea
                  name="memo"
                  value={editEvent.memo}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  rows="2"
                />
              </div>
              {/* 색상 선택 */}
              <div>
                <label className="block text-gray-700 mb-2 text-sm font-medium">색상 선택</label>
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditEvent(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${editEvent.color === color ? 'border-gray-800 scale-110' : 'border-transparent'} transition-transform hover:scale-110`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* 분류 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">분류</label>
                <select
                  name="categoryCode"
                  value={editEvent.categoryCode}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 우선순위 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">우선순위</label>
                <select
                  name="priority"
                  value={editEvent.priority}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* 유형 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">유형</label>
                <select
                  name="type"
                  value={editEvent.type}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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