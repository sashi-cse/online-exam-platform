import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { Clock, ShieldAlert, CheckCircle, Flag, ChevronLeft, ChevronRight, Maximize2, Send, AlertTriangle } from 'lucide-react';

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [resultId, setResultId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: { selectedOption, isMarkedForReview } }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [hasStartedFullscreen, setHasStartedFullscreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  // 1. Initialize or Resume Attempt
  useEffect(() => {
    startOrResumeAttempt();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [examId]);

  const startOrResumeAttempt = async () => {
    try {
      setLoading(true);
      const [examRes, questionsRes, startRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/questions/exam/${examId}?mode=take`),
        api.post(`/results/start/${examId}`),
      ]);

      if (startRes.data.alreadySubmitted) {
        navigate(`/result/${startRes.data.resultId}`);
        return;
      }

      setExam(examRes.data.exam);
      setQuestions(questionsRes.data.questions);

      const result = startRes.data.result;
      setResultId(result._id);
      setTabSwitchCount(result.tabSwitchCount || 0);

      // Hydrate answers map
      const initialAnswersMap = {};
      result.answers.forEach((ans) => {
        initialAnswersMap[ans.questionId] = {
          selectedOption: ans.selectedOption,
          isMarkedForReview: ans.isMarkedForReview || false,
        };
      });
      setUserAnswers(initialAnswersMap);

      // Calculate remaining time based on startTime & duration
      const startTimeMs = new Date(result.startTime).getTime();
      const totalDurationMs = examRes.data.exam.durationMinutes * 60 * 1000;
      const elapsedMs = Date.now() - startTimeMs;
      const remainingMs = Math.max(0, totalDurationMs - elapsedMs);

      setTimeLeftSeconds(Math.floor(remainingMs / 1000));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initialize exam session');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (timeLeftSeconds <= 0 || !resultId) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeftSeconds, resultId]);

  // 3. Tab Visibility & Blur Proctored Monitoring
  useEffect(() => {
    if (!resultId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logTabSwitchViolation('Tab Switched / Window Minimized');
      }
    };

    const handleBlur = () => {
      // Small delay to prevent false trigger on click
      setTimeout(() => {
        if (document.hidden) {
          logTabSwitchViolation('Window Lost Focus');
        }
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [resultId, userAnswers]);

  const logTabSwitchViolation = (reason) => {
    setTabSwitchCount((prev) => {
      const updatedCount = prev + 1;
      setWarningMessage(`Warning #${updatedCount}: ${reason}. Avoid switching tabs during the exam!`);
      setShowWarningModal(true);

      // Save violation immediately to server
      api.post(`/results/save-progress/${resultId}`, {
        answers: prepareAnswersPayload(),
        tabSwitchCount: updatedCount,
        violation: {
          type: 'tab_switch',
          details: reason,
        },
      }).catch(console.error);

      return updatedCount;
    });
  };

  // 4. Periodic Auto-Save every 15 seconds
  useEffect(() => {
    if (!resultId) return;

    autoSaveRef.current = setInterval(() => {
      api.post(`/results/save-progress/${resultId}`, {
        answers: prepareAnswersPayload(),
        tabSwitchCount,
      }).catch((err) => console.error('Auto-save error:', err));
    }, 15000);

    return () => clearInterval(autoSaveRef.current);
  }, [resultId, userAnswers, tabSwitchCount]);

  const prepareAnswersPayload = () => {
    return questions.map((q) => {
      const state = userAnswers[q._id] || {};
      return {
        questionId: q._id,
        selectedOption: state.selectedOption !== undefined ? state.selectedOption : null,
        isMarkedForReview: Boolean(state.isMarkedForReview),
      };
    });
  };

  const handleSelectOption = (optIndex) => {
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: optIndex,
      },
    }));
  };

  const handleClearOption = () => {
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: null,
      },
    }));
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        isMarkedForReview: !prev[currentQ._id]?.isMarkedForReview,
      },
    }));
  };

  const handleAutoSubmitOnTimeout = async () => {
    alert('⏱️ Time has expired! Your exam answers are being automatically submitted for evaluation.');
    submitExam(true);
  };

  const submitExam = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/results/submit/${resultId}`, {
        answers: prepareAnswersPayload(),
        tabSwitchCount,
        isAutoSubmit: isAuto,
      });

      if (res.data.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        navigate(`/result/${resultId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setHasStartedFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen request denied:', err);
        setHasStartedFullscreen(true);
      });
    } else {
      setHasStartedFullscreen(true);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading Exam Session & Security Rules...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentState = userAnswers[currentQ?._id] || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      
      {/* Fullscreen Prompt Overlay */}
      {!hasStartedFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
              <Maximize2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Enter Distraction-Free Exam Mode</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To ensure test integrity, please enter full-screen mode. Do not switch tabs or exit during the test duration.
            </p>

            <button
              onClick={enterFullscreen}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              Start Exam Full Screen
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="font-extrabold text-base text-white">{exam?.title}</h1>
          <p className="text-xs text-slate-400 font-mono">Code: {exam?.bookletCode}</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Tab Switch warning count */}
          {tabSwitchCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>{tabSwitchCount} Tab Switch Warning{tabSwitchCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Fixed Countdown Timer */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-base ${
            timeLeftSeconds < 300
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-emerald-400'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to submit your exam now? Answers will be evaluated immediately.')) {
                submitExam(false);
              }
            }}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 overflow-hidden">
        
        {/* Question Canvas (Left 3 cols) */}
        <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6 max-w-4xl">
            
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold text-sm border border-blue-500/30">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {currentQ?.subject}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Marks: <strong className="text-emerald-400">+{currentQ?.marksForCorrect || 4}</strong> / <strong className="text-rose-400">-{currentQ?.negativeMarksForIncorrect || 1}</strong>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-lg font-medium text-white leading-relaxed p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <MathRenderer text={currentQ?.questionText} />
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ?.options.map((opt, idx) => {
                const isSelected = currentState.selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold ring-1 ring-blue-500'
                        : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="text-sm">
                      <MathRenderer text={opt} />
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Sticky Action Bar Footer (Always visible on screen 1 without scrolling) */}
          <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md mt-6 pt-4 pb-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReview}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  currentState.isMarkedForReview
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                    : 'bg-slate-900 text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {currentState.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <button
                onClick={handleClearOption}
                disabled={currentState.selectedOption === null}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold border border-slate-800 transition-colors disabled:opacity-40"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-40 transition-all hover:scale-105"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Question Palette Sidebar (Right 1 col) */}
        <div className="bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Question Paper Palette</h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-600"></span> Marked Review
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-700"></span> Unattempted
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded ring-2 ring-blue-500 bg-slate-900"></span> Current
              </div>
            </div>

            {/* Palette Grid */}
            <div className="pt-3 border-t border-slate-800">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const state = userAnswers[q._id] || {};
                  const isCurrent = idx === currentIndex;
                  const isAnswered = state.selectedOption !== null && state.selectedOption !== undefined;
                  const isReview = state.isMarkedForReview;

                  let bgColor = 'bg-slate-800 text-slate-300 hover:bg-slate-700';
                  if (isReview) {
                    bgColor = 'bg-purple-600 text-white';
                  } else if (isAnswered) {
                    bgColor = 'bg-emerald-600 text-white';
                  }

                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${bgColor} ${
                        isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                if (window.confirm('Ready to submit your exam paper?')) {
                  submitExam(false);
                }
              }}
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20"
            >
              Submit Test Paper
            </button>
          </div>
        </div>

      </div>

      {/* Tab Switch Warning Modal Toast */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-amber-400">Proctor Security Alert</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{warningMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamTaking;
