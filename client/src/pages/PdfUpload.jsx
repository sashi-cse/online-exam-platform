import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { useTheme } from '../context/ThemeContext';
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, X, Loader2, Eye, ChevronDown, ChevronUp, Edit3, ArrowRight } from 'lucide-react';

const PdfUpload = ({ onExamCreated, onClose }) => {
  const { isDark } = useTheme();
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Creating
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState(null);

  
  // Exam settings
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [marksPerQuestion, setMarksPerQuestion] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [creating, setCreating] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);

  const fileInputRef = useRef(null);

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
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleParsePdf = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await api.post('/pdf/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout for AI processing
      });

      if (res.data.success) {
        setParsedData(res.data.data);
        setExamTitle(res.data.data.suggestedTitle || file.name.replace('.pdf', ''));
        setExamSubject(res.data.data.suggestedSubject || 'General');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse PDF. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleCreateExam = async () => {
    if (!parsedData || !parsedData.questions.length) return;

    setCreating(true);
    setError('');

    try {
      const res = await api.post('/pdf/create-exam', {
        title: examTitle,
        subject: examSubject,
        durationMinutes,
        defaultMarksPerQuestion: marksPerQuestion,
        defaultNegativeMarks: negativeMarks,
        questions: parsedData.questions,
      });

      if (res.data.success) {
        setStep(3);
        setTimeout(() => {
          if (onExamCreated) onExamCreated(res.data.exam);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam.');
    } finally {
      setCreating(false);
    }
  };

  const updateQuestion = (idx, field, value) => {
    setParsedData(prev => {
      const updated = { ...prev };
      updated.questions = [...updated.questions];
      updated.questions[idx] = { ...updated.questions[idx], [field]: value };
      return updated;
    });
  };

  const removeQuestion = (idx) => {
    setParsedData(prev => {
      const updated = { ...prev };
      updated.questions = updated.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionNumber: i + 1 }));
      return updated;
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-upload-modal-title"
    >
      <div
        className={`border rounded-3xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {step === 1 ? 'Upload Question Paper PDF' : step === 2 ? 'Review Parsed Questions' : 'Exam Created!'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 1 ? 'AI will automatically extract all MCQ questions' : step === 2 ? `${parsedData?.questions.length} questions found — review and create exam` : 'Your exam is ready to share!'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded.xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload PDF */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : isDark 
                      ? 'border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5' 
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-500/50 hover:bg-indigo-50/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-emerald-500 font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB — Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-indigo-500 mx-auto" />
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Click to select your Question Paper PDF</p>
                    <p className="text-xs text-slate-400">Supports text-based PDFs up to 20MB</p>
                  </div>
                )}
              </div>

              {/* AI Info */}
              <div className={`border rounded-2xl p-4 text-xs space-y-1 ${
                isDark 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' 
                  : 'bg-purple-50 border-purple-200 text-purple-800'
              }`}>
                <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Powered by Google Gemini AI</p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>AI will automatically detect questions, options, correct answers, and subject sections from your PDF.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Edit Questions */}
          {step === 2 && parsedData && (
            <div className="space-y-5">
              {/* AI Parse Summary */}
              <div className={`border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div>
                  <span className="text-slate-400 block">Questions Found</span>
                  <span className="text-emerald-500 font-extrabold text-lg">{parsedData.questions.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PDF Pages</span>
                  <span className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{parsedData.totalPages}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Answer Key</span>
                  <span className={`font-extrabold text-lg ${parsedData.hasAnswerKey ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {parsedData.hasAnswerKey ? 'Detected' : 'Not Found'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Subject</span>
                  <span className="text-indigo-500 font-extrabold text-lg">{parsedData.suggestedSubject}</span>
                </div>
              </div>

              {/* Exam Settings */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Exam Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Title</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                    <input
                      type="text"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">+ve Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={marksPerQuestion}
                      onChange={(e) => setMarksPerQuestion(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">-ve Marks</label>
                    <input
                      type="number"
                      min="0"
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-2">
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Eye className="w-4 h-4 text-indigo-500" /> Questions Preview
                </h4>
                
                {parsedData.questions.map((q, idx) => (
                  <div key={idx} className={`border rounded-2xl overflow-hidden ${
                    isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100'
                      }`}
                      onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                          {q.questionText.substring(0, 80)}{q.questionText.length > 80 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {q.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          Ans: {String.fromCharCode(65 + q.correctOption)}
                        </span>
                        {expandedQ === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {expandedQ === idx && (
                      <div className={`px-3 pb-3 space-y-3 border-t pt-3 ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <MathRenderer text={q.questionText} />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              onClick={() => updateQuestion(idx, 'correctOption', optIdx)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                optIdx === q.correctOption
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-semibold'
                                  : isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                optIdx === q.correctOption ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <MathRenderer text={opt} />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-xs text-rose-500 font-semibold underline"
                        >
                          Remove this question
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Exam Created Successfully!</h3>
              <p className="text-sm text-slate-400">Redirecting to exam management...</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 3 && (
          <div className={`p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                onClick={handleParsePdf}
                disabled={!file || parsing}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> AI Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Parse with AI
                  </>
                )}
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleCreateExam}
                disabled={creating || !parsedData?.questions.length}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Exam...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Create Exam ({parsedData.questions.length} Questions)
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PdfUpload;
