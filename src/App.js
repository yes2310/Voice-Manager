import React, { useState, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import dayjs from 'dayjs';
import moment from 'moment';
import 'moment/locale/ko';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// 미리 정해진 7가지 파스텔톤 색상
const pastelColors = [
  "#FFB3BA", // 연한 분홍
  "#FFDFBA", // 연한 오렌지
  "#FFFFBA", // 연한 노랑
  "#BAFFC9", // 연한 초록
  "#BAE1FF", // 연한 파랑
  "#C6B4FF", // 연한 보라
  "#FFC6FF", // 연한 분홍-보라
];

function App() {
  const [events, setEvents] = useState([]);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  // controlled 상태: 현재 날짜와 뷰 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');

  // 모달 및 수동 일정 추가 상태
  const [showModal, setShowModal] = useState(false);
  const [manualEvent, setManualEvent] = useState({
    date: '',
    startTime: '',
    endTime: '',
    title: '',
    memo: '',
    color: pastelColors[0], // 기본 색상
  });

  // 등록된 일정 상세보기 모달 상태
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 음성 인식 시작 함수 (예시)
  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('이 브라우저는 Web Speech API를 지원하지 않습니다.');
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setRecording(true);
      console.log('음성 인식 시작');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('인식된 음성:', transcript);
      setRecording(false);
      // 결과는 콘솔에만 출력
    };

    recognition.onerror = (err) => {
      console.error('음성 인식 에러:', err);
      setRecording(false);
    };

    recognition.onend = () => {
      console.log('음성 인식 종료');
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  // react-big-calendar 셀 클릭 시 수동 일정 추가 모달 띄우기
  const handleSelectSlot = (slotInfo) => {
    const startDate = dayjs(slotInfo.start);
    setManualEvent({
      date: startDate.format('YYYY-MM-DD'),
      startTime: startDate.format('HH:mm'),
      endTime: startDate.add(1, 'hour').format('HH:mm'),
      title: '',
      memo: '',
      color: pastelColors[0],
    });
    setShowModal(true);
  };

  // 등록된 이벤트 클릭 시 상세 정보 모달 띄우기
  const handleSelectEvent = (event) => {
    console.log('선택된 이벤트:', event);
    setSelectedEvent(event);
  };

  // 모달 내 입력 변경 핸들러 (일정 추가)
  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualEvent((prev) => ({ ...prev, [name]: value }));
  };

  // 모달 수동 일정 추가 제출
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const { date, startTime, endTime, title, memo, color } = manualEvent;
    if (!date || !startTime || !endTime || !title) {
      console.warn("필수 입력값이 누락되었습니다.");
      return;
    }
    const startDate = dayjs(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').toDate();
    const endDate = dayjs(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm').toDate();
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      start: startDate,
      end: endDate,
      memo: memo || '',
      color,
    };
    setEvents((prev) => [...prev, newEvent]);
    console.log(`일정 추가됨: ${title} (${date} ${startTime} ~ ${endTime})`);
    setShowModal(false);
  };

  // 이벤트 상세보기 모달 닫기
  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  // 드래그 앤 드롭: 이벤트 이동
  const onEventDrop = ({ event, start, end, allDay }) => {
    const updatedEvent = { ...event, start, end, allDay };
    setEvents((prev) =>
      prev.map((evt) => (evt.id === event.id ? updatedEvent : evt))
    );
    console.log('이벤트 이동:', updatedEvent);
  };

  // 드래그 앤 드롭: 이벤트 리사이즈 (크기 조절)
  const onEventResize = ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    setEvents((prev) =>
      prev.map((evt) => (evt.id === event.id ? updatedEvent : evt))
    );
    console.log('이벤트 크기 조정:', updatedEvent);
  };

  // react-big-calendar 날짜 범위 설정
  const minTime = new Date();
  minTime.setHours(0, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(23, 59, 59);

  // eventPropGetter를 사용하여 이벤트 스타일 지정 (선택한 색상 적용)
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color || pastelColors[0],
      borderRadius: '8px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return { style };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center text-gray-800 mb-2">
          보이스 매니저
        </h1>
        <p className="text-center text-gray-600 text-sm md:text-base">
          음성으로 전달된 일정을 해석하고 명확하게 등록·관리하는 AI 스케줄러
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* 음성 인식 버튼 영역 */}
        <div className="flex flex-col md:flex-row justify-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
          {!recording ? (
            <button
              onClick={startRecognition}
              className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
            >
              음성 인식 시작
            </button>
          ) : (
            <button
              onClick={stopRecognition}
              className="px-6 py-3 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
            >
              음성 인식 중지
            </button>
          )}
        </div>

        {/* react-big-calendar with Drag and Drop */}
        <div className="shadow-lg rounded-lg overflow-hidden">
          <DnDCalendar
            localizer={localizer}
            events={events}
            date={currentDate}
            view={currentView}
            onNavigate={(date, view, action) => {
              console.log('onNavigate:', { date, view, action });
              setCurrentDate(date);
            }}
            onView={(view) => {
              console.log('onView 변경:', view);
              setCurrentView(view);
            }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            eventPropGetter={eventStyleGetter}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            defaultView="week"
            views={['month', 'week', 'day']}
            selectable
            min={minTime}
            max={maxTime}
          />
        </div>
      </main>

      {/* 수동 일정 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              일정 추가
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={manualEvent.date}
                  onChange={handleManualChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">시작 시간</label>
                  <input
                    type="time"
                    name="startTime"
                    value={manualEvent.startTime}
                    onChange={handleManualChange}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  name="title"
                  value={manualEvent.title}
                  onChange={handleManualChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">메모</label>
                <input
                  type="text"
                  name="memo"
                  value={manualEvent.memo}
                  onChange={handleManualChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">색상 선택</label>
                <div className="flex space-x-2">
                  {pastelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setManualEvent((prev) => ({ ...prev, color }))
                      }
                      className={`w-8 h-8 rounded-full border-2 ${
                        manualEvent.color === color
                          ? "border-gray-800"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
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
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 등록된 이벤트 상세보기 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              일정 상세 정보
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">제목:</span> {selectedEvent.title}
              </p>
              <p>
                <span className="font-semibold">날짜:</span>{" "}
                {dayjs(selectedEvent.start).format("YYYY-MM-DD")}
              </p>
              <p>
                <span className="font-semibold">시간:</span>{" "}
                {dayjs(selectedEvent.start).format("HH:mm")} -{" "}
                {dayjs(selectedEvent.end).format("HH:mm")}
              </p>
              {selectedEvent.memo && (
                <p>
                  <span className="font-semibold">메모:</span> {selectedEvent.memo}
                </p>
              )}
              <p className="flex items-center">
                <span className="font-semibold mr-2">색상:</span>
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedEvent.color }}
                ></span>
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;