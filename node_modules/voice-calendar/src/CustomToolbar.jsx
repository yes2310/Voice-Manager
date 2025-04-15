import React from 'react';

export default function CustomToolbar({ label, onNavigate, onView }) {
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
      <h2 className="text-lg font-semibold">{label}</h2>
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