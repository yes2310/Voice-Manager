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
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 py-2 sm:py-3">
      {/* 네비게이션과 제목 */}
      <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => onNavigate('PREV')}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-50 transition-all duration-200 text-gray-600 border border-gray-200 shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
            aria-label="이전"
          >
            ‹
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 border border-gray-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-50 transition-all duration-200 text-gray-600 border border-gray-200 shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200"
            aria-label="다음"
          >
            ›
          </button>
        </div>
        <h2 className="text-sm sm:text-lg font-semibold text-gray-800 sm:ml-4">{formatLabel(label)}</h2>
      </div>
      
      {/* 뷰 버튼들 */}
      <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-4">
        {[
          { view: 'month', label: 'Month', shortLabel: 'M' },
          { view: 'week', label: 'Week', shortLabel: 'W' },
          { view: 'day', label: 'Day', shortLabel: 'D' }
        ].map(({ view, label, shortLabel }) => (
          <button
            key={view}
            onClick={() => onView(view)}
            className="px-2 py-1.5 sm:px-6 sm:py-2 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 border border-gray-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow hover:text-indigo-600 hover:border-indigo-200 min-w-[32px] sm:min-w-auto"
          >
            <span className="block sm:hidden">{shortLabel}</span>
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}