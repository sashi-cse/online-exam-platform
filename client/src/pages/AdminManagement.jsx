import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { Shield, Users, BookOpen, BarChart2, TrendingUp, Search, Trash2, Power, UserCheck, KeyRound, Sparkles, FileText, CheckCircle2, Eye, X } from 'lucide-react';

const AdminManagement = () => {
  const { isDark } = useTheme();
    const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers', 'students', 'exams'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalDetails, setUserModalDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      } else if (activeTab === 'students') {
        const studentsRes = await api.get(`/admin/students?search=${search}&status=${statusFilter}`);
        if (studentsRes.data.success) setStudents(studentsRes.data.students);
      } else if (activeTab === 'exams') {
        const examsRes = await api.get('/admin/exams');
        if (examsRes.data.success) setExams(examsRes.data.exams);
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

  const openUserDetailModal = async (user, type) => {
    setSelectedUser({ ...user, type });
    setModalLoading(true);
    try {
      if (type === 'teacher') {
        const res = await api.get(`/admin/teachers/${user._id}`);
        if (res.data.success) setUserModalDetails(res.data);
      } else {
        const res = await api.get(`/admin/students/${user._id}`);
        if (res.data.success) setUserModalDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#07080b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Banner */}
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl transition-all ${
          isDark
            ? 'bg-gradient-to-r from-purple-900/60 via-slate-900 to-slate-900 border-purple-500/30 text-white'
            : 'bg-gradient-to-r from-purple-50 via-white to-white border-purple-200 text-slate-900 shadow-md'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
              isDark ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-700'
            }`}>
              <Sparkles className="w-3.5 h-3.5" /> Super Admin Control Center
            </div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Super Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Full system overview: manage teachers, students, exam codes, and platform analytics.</p>
          </div>

          <Link
            to="/admin"
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" /> Go to Exam Builder
          </Link>
        </div>

        {/* Overview Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`border p-5 rounded-3xl shadow-lg transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Teachers</p>
              <p className="text-3xl font-extrabold text-amber-500 mt-1">{stats.totalTeachers}</p>
            </div>

            <div className={`border p-5 rounded-3xl shadow-lg transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-extrabold text-blue-500 mt-1">{stats.totalStudents}</p>
            </div>

            <div className={`border p-5 rounded-3xl shadow-lg transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Exams</p>
              <p className="text-3xl font-extrabold text-purple-500 mt-1">{stats.totalExams}</p>
            </div>

            <div className={`border p-5 rounded-3xl shadow-lg transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Submissions</p>
              <p className="text-3xl font-extrabold text-emerald-500 mt-1">{stats.totalSubmissions}</p>
            </div>
          </div>
        )}

        {/* Main Directory Table */}
        <div className={`border rounded-3xl overflow-hidden shadow-xl space-y-4 p-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          
          {/* Navigation Tabs & Search Bar */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            
            <div className={`flex items-center gap-2 p-1.5 rounded-2xl border text-xs ${
              isDark ? 'bg-slate-955 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'teachers' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" /> All Teachers ({stats?.totalTeachers || 0})
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'students' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" /> All Students ({stats?.totalStudents || 0})
              </button>

              <button
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'exams' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" /> All Exams ({stats?.totalExams || 0})
              </button>
            </div>

            {/* Search & Filter */}
            {activeTab !== 'exams' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className={`pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 w-56 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            )}

          </div>

          {/* TEACHERS TABLE */}
          {activeTab === 'teachers' && (
            loading ? (
              <div className="p-8 text-center text-slate-400">Loading teachers directory...</div>
            ) : teachers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No teachers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs font-semibold uppercase border-b ${
                    isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">Teacher Name</th>
                      <th className="px-4 py-3">Contact (Email / Mobile)</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Exams Created</th>
                      <th className="px-4 py-3">OTP Verified</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    {teachers.map((t) => (
                      <tr key={t._id} className={`transition-colors text-xs ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</td>
                        <td className="px-4 py-3.5 font-mono">
                          <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.email || '-'}</div>
                          <div className="text-[10px] text-slate-400">{t.phone || t.mobileNumber || '-'}</div>
                        </td>
                        <td className="px-4 py-3.5">{t.department || 'General'}</td>
                        <td className="px-4 py-3.5 font-bold text-amber-500">{t.examCount || 0} exams</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {t.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {t.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => openUserDetailModal(t, 'teacher')}
                            className={`p-1.5 border rounded-lg transition-colors ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-300'
                            }`}
                            title="View Teacher Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(t._id)}
                            className={`p-1.5 rounded-lg border transition-colors ${t.isActive ? (isDark ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-slate-100 text-amber-600 border-slate-300') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}
                            title={t.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(t._id, t.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg transition-colors"
                            title="Delete Teacher Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* STUDENTS TABLE */}
          {activeTab === 'students' && (
            loading ? (
              <div className="p-8 text-center text-slate-400">Loading students directory...</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No students found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs font-semibold uppercase border-b ${
                    isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Contact (Email / Mobile)</th>
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Exams Attempted</th>
                      <th className="px-4 py-3">Average Score</th>
                      <th className="px-4 py-3">OTP Verified</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    {students.map((s) => (
                      <tr key={s._id} className={`transition-colors text-xs ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.name}</td>
                        <td className="px-4 py-3.5 font-mono">
                          <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{s.email || '-'}</div>
                          <div className="text-[10px] text-slate-400">{s.phone || s.mobileNumber || '-'}</div>
                        </td>
                        <td className="px-4 py-3.5">{s.rollNumber || 'N/A'}</td>
                        <td className="px-4 py-3.5 font-bold text-blue-500">{s.attemptsCount || 0} attempts</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-500">{s.avgScore || 0} pts</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {s.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {s.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => openUserDetailModal(s, 'student')}
                            className={`p-1.5 border rounded-lg transition-colors ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-300'
                            }`}
                            title="View Student Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s._id)}
                            className={`p-1.5 rounded-lg border transition-colors ${s.isActive ? (isDark ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-slate-100 text-amber-600 border-slate-300') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}
                            title={s.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(s._id, s.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg transition-colors"
                            title="Delete Student Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* EXAMS TABLE */}
          {activeTab === 'exams' && (
            loading ? (
              <div className="p-8 text-center text-slate-400">Loading exams directory...</div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No exams created yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs font-semibold uppercase border-b ${
                    isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">Exam Title</th>
                      <th className="px-4 py-3">Exam Code</th>
                      <th className="px-4 py-3">Teacher Owner</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Attempts</th>
                      <th className="px-4 py-3">Avg Score</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    {exams.map((e) => (
                      <tr key={e._id} className={`transition-colors text-xs ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{e.title}</td>
                        <td className="px-4 py-3.5 font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-max">
                          {e.bookletCode || 'N/A'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{e.createdBy?.name || 'System Admin'}</div>
                          <div className="text-[10px] text-slate-400">{e.createdBy?.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3.5">{e.questionCount || 0} Qs</td>
                        <td className="px-4 py-3.5 font-bold text-blue-500">{e.totalAttempts || 0}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-500">{e.avgScore || 0} pts</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.isPublished ? 'bg-emerald-500/10 text-emerald-500' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                            {e.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Link
                            to={`/admin/exam/${e._id}/analytics`}
                            className={`p-1.5 border rounded-lg inline-flex items-center gap-1 transition-colors ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-purple-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-purple-600 border-slate-300'
                            }`}
                            title="View Exam Analytics"
                          >
                            <BarChart2 className="w-3.5 h-3.5" /> Analytics
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

        </div>

        {/* USER DETAIL MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl transition-colors duration-300 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">{selectedUser.type} Profile Details</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalLoading ? (
                <div className="py-8 text-center text-slate-400">Loading profile data...</div>
              ) : userModalDetails ? (
                <div className="space-y-4 text-xs">
                  <div className={`grid grid-cols-2 gap-4 p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-955 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Email Address</span>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userModalDetails.teacher?.email || userModalDetails.student?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Mobile Number</span>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userModalDetails.teacher?.phone || userModalDetails.student?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedUser.type === 'teacher' && userModalDetails.exams && (
                    <div>
                      <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Exams Created ({userModalDetails.exams.length})</h4>
                      {userModalDetails.exams.length === 0 ? (
                        <p className="text-slate-400">No exams created yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userModalDetails.exams.map((ex) => (
                            <div key={ex._id} className={`p-3 rounded-xl border flex items-center justify-between ${
                              isDark ? 'bg-slate-955 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ex.title}</p>
                                <p className="text-[10px] text-amber-500 font-mono">Code: {ex.bookletCode}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] ${ex.isPublished ? 'bg-emerald-500/10 text-emerald-500 font-bold' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                {ex.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedUser.type === 'student' && userModalDetails.results && (
                    <div>
                      <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Attempted Exams ({userModalDetails.results.length})</h4>
                      {userModalDetails.results.length === 0 ? (
                        <p className="text-slate-400">No exam attempts yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userModalDetails.results.map((r) => (
                            <div key={r._id} className={`p-3 rounded-xl border flex items-center justify-between ${
                              isDark ? 'bg-slate-955 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.examId?.title || 'Exam'}</p>
                                <p className="text-[10px] text-slate-400">Submitted: {new Date(r.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-500 text-sm">{r.score} / {r.totalMarks}</span>
                                <p className="text-[10px] text-slate-400">{r.percentage}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminManagement;
