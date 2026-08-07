import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Lock, Mail, Phone, ArrowRight, AlertCircle, Shield, UserCheck, BookOpen, Building, CheckCircle2, RotateCw } from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' || searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [step, setStep] = useState(1); // 1: Fill details, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole); // 'student' or 'teacher'
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, loginGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'teacher') {
      setRole('teacher');
    } else if (paramRole === 'student') {
      setRole('student');
    }
  }, [searchParams]);

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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await loginGoogle(credentialResponse.credential, role);
      if (res.user?.role === 'teacher') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-Up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone && !email) {
      setError('Please provide at least a Mobile Number or Email Address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(name, email, phone, password, role, rollNumber, department);
      if (res.requiresOtp) {
        setStep(2);
        setCooldownSeconds(30);
        setInfoMessage(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    const identifier = email.trim() || phone.trim();
    if (!identifier) return;

    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await sendOtp(identifier);
      if (res.success) {
        setCooldownSeconds(30);
        setInfoMessage(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }

    const identifier = email.trim() || phone.trim();
    setError('');
    setSubmitting(true);
    try {
      const res = await verifyOtp(identifier, otpCode, role);
      if (res.success) {
        if (role === 'teacher') {
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {step === 1 ? 'Create Account' : 'Verify Your Account'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {step === 1 ? 'Register as a Student or Teacher' : 'Enter 6-digit OTP verification code'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10 space-y-6">
          
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

          {/* STEP 1: Registration Details */}
          {step === 1 && (
            <div className="space-y-5">
              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                {/* Account Role Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === 'student'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" /> Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === 'teacher'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Shield className="w-4 h-4" /> Teacher
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder={role === 'teacher' ? "Prof. Rajesh Kumar" : "Rahul Verma"}
                    />
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                {/* Email Address Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder={role === 'teacher' ? "teacher@school.com" : "student@school.com"}
                    />
                  </div>
                </div>

                {/* Role specific input */}
                {role === 'student' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Roll Number / Student ID (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="NEET-2026-001"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Department / Subject Area (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Physics & Chemistry"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="•••••••• (Min 6 characters)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 ${
                    role === 'teacher'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/25'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                  }`}
                >
                  {submitting ? 'Creating Account...' : `Register & Verify OTP (${role === 'teacher' ? 'Teacher' : 'Student'})`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* GOOGLE SIGN-UP BUTTON (BELOW REGISTER BUTTON) */}
              <div className="pt-2 space-y-3 border-t border-slate-800/80">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">or register with</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Sign-Up process failed. Please try again.')}
                    theme="filled_dark"
                    shape="pill"
                    size="large"
                    text="signup_with"
                    width="340"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleVerifyOtpSubmit}>
              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit OTP Code Sent to {email || phone}
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
                  onClick={handleResendOtp}
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
                {submitting ? 'Verifying OTP...' : 'Verify OTP & Activate Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
