import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import { Printer, ArrowLeft, CheckCircle2, FileText, Sparkles, Layers } from 'lucide-react';

const BookletPreview = () => {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportMode, setExportMode] = useState('full'); // 'full', 'answer_key', 'solutions'

  useEffect(() => {
    fetchBookletData();
  }, [examId]);

  const fetchBookletData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/booklet/exam/${examId}`);
      if (res.data.success) {
        setData(res.data.booklet);
      }
    } catch (err) {
      console.error('Failed to load booklet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Generating NEET Test Booklet & Layout...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <p className="text-rose-400 font-semibold">Booklet data not available.</p>
        <Link to="/admin" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
          Back to Admin Console
        </Link>
      </div>
    );
  }

  const { exam, subjects, allQuestions, answerKey } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-16">
      
      {/* Top Floating Controls Bar (Hidden during Print) */}
      <div className="no-print bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/exam/${examId}`}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">NEET/JEE Printable Booklet Engine</span>
            <h1 className="text-lg font-bold text-white">{exam.title}</h1>
          </div>
        </div>

        {/* Export Mode Toggles */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setExportMode('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              exportMode === 'full' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Full Test Booklet
          </button>
          <button
            onClick={() => setExportMode('answer_key')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              exportMode === 'answer_key' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Answer Key Only
          </button>
          <button
            onClick={() => setExportMode('solutions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              exportMode === 'solutions' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Hints & Solutions
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-4xl mx-auto my-8 bg-white p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-200 booklet-container text-black">
        
        {/* SECTION 1: FULL TEST BOOKLET */}
        {(exportMode === 'full') && (
          <div>
            {/* 1. Cover Page */}
            <div className="border-4 border-black p-6 rounded-lg space-y-6 text-center mb-10 print-avoid-break">
              
              <div className="border-b-2 border-black pb-4 flex items-center justify-between">
                <div className="text-left">
                  <span className="font-mono text-xs uppercase font-bold tracking-widest block text-gray-600">Entrance Examination Paper</span>
                  <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black">{exam.title}</h1>
                </div>

                {/* Boxed Test Code */}
                <div className="border-2 border-black px-4 py-2 text-center bg-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Booklet Code</span>
                  <span className="text-xl font-black font-mono tracking-widest">{exam.bookletCode}</span>
                </div>
              </div>

              {/* Details Metadata bar */}
              <div className="grid grid-cols-3 gap-2 border-b-2 border-black pb-4 text-xs font-bold text-gray-800">
                <div>Duration: {exam.durationMinutes} Minutes</div>
                <div>Total Questions: {allQuestions.length}</div>
                <div>Total Marks: {exam.totalMarks} Marks</div>
              </div>

              {/* Candidate Info Input Box */}
              <div className="border border-black p-3 text-left space-y-2 bg-gray-50 text-xs">
                <div className="flex justify-between">
                  <span>Candidate Name: _________________________________________________</span>
                  <span>Roll No: _______________</span>
                </div>
                <div className="flex justify-between">
                  <span>Examination Centre: _______________________________________________</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Numbered Important Instructions */}
              <div className="text-left space-y-2">
                <h3 className="font-extrabold text-sm uppercase underline">IMPORTANT INSTRUCTIONS FOR CANDIDATES:</h3>
                <ol className="list-decimal pl-5 text-xs space-y-1.5 font-medium text-gray-900">
                  {exam.instructions && exam.instructions.length > 0 ? (
                    exam.instructions.map((inst, i) => <li key={i}>{inst}</li>)
                  ) : (
                    <>
                      <li>This test booklet consists of continuous numbered questions across subjects.</li>
                      <li>Each correct answer carries +4 marks. Each wrong response incurs -1 negative mark.</li>
                      <li>Use black/blue ballpoint pen to fill bubbles on the separate OMR answer sheet.</li>
                      <li>Rough work must be done only on the blank space provided at the end of this booklet.</li>
                    </>
                  )}
                </ol>
              </div>

            </div>

            <div className="print-page-break"></div>

            {/* 2. Question Paper Pages (Two-column layout) */}
            <div className="booklet-columns space-y-6 pt-4">
              {subjects.map((subj) => (
                <div key={subj.name} className="space-y-4 print-avoid-break">
                  
                  {/* Subject Header */}
                  <div className="border-y-2 border-black py-1 my-3 text-center bg-gray-100 font-extrabold text-xs uppercase tracking-wider">
                    --- SECTION: {subj.name} ---
                  </div>

                  {subj.questions.map((q) => (
                    <div key={q._id} className="mb-5 text-xs space-y-1.5 break-inside-avoid print-avoid-break border-b border-gray-200 pb-3">
                      <div className="font-bold flex items-start gap-1">
                        <span className="font-mono">Q{q.questionNumber}.</span>
                        <div className="flex-1">
                          <MathRenderer text={q.questionText} />
                        </div>
                      </div>

                      {/* 4 Lettered Options */}
                      <div className="pl-4 grid grid-cols-1 gap-1 pt-1 font-medium">
                        {q.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-bold font-mono">({String.fromCharCode(65 + idx)})</span>
                            <MathRenderer text={opt} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                </div>
              ))}
            </div>

            <div className="print-page-break"></div>
          </div>
        )}

        {/* SECTION 2: ANSWER KEY GRID */}
        {(exportMode === 'full' || exportMode === 'answer_key') && (
          <div className="pt-6 print-avoid-break">
            <div className="border-2 border-black p-4 mb-6 text-center bg-gray-50">
              <h2 className="text-lg font-black uppercase tracking-wide">ANSWER KEY — {exam.bookletCode}</h2>
              <p className="text-xs font-semibold text-gray-700">{exam.title}</p>
            </div>

            {/* 4 Column Compact Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs border border-black p-3">
              {answerKey.map((item) => (
                <div key={item.questionNumber} className="flex items-center justify-between p-1.5 border border-gray-300 font-mono">
                  <span className="font-bold">Q{item.questionNumber}:</span>
                  <span className="font-extrabold text-sm px-2 py-0.5 bg-black text-white rounded">
                    ({String.fromCharCode(65 + item.correctOption)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: HINTS & STEP-BY-STEP SOLUTIONS */}
        {(exportMode === 'full' || exportMode === 'solutions') && (
          <div className="pt-8 space-y-4 print-avoid-break">
            <div className="border-2 border-black p-4 text-center bg-gray-100 mb-4">
              <h2 className="text-lg font-black uppercase tracking-wide">HINTS & WORKED SOLUTIONS</h2>
              <p className="text-xs font-semibold text-gray-700">{exam.title} ({exam.bookletCode})</p>
            </div>

            <div className="space-y-4 text-xs">
              {allQuestions.map((q) => (
                <div key={q._id} className="border border-gray-300 p-3 rounded space-y-1.5 print-avoid-break bg-gray-50/50">
                  <div className="font-bold flex items-center justify-between border-b border-gray-200 pb-1">
                    <span>Q{q.questionNumber}. [{q.subject}] Correct Option: ({String.fromCharCode(65 + q.correctOption)})</span>
                    <span>+{q.marksForCorrect} / -{q.negativeMarksForIncorrect} Marks</span>
                  </div>

                  <div className="text-gray-800">
                    <span className="font-bold">Question: </span>
                    <MathRenderer text={q.questionText} />
                  </div>

                  {q.solution ? (
                    <div className="pt-1 text-gray-900 font-medium bg-white p-2 border border-gray-200 rounded">
                      <span className="font-bold text-black block mb-0.5">Solution:</span>
                      <MathRenderer text={q.solution} />
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No solution explanation logged for this question.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookletPreview;
