import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Users, 
  Sparkles, 
  Search, 
  BookOpen, 
  Lock,
  ChevronRight,
  BrainCircuit,
  Terminal,
  HelpCircle,
  Play,
  Star,
  Layers,
  ArrowUpRight,
  Eye,
  Activity,
  Cpu,
  Check,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user, loginPassword } = useAuth();
    
  const [activeTab, setActiveTab] = useState('all');
  const [demoLoading, setDemoLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(0);

  // Interactive Live Quiz State
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 1-Click Quick Demo Login handler
  const handleQuickDemo = async (roleType) => {
    setDemoLoading(true);
    try {
      if (roleType === 'student') {
        await loginPassword('student@demo.com', 'student123', 'student');
        navigate('/dashboard');
      } else if (roleType === 'teacher') {
        await loginPassword('teacher@demo.com', 'teacher123', 'teacher');
        navigate('/admin');
      } else {
        await loginPassword('admin@demo.com', 'admin123', 'admin');
        navigate('/admin/manage');
      }
    } catch (err) {
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  const sampleExams = [
    {
      id: 1,
      title: "GATE Computer Science & IT Full Mock",
      category: "engineering",
      duration: "180 Mins",
      questions: 65,
      participants: "14,820",
      tag: "Featured Stream",
      level: "Advanced",
      rating: "4.9"
    },
    {
      id: 2,
      title: "JEE Advanced Mathematics & Physics Practice",
      category: "science",
      duration: "120 Mins",
      questions: 45,
      participants: "21,400",
      tag: "High Yield",
      level: "Hard",
      rating: "4.95"
    },
    {
      id: 3,
      title: "Full Stack React & Node.js System Architecture",
      category: "coding",
      duration: "90 Mins",
      questions: 35,
      participants: "9,650",
      tag: "Proctored",
      level: "Intermediate",
      rating: "4.92"
    },
    {
      id: 4,
      title: "UPSC Civil Services General Aptitude Paper",
      category: "govt",
      duration: "120 Mins",
      questions: 100,
      participants: "31,200",
      tag: "Top Rated",
      level: "National Level",
      rating: "4.97"
    }
  ];

  const featureTabs = [
    {
      id: 0,
      title: "Real-Time AI Proctoring & Tab Guard",
      subtitle: "Zero-compromise examination integrity with browser locks and tab-switching warnings.",
      icon: ShieldCheck,
      stat: "100% Anti-Cheat Record",
      badge: "Security Core",
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: 1,
      title: "Native KaTeX & Scientific LaTeX Renderer",
      subtitle: "Render complex differential equations, organic chemistry formulas, and mathematical notation flawlessly.",
      icon: BrainCircuit,
      stat: "Sub-millisecond Render",
      badge: "Academic Engine",
      color: "from-purple-500 to-pink-600"
    },
    {
      id: 2,
      title: "PDF Exam Booklet & Print Generator",
      subtitle: "One-click export of print-ready exam question booklets and formatted master answer keys.",
      icon: FileText,
      stat: "Vector Crisp Print",
      badge: "Offline Ready",
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: 3,
      title: "Instant Diagnostic Analytics & Scorecards",
      subtitle: "Deep percentile ranking, topic accuracy breakdowns, and detailed answer explanations.",
      icon: BarChart3,
      stat: "Real-Time Scoring",
      badge: "Analytics Suite",
      color: "from-amber-500 to-orange-600"
    }
  ];

  const filteredExams = sampleExams.filter(exam => {
    return activeTab === 'all' || exam.category === activeTab;
  });

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#07080b] text-slate-100 selection:bg-blue-600 selection:text-white' 
        : 'bg-slate-50 text-slate-800 selection:bg-indigo-600 selection:text-white'
    }`}>
      
      {/* Background Lighting Gradients */}
      {isDark ? (
        <>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none -z-10 rounded-full" />
          <div className="fixed top-[40%] right-[-200px] w-[600px] h-[600px] bg-purple-600/10 blur-[160px] pointer-events-none -z-10 rounded-full" />
        </>
      ) : (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-[120px] pointer-events-none -z-10 rounded-full" />
      )}

      {/* 1. FLOATING NAVBAR WITH THEME TOGGLE (Only rendered when not logged in to prevent duplicate header) */}
      {!user && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl">
          <header className={`backdrop-blur-2xl border rounded-full px-6 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.15)] flex items-center justify-between transition-all duration-300 ${
            isDark 
              ? 'bg-slate-900/70 border-white/10 text-white' 
              : 'bg-white/80 border-slate-200/80 text-slate-900'
          }`}>
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className={`font-extrabold text-lg tracking-tight flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Prep<span className="text-indigo-600 font-black">Pulse</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className={`hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide uppercase ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
              <a href="#catalog" className="hover:text-indigo-600 transition-colors">Catalog</a>
              <a href="#quiz-preview" className="hover:text-indigo-600 transition-colors">Live Demo</a>
            </nav>

            {/* Action CTAs + Theme Switcher Button */}
            <div className="flex items-center gap-3">
              
              {/* Dark/Light Mode Toggle Switch Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <Link
                to="/login"
                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg transform hover:scale-[1.02] ${
                  isDark
                    ? 'text-slate-900 bg-white hover:bg-slate-100'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                Sign In <ArrowUpRight className="w-4 h-4" />
              </Link>

            </div>

          </header>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="pt-36 pb-20 md:pt-48 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          
          {/* Top Pill Badge */}
          <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-bold shadow-xl backdrop-blur-xl ${
            isDark 
              ? 'bg-slate-900/80 border-white/10 text-slate-300' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
          }`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Next-Gen Evaluation Portal 2026</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">Trusted by 350+ Institutions</span>
          </div>

          {/* Editorial Headline */}
          <h1 className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Intelligent Testing. <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic font-serif font-normal pr-2">
              Powered by AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            A luxury-tier assessment platform engineered for anti-cheat proctoring, KaTeX math formatting, instant auto-grading, and printable exam booklet export.
          </p>

          {/* Rating Stack */}
          <div className="flex flex-wrap items-center justify-center gap-6 py-2">
            <div className={`flex items-center gap-3 border rounded-full px-4 py-2 backdrop-blur-md ${
              isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">MS</div>
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className={`font-extrabold ml-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4.98 / 5</span>
                </div>
                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Over 150,000+ tests submitted</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="px-8 py-4 rounded-full text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all duration-300 flex items-center gap-2.5 transform hover:scale-[1.02]"
            >
              Enter Exam Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* HERO SHOWCASE CARD */}
        <div className={`mt-16 relative mx-auto max-w-5xl rounded-[2.5rem] border p-6 md:p-8 backdrop-blur-3xl shadow-2xl ${
          isDark 
            ? 'bg-slate-900/60 border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)]' 
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          
          {/* Card Header Bar */}
          <div className={`flex items-center justify-between pb-6 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className={`text-xs font-mono ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>preppulse.app/exam-engine</span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-500">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Proctoring Guard
            </div>
          </div>

          {/* Mock Dashboard Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Active Candidate</span>
                <span className="text-indigo-600 font-bold">ID #88204</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>GATE Computer Science Mock</p>
              <div className={`pt-2 flex items-center justify-between text-xs font-mono border-t mt-3 ${
                isDark ? 'text-slate-400 border-white/5' : 'text-slate-500 border-slate-200'
              }`}>
                <span>Timer: 01:45:20</span>
                <span className="text-emerald-500 font-bold">0 Warnings</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Auto-Evaluation</span>
                <span className="text-purple-600 font-bold">Instant</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Score: 94 / 100 (99.4%)</p>
              <div className={`pt-2 flex items-center justify-between text-xs font-mono border-t mt-3 ${
                isDark ? 'text-slate-400 border-white/5' : 'text-slate-500 border-slate-200'
              }`}>
                <span>Accuracy: 95.8%</span>
                <span className="text-purple-600 font-bold">Passed</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Export Capabilities</span>
                <span className="text-amber-500 font-bold">Vector PDF</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Printable Booklet & Keys</p>
              <div className={`pt-2 flex items-center justify-between text-xs font-mono border-t mt-3 ${
                isDark ? 'text-slate-400 border-white/5' : 'text-slate-500 border-slate-200'
              }`}>
                <span>KaTeX Math Ready</span>
                <span className="text-amber-500 font-bold">1-Click PDF</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CORE FEATURES EXPLORER */}
      <section id="features" className={`py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t ${
        isDark ? 'border-white/5' : 'border-slate-200'
      }`}>
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100">
            Core Engine Capabilities
          </span>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Designed for Academic Rigor
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Vertical Tab Selectors */}
          <div className="lg:col-span-5 space-y-3">
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedFeature === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFeature(tab.id)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 flex items-start gap-4 ${
                    isSelected
                      ? isDark 
                        ? 'bg-slate-900 border-indigo-500/50 shadow-lg scale-[1.01]' 
                        : 'bg-white border-indigo-500 shadow-md scale-[1.01]'
                      : isDark
                        ? 'bg-slate-950/50 border-white/5 hover:border-white/10 text-slate-400'
                        : 'bg-slate-100/60 border-slate-200/80 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tab.color} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tab.title}</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tab.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Dynamic Preview Box */}
          <div className={`lg:col-span-7 p-8 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl relative overflow-hidden min-h-[380px] flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
          }`}>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">PREPPULSE MODULE v2.4</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                  {featureTabs[selectedFeature].stat}
                </span>
              </div>

              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {featureTabs[selectedFeature].title}
              </h3>

              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {featureTabs[selectedFeature].subtitle}
              </p>
            </div>

            <div className={`pt-6 border-t flex items-center justify-between relative z-10 text-xs ${
              isDark ? 'border-white/10' : 'border-slate-100'
            }`}>
              <span className="text-slate-500 font-medium">Ready to deploy in your institution</span>
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Explore Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className={`border-t py-12 text-xs relative overflow-hidden ${
        isDark ? 'bg-slate-950 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>PrepPulse</span>
          </div>
          <p>© {new Date().getFullYear()} PrepPulse Assessment Systems Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
