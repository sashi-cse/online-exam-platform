import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import QuestionBuilder from './QuestionBuilder';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Plus, Edit2, Trash2, Printer, CheckCircle, HelpCircle, BookOpen, Layers, Copy } from 'lucide-react';

const ExamManage = () => {
  const { isDark } = useTheme();
  const { id } = useParams();
    const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchExamAndQuestions();
  }, [id]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/questions/exam/${id}`),
      ]);

      if (examRes.data.success) {
        setExam(examRes.data.exam);
      }
      if (questionsRes.data.success) {
        setQuestions(questionsRes.data.questions);
      }
    } catch (err) {
      console.error('Failed to load exam management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question? Continuous numbering will be automatically re-indexed.')) {
      return;
    }
    try {
      const res = await api.delete(`/questions/${qId}`);
      if (res.data.success) {
        fetchExamAndQuestions();
      }
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#07080b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className={`p-2.5 rounded-xl transition-colors border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs text-blue-500 font-extrabold uppercase tracking-wider">Exam Manager</span>
              <h1 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{exam?.title || 'Loading Exam...'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/booklet/print/${id}`}
              target="_blank"
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4 text-amber-500" /> Export NEET Booklet
            </Link>

            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionModal(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {/* Exam Details Pill */}
        {exam && (
          <div className={`border rounded-3xl p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <span className="text-slate-400 block font-semibold">Subject / Stream</span>
              <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{exam.subject}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Booklet Code</span>
              <span className="font-mono text-amber-500 font-extrabold text-sm">{exam.bookletCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Total Questions</span>
              <span className="font-extrabold text-blue-500 text-sm">{questions.length} Questions</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Total Exam Marks</span>
              <span className="font-extrabold text-emerald-500 text-sm">{exam.totalMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Test Code (Share with Students)</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-cyan-500 font-extrabold text-sm">{exam.testCode || 'N/A'}</span>
                {exam.testCode && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exam.testCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 transition-colors"
                    title="Copy test code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                {copiedCode && (
                  <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Layers className="w-5 h-5 text-blue-500" /> Continuous Question Paper ({questions.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center text-slate-400 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No questions added yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Question" to start building your test paper with LaTeX equations!</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q._id} className={`border rounded-3xl p-6 space-y-4 transition-all ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-500 font-bold text-sm flex items-center justify-center">
                      Q{q.questionNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {q.subject}
                    </span>
                    <span className="text-xs text-slate-400">
                      Marks: <strong className="text-emerald-500">+{q.marksForCorrect}</strong> / <strong className="text-rose-500">-{q.negativeMarksForIncorrect}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setShowQuestionModal(true);
                      }}
                      className={`p-2 rounded-xl transition-colors ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Edit Question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors border border-rose-500/20"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className={`text-base font-medium pl-2 border-l-2 border-blue-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <MathRenderer text={q.questionText} />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === q.correctOption;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-sm flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-semibold'
                            : isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <MathRenderer text={opt} />
                        {isCorrect && <CheckCircle className="w-4 h-4 ml-auto text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Solution */}
                {q.solution && (
                  <div className={`p-3.5 rounded-2xl text-xs border ${
                    isDark ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <span className="font-bold text-amber-500 block mb-1">Worked Solution:</span>
                    <MathRenderer text={q.solution} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Done Button at the bottom */}
        {!loading && questions.length > 0 && (
          <div className={`pt-6 pb-4 border-t flex justify-center items-center ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <Link
              to="/admin"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle className="w-5 h-5 text-white" /> Done (Return to Dashboard)
            </Link>
          </div>
        )}

        {/* Question Builder Modal */}
        {showQuestionModal && (
          <QuestionBuilder
            examId={id}
            questionToEdit={editingQuestion}
            onClose={() => setShowQuestionModal(false)}
            onSuccess={() => {
              setShowQuestionModal(false);
              fetchExamAndQuestions();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExamManage;
