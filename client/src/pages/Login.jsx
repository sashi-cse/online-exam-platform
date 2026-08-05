import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, PhoneCall, ArrowRight, Shield, AlertCircle, UserPlus, ShieldCheck, Mail } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.user.role === 'admin') {
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

  const fillDemo = (role, usePhone = false) => {
    if (role === 'admin') {
      setIdentifier(usePhone ? '9876543210' : 'admin@exam.com');
      setPassword('admin123');
    } else {
      setIdentifier(usePhone ? '9123456789' : 'student@exam.com');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Prep<span className="text-blue-400">Pulse</span></h2>
        <p className="mt-1 text-sm text-slate-400">Online Exam Portal & Test Booklet Engine</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
          
          {/* Demo Fill Buttons */}
          <div className="mb-6 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-2">
            <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-blue-400" /> One-Click Demo Logins:</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-all"
              >
                Teacher / Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg transition-all"
              >
                Student Demo
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile Number or Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="9876543210 or name@school.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration Section for both Teacher and Student */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Need a New Account?</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/register?role=admin"
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Register Teacher
              </Link>
              <Link
                to="/register?role=student"
                className="py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <UserPlus className="w-4 h-4 text-blue-400" /> Register Student
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
