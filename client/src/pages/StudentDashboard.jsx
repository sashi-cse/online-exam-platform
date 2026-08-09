import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, Award, Play, CheckCircle2, ShieldAlert, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/take/${examId}`);
  };

  const handleResetAttempt = async (examId) => {
    if (!window.confirm('Are you sure you want to reset your attempt? Your previous submission will be cleared so you can retake the test paper.')) {
      return;
    }
    setResettingId(examId);
    try {
      const res = await api.post('/results/reset-mine', { examId });
      if (res.data.success) {
        await fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset test attempt.');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Student Exam Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Access your assigned test papers, view real-time countdown timers, take proctored assessments, and review detailed worked solutions.
          </p>
        </div>
      </div>

      {/* Available Exams Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> Available Tests & Exams
          </h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-medium">
            {exams.length} Test{exams.length !== 1 ? 's' : ''} Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-56 animate-pulse">
                <div className="h-5 bg-slate-800 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">No Exams Currently Published</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon when your teacher publishes new test papers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const hasAttempted = Boolean(exam.userAttempt && ['submitted', 'auto_submitted'].includes(exam.userAttempt.status));
              const isInProgress = Boolean(exam.userAttempt && exam.userAttempt.status === 'in_progress');

              return (
                <div
                  key={exam._id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-blue-500/5 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {exam.subject || 'General'}
                      </span>
                      {hasAttempted && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{exam.description || 'No description provided.'}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{exam.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{exam.questionCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{exam.totalMarks} Total Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>+{exam.defaultMarksPerQuestion} / -{exam.defaultNegativeMarks} Scheme</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    {hasAttempted ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Your Score:</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {exam.userAttempt.score} / {exam.userAttempt.totalMarks}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            to={`/result/${exam.userAttempt.id}`}
                            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-slate-700"
                          >
                            Solutions
                          </Link>
                          <button
                            onClick={() => handleResetAttempt(exam._id)}
                            disabled={resettingId === exam._id}
                            className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-amber-500/30 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retake Test
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam._id)}
                        className={`w-full py-2.5 px-4 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isInProgress
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {isInProgress ? 'Resume Exam Attempt' : 'Start Online Exam'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
