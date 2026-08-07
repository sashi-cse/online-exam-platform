import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginPassword = async (identifier, password, role) => {
    const res = await api.post('/auth/login-password', { identifier, password, role });
    if (res.data.success) {
      if (res.data.token) localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const loginGoogle = async (credential, role) => {
    const res = await api.post('/auth/google', { credential, role });
    if (res.data.success && res.data.user) {
      if (res.data.token) localStorage.setItem('token', res.data.token);
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
    if (res.data.success && res.data.user) {
      if (res.data.token) localStorage.setItem('token', res.data.token);
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

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success && res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginPassword,
        loginGoogle,
        sendOtp,
        verifyOtp,
        register,
        updateProfile,
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
