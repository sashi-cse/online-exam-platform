import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const loginPassword = async (identifier, password, role) => {
    const res = await api.post('/auth/login-password', { identifier, password, role });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const sendOtp = async (identifier) => {
    const res = await api.post('/auth/send-otp', { identifier });
    return res.data;
  };

  const verifyOtp = async (identifier, otpCode, role) => {
    const res = await api.post('/auth/verify-otp', { identifier, otpCode, role });
    if (res.data.success && res.data.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (name, email, phone, password, role = 'student', rollNumber = '', department = '') => {
    const res = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
      role,
      rollNumber,
      department,
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginPassword,
        sendOtp,
        verifyOtp,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
