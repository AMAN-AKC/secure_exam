import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route element={<Layout />}>        
          <Route index element={<Login />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute role="teacher" />}>          
            <Route path="teacher" element={<TeacherDashboard />} />
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
