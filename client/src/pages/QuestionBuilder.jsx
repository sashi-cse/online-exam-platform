import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { useTheme } from '../context/ThemeContext';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

const QuestionBuilder = ({ examId, questionToEdit, onClose, onSuccess }) => {
  const { isDark } = useTheme();
  
  const [subject, setSubject] = useState(questionToEdit?.subject || 'Physics');
  const [questionText, setQuestionText] = useState(questionToEdit?.questionText || '');
  const [options, setOptions] = useState(questionToEdit?.options || ['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(questionToEdit?.correctOption ?? 0);
  const [marksForCorrect, setMarksForCorrect] = useState(questionToEdit?.marksForCorrect ?? 4);
  const [negativeMarksForIncorrect, setNegativeMarksForIncorrect] = useState(questionToEdit?.negativeMarksForIncorrect ?? 1);
  const [solution, setSolution] = useState(questionToEdit?.solution || '');
  const [submitting, setSubmitting] = useState(false);

  // Body scroll lock & Escape key listener
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert('Question text cannot be empty');
      return;
    }
    if (options.some((o) => !o.trim())) {
      alert('All 4 options must be filled');
      return;
    }

    setSubmitting(true);
    try {
      if (questionToEdit) {
        await api.put(`/questions/${questionToEdit._id}`, {
          subject,
          questionText,
          options,
          correctOption: Number(correctOption),
          marksForCorrect: Number(marksForCorrect),
          negativeMarksForIncorrect: Number(negativeMarksForIncorrect),
          solution,
        });
      } else {
        await api.post(`/questions/exam/${examId}`, {
          subject,
          questionText,
          options,
          correctOption: Number(correctOption),
          marksForCorrect: Number(marksForCorrect),
          negativeMarksForIncorrect: Number(negativeMarksForIncorrect),
          solution,
        });
      }
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`border rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {questionToEdit ? 'Edit Question' : 'Create Question with LaTeX Math'}
            </h3>
            <p className="text-xs text-slate-400">Use $...$ for inline equations or $$...$$ for block formulas.</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject & Marks row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
                Subject Section
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
                <option value="Mathematics">Mathematics</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
                Marks for Correct (+ve)
              </label>
              <input
                type="number"
                min="1"
                required
                value={marksForCorrect}
                onChange={(e) => setMarksForCorrect(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
                Negative Marks (-ve)
              </label>
              <input
                type="number"
                min="0"
                required
                value={negativeMarksForIncorrect}
                onChange={(e) => setNegativeMarksForIncorrect(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
              Question Text (Supports LaTeX e.g. $v = 3\sqrt{x}$)
            </label>
            <textarea
              rows="3"
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. A particle moves such that $v = 3\sqrt{x}$ m/s. Find acceleration."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            ></textarea>
            
            {/* Live KaTeX Preview */}
            {questionText && (
              <div className={`mt-2 p-3 border rounded-xl text-sm ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Live LaTeX Preview:</span>
                <MathRenderer text={questionText} className="text-indigo-500 font-semibold" />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Multiple Choice Options & Select Correct Choice
            </label>

            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="correctOption"
                  checked={Number(correctOption) === idx}
                  onChange={() => setCorrectOption(idx)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-slate-400 cursor-pointer"
                />
                <span className="w-6 font-bold text-sm text-slate-400 text-center">
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)} (e.g. $4.5 \\text{ m/s}^2$)`}
                  className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                {opt && (
                  <div className={`max-w-[200px] truncate text-xs px-2 py-1 rounded border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600 font-semibold'
                  }`}>
                    <MathRenderer text={opt} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Worked Solution */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
              Worked Solution / Step-by-Step Explanation
            </label>
            <textarea
              rows="3"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Detailed worked explanation shown to students after submitting..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            ></textarea>
            {solution && (
              <div className={`mt-2 p-3 border rounded-xl text-sm ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">Solution Preview:</span>
                <MathRenderer text={solution} className={isDark ? 'text-slate-300' : 'text-slate-700'} />
              </div>
            )}
          </div>

          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Saving Question...' : questionToEdit ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};

export default QuestionBuilder;
