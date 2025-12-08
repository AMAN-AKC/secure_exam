import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TeacherExams from './pages/TeacherExams.jsx';
import TeacherAnalytics from './pages/TeacherAnalytics.jsx';
import TeacherHistory from './pages/TeacherHistory.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import AdminDashboard from './pages/AdminDashboard_New.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
      <Route element={<Layout />}>        
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute role="teacher" />}>          
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/exams" element={<TeacherExams />} />
          <Route path="teacher/analytics" element={<TeacherAnalytics />} />
          <Route path="teacher/history" element={<TeacherHistory />} />
          <Route path="teacher/question-bank" element={<QuestionBank />} />
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>          
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="student" />}>          
          <Route path="student" element={<StudentDashboard />} />
        </Route>
      </Route>
      </Routes>
    </NotificationProvider>
  );
}
