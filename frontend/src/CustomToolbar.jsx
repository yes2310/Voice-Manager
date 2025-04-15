import React from 'react';

export default function CustomToolbar({ label, onNavigate, onView }) {
  // 월-년 형식의 label 문자열을 년-월 형식으로 변환
  const formatLabel = (originalLabel) => {
    // 예시: "8월 2023" -> "2023년 8월"
    const parts = originalLabel.split(' ');
    if (parts.length === 2) {
      const month = parts[0];
      const year = parts[1];
      return `${year}년 ${month}`;
    }
    return originalLabel;
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        >
          ‹
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        >
          ›
        </button>
      </div>
      <h2 className="text-lg font-semibold">{formatLabel(label)}</h2>
      <div className="space-x-2">
        {['month', 'week', 'day'].map(view => (
          <button
            key={view}
            onClick={() => onView(view)}
            className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition capitalize"
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
}