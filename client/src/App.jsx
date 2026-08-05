import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamManage from './pages/ExamManage';
import ExamTaking from './pages/ExamTaking';
import ExamResult from './pages/ExamResult';
import AdminAnalytics from './pages/AdminAnalytics';
import BookletPreview from './pages/BookletPreview';
import AdminManagement from './pages/AdminManagement';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to={user.role === 'admin' ? '/admin/manage' : user.role === 'teacher' ? '/admin' : '/dashboard'} replace />
              : <Login />
          }
        />
        <Route
          path="/register"
          element={
            user
              ? <Navigate to={user.role === 'admin' ? '/admin/manage' : user.role === 'teacher' ? '/admin' : '/dashboard'} replace />
              : <Register />
          }
        />

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/my-results" element={<StudentDashboard />} />
          <Route path="/exam/take/:examId" element={<ExamTaking />} />
          <Route path="/result/:resultId" element={<ExamResult />} />
        </Route>

        {/* Protected Teacher & Admin Exam Routes */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/exam/:id" element={<ExamManage />} />
          <Route path="/admin/exam/:examId/analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Protected Super Admin Management Route */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/manage" element={<AdminManagement />} />
        </Route>

        {/* Booklet Export Print Route */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'student']} />}>
          <Route path="/booklet/print/:examId" element={<BookletPreview />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
