import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, Shield, AlertCircle, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('student'); // 'student', 'teacher', 'admin'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginPassword, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your Email/Mobile Number and Password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await loginPassword(identifier, password, role);
      if (res.user.role === 'admin') {
        navigate('/admin/manage');
      } else if (res.user.role === 'teacher') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await loginGoogle(credentialResponse.credential, role);
      if (res.user?.role === 'admin') {
        navigate('/admin/manage');
      } else if (res.user?.role === 'teacher') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10 space-y-5 text-center">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome to PrepPulse</h2>
            <p className="text-xs text-slate-400 mt-0.5">Online Exam & Evaluation Portal</p>
          </div>

          {/* Role Pill Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                role === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Student
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                setError('');
              }}
              className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                role === 'teacher'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Teacher
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setError('');
              }}
              className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Admin
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* PASSWORD LOGIN FORM */}
          <form className="space-y-4 text-left" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="user@school.com or 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Full Width Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 px-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 ${
                role === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'
                  : role === 'teacher'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
              }`}
            >
              {submitting ? 'Signing In...' : `Log in as ${role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'}`}
            </button>
          </form>

          {/* Simple "OR" Text (NO heavy horizontal border line!) */}
          <div className="py-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OR</span>
          </div>

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In process failed. Please try again.')}
              theme="filled_dark"
              shape="pill"
              size="large"
              text="continue_with"
              width="340"
            />
          </div>

          {/* Footer Registration Link */}
          {role !== 'admin' && (
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                New to PrepPulse?{' '}
                <Link
                  to={`/register?role=${role}`}
                  className={`font-bold transition-colors underline ${
                    role === 'teacher' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'
                  }`}
                >
                  Join for free
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
