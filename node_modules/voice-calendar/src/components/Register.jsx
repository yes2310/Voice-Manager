import React, { useState } from 'react';

function Register({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }
      
      // Call success callback
      onRegisterSuccess();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">회원가입</h2>
        <p className="text-gray-600 text-center mb-8">새 계정 생성</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700 mb-1">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md transition mt-6`}
          >
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => onRegisterSuccess('login')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              이미 계정이 있으신가요? 로그인하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register; 