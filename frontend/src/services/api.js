const API_URL = '/api';

// Helper to handle API responses
const handleResponse = async (response) => {
  try {
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      const error = data.error || response.statusText;
      throw new Error(error);
    }

    return data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Add authorization header with JWT token
const authHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API service object
const api = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      try {
        console.log('Login attempt:', { email: credentials.email });
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(credentials),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Login Error:', error);
        throw error;
      }
    },

    register: async (userData) => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },

    // 비밀번호 찾기 (재설정 요청)
    forgotPassword: async (data) => {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    // 비밀번호 재설정
    resetPassword: async (data) => {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    // 회원 탈퇴
    deleteAccount: async () => {
      const token = getToken();
      console.log('토큰 확인:', token ? 'Token exists' : 'No token');

      try {
        const response = await fetch(`${API_URL}/auth/delete`, {
          method: 'DELETE',
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          console.error('Delete account error status:', response.status);
          console.error('Delete account error statusText:', response.statusText);
        }

        return handleResponse(response);
      } catch (error) {
        console.error('Delete account error:', error);
        throw error;
      }
    },
  },

  // Schedules endpoints
  schedules: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/schedules`, {
        headers: {
          ...authHeader(),
        },
      });
      return handleResponse(response);
    },

    create: async (scheduleData) => {
      const response = await fetch(`${API_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(scheduleData),
      });
      return handleResponse(response);
    },

    update: async (id, scheduleData) => {
      const response = await fetch(`${API_URL}/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(scheduleData),
      });
      return handleResponse(response);
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/schedules/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      return handleResponse(response);
    },

    voiceInput: async (text) => {
      const response = await fetch(`${API_URL}/schedules/voice-input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ text }),
      });
      return handleResponse(response);
    },

    briefing: async (type = 'today') => {
      const response = await fetch(`${API_URL}/schedules/briefing?type=${type}`, {
        headers: {
          ...authHeader(),
        },
      });
      return handleResponse(response);
    },
  },
};

export default api; 