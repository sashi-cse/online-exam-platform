import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, Shield, AlertCircle, UserCheck, UserPlus, KeyRound, Smartphone, CheckCircle2, RotateCw } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('student'); // 'student', 'teacher', 'admin'
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginPassword, loginGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer loop
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
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
      if (err.response?.data?.requiresOtp) {
        setInfoMessage('Account unverified. An OTP code is required.');
        setLoginMethod('otp');
        handleSendOtp();
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setInfoMessage('');
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

  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Please enter your Mobile Number or Email Address to send OTP.');
      return;
    }
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await sendOtp(identifier);
      if (res.success) {
        setOtpSent(true);
        setCooldownSeconds(30);
        setInfoMessage(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the valid 6-digit OTP code.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await verifyOtp(identifier, otpCode, role);
      if (res.success) {
        if (res.user?.role === 'admin') {
          navigate('/admin/manage');
        } else if (res.user?.role === 'teacher') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
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
        <p className="mt-1 text-sm text-slate-400">Online Exam & Evaluation Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10 space-y-6">
          
          {/* Role Selector Tabs (Student vs Teacher vs Super Admin) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Select Portal:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setError('');
                  setInfoMessage('');
                }}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
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
                  setInfoMessage('');
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
                  setInfoMessage('');
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
          </div>

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="space-y-2">
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
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">or sign in with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
          </div>

          {/* Authentication Method Switcher (Password vs Real-Time OTP) */}
          <div className="flex items-center justify-center gap-4 text-xs border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setOtpSent(false);
                setError('');
              }}
              className={`font-semibold transition-colors pb-1 ${
                loginMethod === 'password' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Password Login
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('otp');
                setError('');
              }}
              className={`font-semibold transition-colors pb-1 ${
                loginMethod === 'otp' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Real-Time OTP Login
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* PASSWORD LOGIN FORM */}
          {loginMethod === 'password' && (
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="user@school.com or 9876543210"
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
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 ${
                  role === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                    : role === 'teacher'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                }`}
              >
                {submitting ? 'Authenticating...' : `Sign In as ${role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* OTP LOGIN FORM */}
          {loginMethod === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile Number or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={otpSent}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                    placeholder="9876543210 or user@school.com"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={submitting || !identifier}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {submitting ? 'Sending OTP Code...' : 'Send 6-Digit OTP Code'}
                </button>
              ) : (
                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                  <div>
                    <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                      Enter 6-Digit Verification OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="block w-full text-center text-2xl font-mono tracking-widest py-3 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="123456"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={cooldownSeconds > 0 || submitting}
                      className="text-amber-400 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Registration Link */}
          {role !== 'admin' && (
            <div className="pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">Don't have an account yet?</p>
              <Link
                to={`/register?role=${role}`}
                className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  role === 'teacher' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Register New {role === 'teacher' ? 'Teacher Account' : 'Student Account'}
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
