import React from 'react';

export default function CustomToolbar({ label, onNavigate, onView }) {
  // 현재 연도 가져오기
  const currentYear = new Date().getFullYear();

  // 월-년 형식의 label 문자열을 년-월 형식으로 변환
  const formatLabel = (originalLabel) => {
    // 예시: "8월 2023" -> "2025년 8월"
    const parts = originalLabel.split(' ');
    if (parts.length === 2) {
      const month = parts[0];
      return `${currentYear}년 ${month}`;
    }
    return originalLabel;
  };

  return (
    <div className="flex items-center justify-between p-4 py-3">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-50 transition-all duration-200 text-gray-600 border border-gray-200 shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
          aria-label="이전"
        >
          ‹
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-5 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 border border-gray-200 text-sm font-medium shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-50 transition-all duration-200 text-gray-600 border border-gray-200 shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
          aria-label="다음"
        >
          ›
        </button>
      </div>
      <h2 className="text-lg font-semibold text-gray-800">{formatLabel(label)}</h2>
      <div className="flex items-center space-x-4">
        {['Month', 'Week', 'Day'].map(view => (
          <button
            key={view.toLowerCase()}
            onClick={() => onView(view.toLowerCase())}
            className="px-6 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 border border-gray-200 text-sm font-medium shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
}