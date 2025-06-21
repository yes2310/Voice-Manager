import React, { useState } from 'react';

function Login({ onLogin, onForgotPassword, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Call the onLogin callback with user data
      onLogin(data);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Voice Manager</h2>
        <p className="text-gray-600 text-center mb-8">AI-powered 스케줄러에 로그인하세요</p>
        
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
          
          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md transition`}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onRegister}
              className="text-indigo-600 hover:text-indigo-800"
            >
              계정이 없으신가요? 회원가입하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 