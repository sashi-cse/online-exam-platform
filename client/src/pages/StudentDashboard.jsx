import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Award, 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  KeyRound, 
  ArrowRight, 
  AlertCircle,
  FileText,
  CheckCircle,
  Calendar,
  BarChart3,
  Sparkles,
  Search
} from 'lucide-react';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const { user } = useAuth();
  const { isDark } = useTheme();
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
    if (!window.confirm('Are you sure you want to reset your attempt? Your previous score will be cleared.')) {
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

  const handleJoinTest = async () => {
    const code = testCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a test code.');
      return;
    }
    setJoinError('');
    setJoinSuccess('');
    setJoinLoading(true);
    try {
      const res = await api.get('/exams/join/' + code);
      if (res.data.success) {
        const exam = res.data.exam;
        setJoinSuccess('Test found! Redirecting to exam...');
        setTimeout(() => {
          navigate(`/exam/take/${exam._id}`);
        }, 500);
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid test code. Please check and try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  // Metrics calculation
  const attemptedExams = exams.filter(e => e.userAttempt && ['submitted', 'auto_submitted'].includes(e.userAttempt.status));
  const examsTakenCount = attemptedExams.length;
  const passedCount = attemptedExams.filter(e => (e.userAttempt.score / e.userAttempt.totalMarks) >= 0.4).length;
  const avgScore = examsTakenCount > 0 
    ? Math.round(attemptedExams.reduce((acc, curr) => acc + ((curr.userAttempt.score / curr.userAttempt.totalMarks) * 100), 0) / examsTakenCount)
    : 100;
  const upcomingCount = exams.length - examsTakenCount;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#07080b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Hero Banner Card */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold mb-3 ${
              isDark 
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Student Examination Portal
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Welcome, {user?.name || 'Student'} 👋
            </h1>
            <p className={`text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Access your assigned tests, track score performance, view detailed solution keys, or join live exams using test codes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#available-exams"
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4" /> View Available Exams
            </a>
          </div>
        </div>

        {/* 4 Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Exams Attempted</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{examsTakenCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Average Accuracy</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{avgScore}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold shrink-0">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tests Passed</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{passedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming & Ready</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{upcomingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Join Test Code Box Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 transition-all ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Join Test with Instructor Code</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Have a test code from your teacher? Enter it below to launch your exam immediately.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-lg pt-1">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              placeholder="e.g. EXAM-88204"
              className={`px-4 py-3 border rounded-2xl font-mono font-bold uppercase text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 ${
                isDark 
                  ? 'bg-slate-955 border-slate-700 text-white placeholder-slate-600' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              onClick={handleJoinTest}
              disabled={joinLoading || !testCode.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center gap-2"
            >
              {joinLoading ? 'Joining Test...' : 'Launch Test'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {joinError && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2 max-w-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{joinError}</span>
            </div>
          )}
          {joinSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-500 text-xs flex items-center gap-2 max-w-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{joinSuccess}</span>
            </div>
          )}
        </div>

        {/* Main Section Card: Available Exams & Tests */}
        <div id="available-exams" className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Available Exams & Question Papers
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select an exam below to begin taking your proctored test.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading available exams...</div>
          ) : exams.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-500'
            }`}>
              No exams available at the moment. Please check back later.
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const hasAttempted = Boolean(exam.userAttempt && ['submitted', 'auto_submitted'].includes(exam.userAttempt.status));
                const subject = exam.subject || 'General Exam';
                const bookletCode = exam.bookletCode || 'NEET-CODE-A';

                return (
                  <div key={exam._id} className={`p-5 rounded-2xl border transition-all ${
                    isDark 
                      ? 'bg-slate-955 border-slate-800/80 hover:border-slate-700' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="space-y-2">
                        {/* Pill Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                            {subject}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            Code: {bookletCode}
                          </span>

                          {exam.testCode && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                            }`}>
                              🔑 {exam.testCode}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {exam.title}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {exam.description || 'Proctored live examination paper.'}
                        </p>

                        {/* Metadata row */}
                        <div className={`flex flex-wrap items-center gap-4 text-xs font-medium pt-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.durationMinutes} Mins
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> {exam.questionCount || 0} Questions
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-slate-400" /> {(exam.questionCount || 0) * (exam.defaultMarksPerQuestion || 4)} Total Marks
                          </span>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="shrink-0 flex items-center gap-3 pt-2 md:pt-0">
                        {hasAttempted ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed ({exam.userAttempt.score}/{exam.userAttempt.totalMarks})
                            </span>
                            <button
                              onClick={() => navigate(`/result/${exam.userAttempt._id}`)}
                              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              View Scorecard
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartExam(exam._id)}
                            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 transform hover:scale-[1.02]"
                          >
                            <Play className="w-4 h-4 fill-current" /> Take Exam
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Section Card: My Past Results & History */}
        <div id="results" className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  My Past Results & Performance Scorecards
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review your scores, solution breakdowns, and retake tests if allowed.</p>
              </div>
            </div>
          </div>

          {attemptedExams.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-500'
            }`}>
              No completed test attempts yet. Select an available exam above to start.
            </div>
          ) : (
            <div className="space-y-4">
              {attemptedExams.map((exam) => {
                const percentage = Math.round((exam.userAttempt.score / exam.userAttempt.totalMarks) * 100);
                const isPassed = percentage >= 40;

                return (
                  <div key={exam._id} className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark 
                      ? 'bg-slate-955 border-slate-800' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isPassed 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {isPassed ? 'Passed' : 'Needs Review'} ({percentage}%)
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400 font-medium">
                          Submitted on {new Date(exam.userAttempt.submittedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {exam.title}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Score: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{exam.userAttempt.score}</strong> / {exam.userAttempt.totalMarks} Marks
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/result/${exam.userAttempt._id}`)}
                        className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                      >
                        Detailed Scorecard
                      </button>

                      <button
                        onClick={() => handleResetAttempt(exam._id)}
                        disabled={resettingId === exam._id}
                        className={`p-2.5 rounded-2xl border transition-all text-xs flex items-center gap-1.5 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Reset attempt and retake exam"
                      >
                        <RotateCcw className="w-4 h-4" /> {resettingId === exam._id ? 'Resetting...' : 'Retake Test'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
