import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function ResetPassword({ onSuccess }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // 토큰 검증
    if (!token) {
      setError('유효하지 않은 비밀번호 재설정 링크입니다.');
      return;
    }
    
    // 비밀번호 일치 확인
    if (formData.newPassword !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    // 비밀번호 길이 검증
    if (formData.newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api.auth.resetPassword({
        token,
        newPassword: formData.newPassword
      });
      
      setSuccess(true);
      if (onSuccess) setTimeout(onSuccess, 3000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">비밀번호 변경 완료</h2>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">오류</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            유효하지 않은 비밀번호 재설정 링크입니다. 다시 시도해주세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">새 비밀번호 설정</h2>
        <p className="text-gray-600 text-center mb-8">새로운 비밀번호를 입력해주세요.</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 mb-1">새 비밀번호</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 mb-1">비밀번호 확인</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md transition mt-4`}
          >
            {isLoading ? '처리 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword; 