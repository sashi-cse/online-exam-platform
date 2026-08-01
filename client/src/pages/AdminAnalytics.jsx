import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Users, Trophy, Award, TrendingUp, ShieldAlert, Eye, FileText } from 'lucide-react';

const AdminAnalytics = () => {
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
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Computing Class Performance & Student Analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <p className="text-rose-400 font-semibold">Analytics data not available.</p>
        <Link to="/admin" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
          Back to Admin Console
        </Link>
      </div>
    );
  }

  const { exam, stats, results } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Class Analytics & Performance</span>
          <h1 className="text-2xl font-extrabold text-white">{exam.title}</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Total Submissions</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalSubmissions}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Class Average Score</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.avgScore} / {exam.totalMarks}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Highest Score</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.highestScore}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Lowest Score</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.lowestScore}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Pass Rate (≥40%)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.passRate}%</p>
        </div>
      </div>

      {/* Student Attempt Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Student Submissions & Attempt Log ({results.length})
          </h2>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No student attempts recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Results will appear here as soon as students complete the exam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700">
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
              <tbody className="divide-y divide-slate-800/80">
                {results.map((r, rank) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      {rank === 0 && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
                      {r.studentId?.name || 'Unknown Student'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{r.studentId?.email}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{r.percentage}%</td>
                    <td className="px-6 py-4">
                      {r.tabSwitchCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠️ {r.tabSwitchCount} Warnings
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium">Clean</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(r.submittedAt || r.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/result/${r._id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
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
  );
};

export default AdminAnalytics;
