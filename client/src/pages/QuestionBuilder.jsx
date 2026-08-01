import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

const QuestionBuilder = ({ examId, questionToEdit, onClose, onSuccess }) => {
  const [subject, setSubject] = useState(questionToEdit?.subject || 'Physics');
  const [questionText, setQuestionText] = useState(questionToEdit?.questionText || '');
  const [options, setOptions] = useState(questionToEdit?.options || ['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(questionToEdit?.correctOption ?? 0);
  const [marksForCorrect, setMarksForCorrect] = useState(questionToEdit?.marksForCorrect ?? 4);
  const [negativeMarksForIncorrect, setNegativeMarksForIncorrect] = useState(questionToEdit?.negativeMarksForIncorrect ?? 1);
  const [solution, setSolution] = useState(questionToEdit?.solution || '');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              {questionToEdit ? 'Edit Question' : 'Create Question with LaTeX Math'}
            </h3>
            <p className="text-xs text-slate-400">Use $...$ for inline equations or $$...$$ for block formulas.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject & Marks row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Subject Section
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Marks for Correct (+ve)
              </label>
              <input
                type="number"
                min="1"
                required
                value={marksForCorrect}
                onChange={(e) => setMarksForCorrect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Negative Marks (-ve)
              </label>
              <input
                type="number"
                min="0"
                required
                value={negativeMarksForIncorrect}
                onChange={(e) => setNegativeMarksForIncorrect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Question Text (Supports LaTeX e.g. $v = 3\sqrt&#123;x&#125;$)
            </label>
            <textarea
              rows="3"
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. A particle moves such that $v = 3\sqrt{x}$ m/s. Find acceleration."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            
            {/* Live KaTeX Preview */}
            {questionText && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Live LaTeX Preview:</span>
                <MathRenderer text={questionText} className="text-blue-300" />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Multiple Choice Options & Select Correct Choice
            </label>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <input
                  type="radio"
                  name="correctOption"
                  checked={Number(correctOption) === idx}
                  onChange={() => setCorrectOption(idx)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
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
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {opt && (
                  <div className="max-w-[200px] truncate text-xs text-blue-300 px-2 py-1 bg-slate-950 rounded border border-slate-800">
                    <MathRenderer text={opt} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Worked Solution */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Worked Solution / Step-by-Step Explanation
            </label>
            <textarea
              rows="3"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Detailed worked explanation shown to students after submitting..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {solution && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm">
                <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">Solution Preview:</span>
                <MathRenderer text={solution} className="text-slate-300" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {submitting ? 'Saving Question...' : questionToEdit ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QuestionBuilder;
