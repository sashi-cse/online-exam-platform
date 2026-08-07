import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, BookOpen, LogOut, User as UserIcon, BarChart3, KeyRound } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const Navbar = () => {
  const { user, logout, isAdmin, isTeacher } = useAuth();
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
      <header className="no-print bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to={isAdmin ? "/admin/manage" : isTeacher ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">Prep<span className="text-blue-400">Pulse</span></span>
              <span className="block text-[10px] text-slate-400 font-medium leading-none">Online Exam Platform</span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin/manage"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/admin/manage' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4 text-purple-400" /> Admin Console
              </Link>
            )}

            {(isAdmin || isTeacher) && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> Exam Repository
              </Link>
            )}

            {!isAdmin && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Available Exams
                </Link>
                <Link
                  to="/my-results"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/my-results' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> My Past Results
                </Link>
              </>
            )}
          </nav>

          {/* Clickable Profile Card Widget */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all text-left shadow-sm group"
              title="Click to view & edit profile details"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight group-hover:text-blue-300 transition-colors">{user.name}</p>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isAdmin ? 'text-purple-400' : isTeacher ? 'text-amber-400' : 'text-blue-400'
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
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Profile Details & Log Out Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
