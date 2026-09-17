import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, User, Lock, Mail, Phone, ArrowRight, AlertCircle, Shield, UserCheck, BookOpen, Building, ArrowLeft, Sun, Moon } from 'lucide-react';

const Register = () => {
  const { isDark, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' || searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole); // 'student' or 'teacher'
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, loginPassword, loginGoogle } = useAuth();
    const navigate = useNavigate();

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'teacher') {
      setRole('teacher');
    } else if (paramRole === 'student') {
      setRole('student');
    }
  }, [searchParams]);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
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

    if (!phone && !email) {
      setError('Please provide at least a Mobile Number or Email Address.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, phone, password, role, rollNumber, department);
      // Auto-login after successful registration
      const identifier = email.trim() || phone.trim();
      const res = await loginPassword(identifier, password, role);
      if (res.user?.role === 'teacher') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 font-sans ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Background Lighting Blobs */}
      {isDark ? (
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      ) : (
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border transition-all ${
            isDark 
              ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white/80 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Homepage
        </Link>

        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-full border shadow-md transition-all duration-300 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
              : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 ${
          isDark ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/25' : 'bg-indigo-600 text-white shadow-indigo-600/25'
        }`}>
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Create Account
        </h2>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          Register as a Student or Teacher
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className={`backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border sm:px-10 space-y-6 transition-colors duration-300 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              {/* Account Role Selector */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'student'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-500 ring-1 ring-blue-500'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      role === 'teacher'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500 ring-1 ring-amber-500'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Teacher
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder={role === 'teacher' ? "Prof. Rajesh Kumar" : "Akansha"}
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {/* Email Address Field */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder={role === 'teacher' ? "teacher@school.com" : "student@school.com"}
                  />
                </div>
              </div>

              {/* Role specific input */}
              {role === 'student' ? (
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Roll Number / Student ID (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="NEET-2026-001"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Department / Subject Area (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="Physics & Chemistry"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="•••••••• (Min 6 characters)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 px-4 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm transform hover:scale-[1.01] disabled:opacity-50 ${
                  role === 'teacher'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                }`}
              >
                {submitting ? 'Creating Account...' : `Create Account (${role === 'teacher' ? 'Teacher' : 'Student'})`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* GOOGLE SIGN-UP BUTTON */}
            <div className={`pt-2 space-y-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="relative flex py-1 items-center">
                <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">or register with</span>
                <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-Up process failed. Please try again.')}
                  theme={isDark ? "filled_dark" : "filled_blue"}
                  shape="pill"
                  size="large"
                  text="signup_with"
                  width="340"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-500 hover:underline">
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
