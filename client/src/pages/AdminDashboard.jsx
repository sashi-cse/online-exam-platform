import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BookOpen, Plus, Users, BarChart2, Printer, Eye, Trash2, Edit3, CheckCircle, XCircle, Sparkles, FileText, Copy, Share2 } from 'lucide-react';

const AdminDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // New Exam Form State
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
        // Redirect to question manager for the new exam
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
    if (!window.confirm('Are you sure you want to delete this exam and all associated questions and student submissions?')) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Teacher & Administrator Portal
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Exam Management Console</h1>
          <p className="text-sm text-slate-400 mt-1">Create test papers, manage LaTeX questions, export NEET-style printable booklets, and view student marks.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-5 h-5" /> Create New Exam
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Exams Created</p>
            <p className="text-2xl font-bold text-white">{exams.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Published & Active</p>
            <p className="text-2xl font-bold text-white">{exams.filter((e) => e.isPublished).length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Student Submissions</p>
            <p className="text-2xl font-bold text-white">
              {exams.reduce((sum, e) => sum + (e.totalAttemptsCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Exams List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Exam Repository & Booklets
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading exam records...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No exams created yet</p>
            <p className="text-xs text-slate-500 mt-1">Click "Create New Exam" to build your first test paper!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {exams.map((exam) => (
              <div key={exam._id} className="p-6 hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {exam.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Code: {exam.bookletCode}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      exam.isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {exam.isPublished ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {exam.testCode && (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1.5">
                        📋 {exam.testCode}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(exam.testCode);
                            setCopiedId(exam._id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="ml-0.5 p-0.5 rounded hover:bg-cyan-500/20 transition-colors"
                          title="Copy test code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedId === exam._id && (
                          <span className="text-[9px] text-emerald-400 font-semibold">Copied!</span>
                        )}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{exam.description || 'No description'}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>⏱️ {exam.durationMinutes} Mins</span>
                    <span>❓ {exam.questionCount} Questions</span>
                    <span>🎯 {exam.totalMarks} Total Marks</span>
                    <span>📊 {exam.totalAttemptsCount || 0} Submissions</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/admin/exam/${exam._id}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Manage Questions
                  </Link>

                  <Link
                    to={`/admin/exam/${exam._id}/analytics`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> Results & Analytics
                  </Link>

                  <Link
                    to={`/booklet/print/${exam._id}`}
                    target="_blank"
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" /> Print NEET Booklet
                  </Link>

                  <button
                    onClick={() => handleTogglePublish(exam._id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      exam.isPublished
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {exam.isPublished ? 'Unpublish' : 'Publish Exam'}
                  </button>

                  <button
                    onClick={() => handleDeleteExam(exam._id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-colors"
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
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Create New Exam / Test Paper</h3>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Physics & Chemistry NEET Mock Test 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Subject / Stream
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Physics, Chemistry, Biology"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Test Booklet Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bookletCode}
                    onChange={(e) => setFormData({ ...formData, bookletCode: e.target.value })}
                    placeholder="e.g. NEET-2026-SET-A"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Correct Mark (+ve)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.defaultMarksPerQuestion}
                    onChange={(e) => setFormData({ ...formData, defaultMarksPerQuestion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Negative Mark (-ve)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.defaultNegativeMarks}
                    onChange={(e) => setFormData({ ...formData, defaultNegativeMarks: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter exam scope or special rules..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25"
                >
                  Create & Add Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
