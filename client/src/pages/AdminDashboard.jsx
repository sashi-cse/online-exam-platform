import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PdfUpload from './PdfUpload';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  BookOpen, 
  Plus, 
  Users, 
  BarChart2, 
  Printer, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  FileText, 
  Copy, 
  Upload 
} from 'lucide-react';

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

    const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bookletCode: 'NEET-2026-SET-A',
    subject: 'Physics & Chemistry',
    durationMinutes: 60,
    defaultMarksPerQuestion: 4,
    defaultNegativeMarks: 1,
    isPublished: false,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  // Lock body scroll while Create Exam modal is open
  useEffect(() => {
    if (!showCreateModal) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreateModal]);

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

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/exams', formData);
      if (res.data.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          bookletCode: 'NEET-2026-SET-A',
          subject: 'Physics & Chemistry',
          durationMinutes: 60,
          defaultMarksPerQuestion: 4,
          defaultNegativeMarks: 1,
          isPublished: false,
        });
        fetchExams();
        navigate(`/admin/exam/${res.data.exam._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleTogglePublish = async (examId) => {
    try {
      const res = await api.patch(`/exams/${examId}/toggle-publish`);
      if (res.data.success) {
        fetchExams();
      }
    } catch (err) {
      alert('Failed to update publish status');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return;
    }
    try {
      const res = await api.delete(`/exams/${examId}`);
      if (res.data.success) {
        fetchExams();
      }
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#07080b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Banner */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              isDark 
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Teacher & Administrator Portal
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Exam Management Console
            </h1>
            <p className={`text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Create test papers, manage LaTeX questions, export NEET-style printable booklets, and view student marks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowPdfUpload(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" /> Upload PDF
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Create New Exam
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Exams Created</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{exams.length}</p>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Published & Active</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {exams.filter((e) => e.isPublished).length}
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Student Submissions</p>
              <p className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {exams.reduce((sum, e) => sum + (e.totalAttemptsCount || 0), 0)}
              </p>
            </div>
          </div>

        </div>

        {/* Exams List Table Container */}
        <div className={`rounded-3xl border overflow-hidden transition-all ${
          isDark 
            ? 'bg-slate-900/70 border-slate-800 shadow-2xl' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <FileText className="w-5 h-5 text-blue-500" /> Exam Repository & Booklets
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading exam records...</div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>No exams created yet</p>
              <p className="text-xs text-slate-500 mt-1">Click "Create New Exam" to build your first test paper!</p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
              {exams.map((exam) => (
                <div key={exam._id} className={`p-6 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}>
                  
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {exam.subject}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        Code: {exam.bookletCode}
                      </span>
                      {exam.testCode && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center gap-1">
                          📋 {exam.testCode}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{exam.title}</h3>
                    <p className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{exam.description || 'No description provided.'}</p>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 pt-1">
                      <span>⏱️ {exam.durationMinutes} Mins</span>
                      <span>❓ {exam.questionCount} Questions</span>
                      <span>🎯 {exam.totalMarks} Marks</span>
                      <span>📊 {exam.totalAttemptsCount || 0} Attempts</span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/admin/exam/${exam._id}`}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Manage Questions
                    </Link>

                    <Link
                      to={`/admin/exam/${exam._id}/analytics`}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        isDark 
                          ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30' 
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-purple-500" /> Analytics
                    </Link>

                    <Link
                      to={`/booklet/print/${exam._id}`}
                      target="_blank"
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-500" /> Print Booklet
                    </Link>

                    <button
                      onClick={() => handleTogglePublish(exam._id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        exam.isPublished
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : 'Publish Exam'}
                    </button>

                    <button
                      onClick={() => handleDeleteExam(exam._id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl transition-all"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Create Exam */}
        {showCreateModal && createPortal(
          <div
            className="fixed inset-0 z-[9999] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`border rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 transition-colors duration-300 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create New Exam / Test Paper
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Exam Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Physics & Chemistry NEET Mock Test 2026"
                    className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Subject / Stream
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Physics, Chemistry"
                      className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Booklet Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bookletCode}
                      onChange={(e) => setFormData({ ...formData, bookletCode: e.target.value })}
                      placeholder="e.g. NEET-2026-SET-A"
                      className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min="5"
                      required
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      +ve Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.defaultMarksPerQuestion}
                      onChange={(e) => setFormData({ ...formData, defaultMarksPerQuestion: Number(e.target.value) })}
                      className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      -ve Marks
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.defaultNegativeMarks}
                      onChange={(e) => setFormData({ ...formData, defaultNegativeMarks: Number(e.target.value) })}
                      className={`w-full px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Create & Add Questions
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* PDF Upload Modal */}
        {showPdfUpload && (
          <PdfUpload
            onClose={() => setShowPdfUpload(false)}
            onExamCreated={(exam) => {
              setShowPdfUpload(false);
              fetchExams();
              navigate(`/admin/exam/${exam._id}`);
            }}
          />
        )}

      </div>

    </div>
  );
};

export default AdminDashboard;
