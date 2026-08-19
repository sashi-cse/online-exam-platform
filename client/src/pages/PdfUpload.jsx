import React, { useState, useRef } from 'react';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, X, Loader2, Eye, ChevronDown, ChevronUp, Edit3, ArrowRight } from 'lucide-react';

const PdfUpload = ({ onExamCreated, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {step === 1 ? 'Upload Question Paper PDF' : step === 2 ? 'Review Parsed Questions' : 'Exam Created!'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 1 ? 'AI will automatically extract all MCQ questions' : step === 2 ? `${parsedData?.questions.length} questions found — review and create exam` : 'Your exam is ready to share!'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload PDF */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5'
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
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="text-emerald-300 font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB — Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-slate-500 mx-auto" />
                    <p className="text-white font-semibold">Click to select your Question Paper PDF</p>
                    <p className="text-xs text-slate-400">Supports text-based PDFs up to 20MB</p>
                  </div>
                )}
              </div>

              {/* AI Info */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-xs text-purple-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini AI</p>
                <p className="text-slate-400">AI will automatically detect questions, options, correct answers, and subject sections from your PDF.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Edit Questions */}
          {step === 2 && parsedData && (
            <div className="space-y-5">
              {/* AI Parse Summary */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Questions Found</span>
                  <span className="text-emerald-400 font-bold text-lg">{parsedData.questions.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PDF Pages</span>
                  <span className="text-white font-bold text-lg">{parsedData.totalPages}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Answer Key</span>
                  <span className={`font-bold text-lg ${parsedData.hasAnswerKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {parsedData.hasAnswerKey ? 'Detected' : 'Not Found'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Subject</span>
                  <span className="text-blue-400 font-bold text-lg">{parsedData.suggestedSubject}</span>
                </div>
              </div>

              {!parsedData.hasAnswerKey && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No answer key was found in the PDF. All correct answers are set to Option A by default. Please review and edit the correct answers below.</span>
                </div>
              )}

              {/* Exam Settings */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white">Exam Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Exam Title</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                    <input
                      type="text"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">+ve Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={marksPerQuestion}
                      onChange={(e) => setMarksPerQuestion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">-ve Marks</label>
                    <input
                      type="number"
                      min="0"
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" /> Questions Preview
                </h4>
                
                {parsedData.questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
                    {/* Question Header - Always visible */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/60 transition-colors"
                      onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-slate-300 truncate">
                          {q.questionText.substring(0, 80)}{q.questionText.length > 80 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {q.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          Ans: {String.fromCharCode(65 + q.correctOption)}
                        </span>
                        {expandedQ === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Question Details */}
                    {expandedQ === idx && (
                      <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
                        <div className="text-sm text-white">
                          <MathRenderer text={q.questionText} />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              onClick={() => updateQuestion(idx, 'correctOption', optIdx)}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                optIdx === q.correctOption
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                optIdx === q.correctOption ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <MathRenderer text={opt} />
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] text-slate-500">Click an option to set it as the correct answer</p>

                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
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
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Exam Created Successfully!</h3>
              <p className="text-sm text-slate-400">Redirecting to exam management...</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 3 && (
          <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                onClick={handleParsePdf}
                disabled={!file || parsing}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
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
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
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
    </div>
  );
};

export default PdfUpload;
