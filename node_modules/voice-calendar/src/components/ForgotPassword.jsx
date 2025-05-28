import React, { useState } from 'react';
import api from '../services/api';

function ForgotPassword({ onSuccess, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.auth.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">이메일 확인</h2>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">비밀번호 찾기</h2>
        <p className="text-gray-600 text-center mb-8">가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your-email@example.com"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md transition`}
          >
            {isLoading ? '전송 중...' : '비밀번호 재설정 링크 받기'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-indigo-600 hover:text-indigo-800"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword; 