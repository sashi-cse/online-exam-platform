import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Users, BookOpen, BarChart2, TrendingUp, Search, Trash2, Power, UserCheck, KeyRound, Sparkles, FileText, CheckCircle2, Eye, X } from 'lucide-react';

const AdminManagement = () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-slate-900 border border-purple-500/30 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Super Admin Control Center
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Full system overview: manage teachers, students, exam codes, and platform analytics.</p>
        </div>

        <Link
          to="/admin"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <BookOpen className="w-4 h-4 text-amber-400" /> Go to Exam Builder
        </Link>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Teachers</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{stats.totalTeachers}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-1">{stats.totalStudents}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Exams</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-1">{stats.totalExams}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Submissions</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.totalSubmissions}</p>
          </div>
        </div>
      )}

      {/* Main Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        
        {/* Navigation Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'teachers' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" /> All Teachers ({stats?.totalTeachers || 0})
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'students' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> All Students ({stats?.totalStudents || 0})
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'exams' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> All Exams ({stats?.totalExams || 0})
            </button>
          </div>

          {/* Search & Filter (for users) */}
          {activeTab !== 'exams' && (
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
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700">
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
                <tbody className="divide-y divide-slate-800/80">
                  {teachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="px-4 py-3.5 font-bold text-white">{t.name}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        <div>{t.email || '-'}</div>
                        <div className="text-[10px] text-slate-500">{t.phone || t.mobileNumber || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{t.department || 'General'}</td>
                      <td className="px-4 py-3.5 font-bold text-amber-400">{t.examCount || 0} exams</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {t.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {t.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openUserDetailModal(t, 'teacher')}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg transition-colors"
                          title="View Teacher Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t._id)}
                          className={`p-1.5 rounded-lg border transition-colors ${t.isActive ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                          title={t.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(t._id, t.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
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
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700">
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
                <tbody className="divide-y divide-slate-800/80">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="px-4 py-3.5 font-bold text-white">{s.name}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        <div>{s.email || '-'}</div>
                        <div className="text-[10px] text-slate-500">{s.phone || s.mobileNumber || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{s.rollNumber || 'N/A'}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-400">{s.attemptsCount || 0} attempts</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">{s.avgScore || 0} pts</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {s.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {s.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openUserDetailModal(s, 'student')}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg transition-colors"
                          title="View Student Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s._id)}
                          className={`p-1.5 rounded-lg border transition-colors ${s.isActive ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}
                          title={s.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(s._id, s.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
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
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700">
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
                <tbody className="divide-y divide-slate-800/80">
                  {exams.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="px-4 py-3.5 font-bold text-white">{e.title}</td>
                      <td className="px-4 py-3.5 font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-max">
                        {e.bookletCode || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="font-semibold text-white">{e.createdBy?.name || 'System Admin'}</div>
                        <div className="text-[10px] text-slate-500">{e.createdBy?.email || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{e.questionCount || 0} Qs</td>
                      <td className="px-4 py-3.5 font-bold text-blue-400">{e.totalAttempts || 0}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">{e.avgScore || 0} pts</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {e.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <Link
                          to={`/admin/exam/${e._id}/analytics`}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{selectedUser.type} Profile Details</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-8 text-center text-slate-400">Loading profile data...</div>
            ) : userModalDetails ? (
              <div className="space-y-4 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Email Address</span>
                    <p className="text-white font-medium">{userModalDetails.teacher?.email || userModalDetails.student?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Mobile Number</span>
                    <p className="text-white font-medium">{userModalDetails.teacher?.phone || userModalDetails.student?.phone || 'N/A'}</p>
                  </div>
                </div>

                {selectedUser.type === 'teacher' && userModalDetails.exams && (
                  <div>
                    <h4 className="font-bold text-white mb-2">Exams Created ({userModalDetails.exams.length})</h4>
                    {userModalDetails.exams.length === 0 ? (
                      <p className="text-slate-500">No exams created yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userModalDetails.exams.map((ex) => (
                          <div key={ex._id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white">{ex.title}</p>
                              <p className="text-[10px] text-amber-400 font-mono">Code: {ex.bookletCode}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${ex.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
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
                    <h4 className="font-bold text-white mb-2">Attempted Exams ({userModalDetails.results.length})</h4>
                    {userModalDetails.results.length === 0 ? (
                      <p className="text-slate-500">No exam attempts yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userModalDetails.results.map((r) => (
                          <div key={r._id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white">{r.examId?.title || 'Exam'}</p>
                              <p className="text-[10px] text-slate-500">Submitted: {new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-400 text-sm">{r.score} / {r.totalMarks}</span>
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
  );
};

export default AdminManagement;
