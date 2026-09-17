import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Users, Trophy, Award, TrendingUp, ShieldAlert, Eye, FileText } from 'lucide-react';

const AdminAnalytics = () => {
  const { isDark } = useTheme();
  const { examId } = useParams();
    const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [examId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/results/exam/${examId}/analytics`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load exam analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Computing Class Performance & Student Analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`max-w-md mx-auto my-20 p-8 border rounded-3xl text-center ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        <p className="text-rose-500 font-semibold">Analytics data not available.</p>
        <Link to="/admin" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow">
          Back to Admin Console
        </Link>
      </div>
    );
  }

  const { exam, stats, results } = data;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#07080b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
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
            <span className="text-xs text-purple-500 font-extrabold uppercase tracking-wider">Class Analytics & Performance</span>
            <h1 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{exam.title}</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className={`border p-5 rounded-3xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-xs text-slate-400 font-medium">Total Submissions</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.totalSubmissions}</p>
          </div>

          <div className={`border p-5 rounded-3xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-xs text-slate-400 font-medium">Class Average Score</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{stats.avgScore} / {exam.totalMarks}</p>
          </div>

          <div className={`border p-5 rounded-3xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-xs text-slate-400 font-medium">Highest Score</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.highestScore}</p>
          </div>

          <div className={`border p-5 rounded-3xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-xs text-slate-400 font-medium">Lowest Score</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">{stats.lowestScore}</p>
          </div>

          <div className={`border p-5 rounded-3xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-xs text-slate-400 font-medium">Pass Rate (≥40%)</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{stats.passRate}%</p>
          </div>
        </div>

        {/* Student Attempt Records Table */}
        <div className={`border rounded-3xl overflow-hidden shadow-xl ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className={`p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Users className="w-5 h-5 text-purple-500" /> Student Submissions & Attempt Log ({results.length})
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No student attempts recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Results will appear here as soon as students complete the exam.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs font-semibold uppercase border-b ${
                  isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Accuracy %</th>
                    <th className="px-6 py-3.5">Tab Warnings</th>
                    <th className="px-6 py-3.5">Submitted At</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                  {results.map((r, rank) => (
                    <tr key={r._id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className={`px-6 py-4 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {rank === 0 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                        {r.studentId?.name || 'Unknown Student'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{r.studentId?.email}</td>
                      <td className="px-6 py-4 font-bold text-emerald-500">
                        {r.score} / {r.totalMarks}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.percentage}%</td>
                      <td className="px-6 py-4">
                        {r.tabSwitchCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            ⚠️ {r.tabSwitchCount} Warnings
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Clean</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(r.submittedAt || r.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/result/${r._id}`}
                          className={`px-3 py-1.5 border rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Attempt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
