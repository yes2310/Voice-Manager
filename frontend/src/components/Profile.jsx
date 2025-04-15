import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Profile({ onClose }) {
  const { currentUser, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    // 확인 텍스트 검증
    if (confirmText !== '계정삭제') {
      setError('정확한 확인 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      await api.auth.deleteAccount();
      logout(); // 로그아웃 처리
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">내 계정</h2>
          <button
            onClick={onClose}
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
            onClick={() => setIsDeleting(true)}
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
          onClick={logout}
          className="w-full py-3 mt-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default Profile; 