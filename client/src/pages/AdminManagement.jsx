import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Users, BookOpen, BarChart2, TrendingUp, CheckCircle, XCircle, Search, Filter, Trash2, Power, UserCheck, KeyRound, Sparkles } from 'lucide-react';

const AdminManagement = () => {
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [search, statusFilter, activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (activeTab === 'teachers') {
        const teachersRes = await api.get(`/admin/teachers?search=${search}&status=${statusFilter}`);
        if (teachersRes.data.success) setTeachers(teachersRes.data.teachers);
      } else {
        const studentsRes = await api.get(`/admin/students?search=${search}&status=${statusFilter}`);
        if (studentsRes.data.success) setStudents(studentsRes.data.students);
      }
    } catch (err) {
      console.error('Failed to load super-admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete account '${name}'?`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-slate-900 border border-purple-500/30 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> System Super Administrator Console
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Super Admin Control Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all Teacher & Student accounts, view site statistics, and control RBAC system access.</p>
        </div>

        <Link
          to="/admin"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <BookOpen className="w-4 h-4 text-blue-400" /> Go to Exam Management
        </Link>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Total Teachers</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.totalTeachers}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.totalStudents}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Total Exams</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalExams}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Total Submissions</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalSubmissions}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">Recent Signups (30d)</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.recentSignups}</p>
          </div>
        </div>
      )}

      {/* Directory Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        
        {/* Directory Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'teachers' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" /> Teachers Directory ({stats?.totalTeachers || 0})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Students Directory ({stats?.totalStudents || 0})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading directory...</div>
        ) : (activeTab === 'teachers' ? teachers.length === 0 : students.length === 0) ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No accounts match your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact (Email / Mobile)</th>
                  <th className="px-4 py-3">{activeTab === 'teachers' ? 'Department' : 'Roll Number'}</th>
                  <th className="px-4 py-3">OTP Verified</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3">Join Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {(activeTab === 'teachers' ? teachers : students).map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="px-4 py-3.5 font-bold text-white">{u.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      <div>{u.email || '-'}</div>
                      <div className="text-[10px] text-slate-500">{u.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{activeTab === 'teachers' ? u.department || 'General' : u.rollNumber || 'N/A'}</td>
                    <td className="px-4 py-3.5">
                      {u.isVerified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          u.isActive
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

export default AdminManagement;
