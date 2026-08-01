import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import QuestionBuilder from './QuestionBuilder';
import { ArrowLeft, Plus, Edit2, Trash2, Printer, CheckCircle, HelpCircle, BookOpen, Layers } from 'lucide-react';

const ExamManage = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Exam Manager</span>
            <h1 className="text-2xl font-extrabold text-white">{exam?.title || 'Loading Exam...'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/booklet/print/${id}`}
            target="_blank"
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Export NEET Booklet
          </Link>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Exam Details Pill */}
      {exam && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Subject / Stream</span>
            <span className="font-bold text-white text-sm">{exam.subject}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Booklet Code</span>
            <span className="font-mono text-amber-300 font-bold text-sm">{exam.bookletCode}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Questions</span>
            <span className="font-bold text-blue-400 text-sm">{questions.length} Questions</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Exam Marks</span>
            <span className="font-bold text-emerald-400 text-sm">{exam.totalMarks} Marks</span>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" /> Continuous Question Paper ({questions.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No questions added yet</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add Question" to start building your test paper with LaTeX equations!</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center">
                    Q{q.questionNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {q.subject}
                  </span>
                  <span className="text-xs text-slate-400">
                    Marks: <strong className="text-emerald-400">+{q.marksForCorrect}</strong> / <strong className="text-rose-400">-{q.negativeMarksForIncorrect}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setShowQuestionModal(true);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-white text-base font-medium pl-2 border-l-2 border-blue-500">
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
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <MathRenderer text={opt} />
                      {isCorrect && <CheckCircle className="w-4 h-4 ml-auto text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Solution */}
              {q.solution && (
                <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-amber-400 block mb-1">Worked Solution:</span>
                  <MathRenderer text={q.solution} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

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
  );
};

export default ExamManage;
