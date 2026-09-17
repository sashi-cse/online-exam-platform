import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, BookOpen, LogOut, User as UserIcon, BarChart3, KeyRound, Sun, Moon } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const Navbar = () => {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hide navbar on exam-taking page and print booklet page
  if (location.pathname.startsWith('/exam/take/') || location.pathname.startsWith('/booklet/print/')) {
    return null;
  }

  if (!user) return null;

  return (
    <>
      <header className={`no-print border-b sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300 ${
        isDark 
          ? 'bg-[#07080b]/90 border-slate-800/80 text-white' 
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to={isAdmin ? "/admin/manage" : isTeacher ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className={`font-extrabold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Prep<span className="text-indigo-500">Pulse</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium leading-none">Online Exam Platform</span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin/manage"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/admin/manage' 
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <KeyRound className="w-4 h-4 text-purple-500" /> Admin Console
              </Link>
            )}

            {(isAdmin || isTeacher) && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/admin' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-500" /> Exam Repository
              </Link>
            )}

            {!isAdmin && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/dashboard' 
                      ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20' 
                      : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Available Exams
                </Link>
                <Link
                  to="/my-results"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/my-results' 
                      ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20' 
                      : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> My Past Results
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions: Dark/Light Toggle + User Profile */}
          <div className="flex items-center gap-3">
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all duration-300 ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all text-left shadow-sm group ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              title="Click to view & edit profile details"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-500 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isAdmin ? 'text-purple-500' : isTeacher ? 'text-amber-500' : 'text-indigo-500'
                }`}>
                  {isAdmin ? 'Super Admin' : isTeacher ? 'Teacher' : 'Student'}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>

        </div>
      </header>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
