import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { Award, CheckCircle2, XCircle, HelpCircle, ShieldAlert, ArrowLeft, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const ExamResult = () => {
  const { resultId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/results/${resultId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load attempt result:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Fetching Exam Result & Worked Solutions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <p className="text-rose-400 font-semibold">Result record not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { result, breakdown } = data;
  const isPass = result.percentage >= 40;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Exam Evaluation Report</span>
          <h1 className="text-2xl font-extrabold text-white">{result.examId?.title}</h1>
        </div>
      </div>

      {/* Main Score Card Banner */}
      <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isPass
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/30'
          : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-rose-500/30'
      }`}>
        
        <div className="space-y-3 max-w-lg text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700">
            {isPass ? (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Passed Assessment</span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Needs Improvement</span>
            )}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Final Score: {result.score} / {result.totalMarks}
          </h2>
          <p className="text-sm text-slate-300">
            Submitted on {new Date(result.submittedAt || result.updatedAt).toLocaleString()} ({result.status})
          </p>
        </div>

        {/* Score Ring / Percentage Badge */}
        <div className="flex flex-col items-center justify-center w-36 h-36 rounded-full bg-slate-950/80 border-4 border-blue-500/40 shadow-inner shrink-0">
          <span className="text-3xl font-black text-white">{result.percentage}%</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Accuracy</span>
        </div>

      </div>

      {/* Stats Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Correct Answers</p>
            <p className="text-xl font-bold text-emerald-400">{result.counts.correct}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Incorrect Answers</p>
            <p className="text-xl font-bold text-rose-400">{result.counts.incorrect}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Unattempted</p>
            <p className="text-xl font-bold text-slate-300">{result.counts.unattempted}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Tab Switch Logs</p>
            <p className="text-xl font-bold text-amber-400">{result.tabSwitchCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Tab Switch Proctored Violation Logs */}
      {result.violationLogs && result.violationLogs.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-2">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Security Violation Logs ({result.violationLogs.length})
          </h3>
          <div className="space-y-1 text-xs text-slate-300">
            {result.violationLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span>⚠️ {log.details}</span>
                <span className="font-mono text-slate-500 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Per-Question Breakdown & Step-by-Step KaTeX Solutions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> Question-by-Question Solution Breakdown
        </h3>

        <div className="space-y-4">
          {breakdown.map((item, idx) => {
            const isUnattempted = item.studentSelectedOption === null || item.studentSelectedOption === undefined;
            const isCorrect = item.isCorrect;
            const isExpanded = expandedQuestion === item.questionId || true; // Show solutions by default

            return (
              <div
                key={item.questionId}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-4 transition-all ${
                  isUnattempted
                    ? 'border-slate-800'
                    : isCorrect
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center">
                      Q{item.questionNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {item.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      isUnattempted
                        ? 'bg-slate-800 text-slate-400'
                        : isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isUnattempted ? 'Unattempted (0 Marks)' : isCorrect ? `Correct (+${item.marksEarned})` : `Incorrect (${item.marksEarned})`}
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-white text-base font-medium pl-3 border-l-2 border-blue-500">
                  <MathRenderer text={item.questionText} />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                  {item.options.map((opt, optIdx) => {
                    const isStudentChoice = item.studentSelectedOption === optIdx;
                    const isRightOption = item.correctOption === optIdx;

                    let optionStyle = 'bg-slate-800/40 border-slate-800 text-slate-400';
                    if (isRightOption) {
                      optionStyle = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold';
                    } else if (isStudentChoice && !isRightOption) {
                      optionStyle = 'bg-rose-500/10 border-rose-500/50 text-rose-300 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${optionStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isRightOption
                            ? 'bg-emerald-500 text-slate-950'
                            : isStudentChoice
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <MathRenderer text={opt} />

                        {isRightOption && (
                          <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                            Correct Answer
                          </span>
                        )}
                        {isStudentChoice && !isRightOption && (
                          <span className="ml-auto text-[10px] uppercase font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Worked Solution Block */}
                {item.solution && (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      💡 Step-by-Step Worked Solution:
                    </span>
                    <div className="text-slate-300 leading-relaxed">
                      <MathRenderer text={item.solution} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ExamResult;
