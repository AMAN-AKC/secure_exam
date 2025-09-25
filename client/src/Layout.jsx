import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function Layout(){
  const { user } = useAuth();
  return (
    <div>
      <nav>
        <div className="nav-inner">
          <Link to="/">Home</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user?.role === 'teacher' && <Link to="/teacher">Teacher</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user?.role === 'student' && <Link to="/student">Student</Link>}
        </div>
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
