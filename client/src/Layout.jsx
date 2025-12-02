import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function Layout(){
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Hide navbar on dashboard pages (they have their own sidebars)
  // Check if the path starts with /teacher, /admin, or /student
  const isDashboardPage = location.pathname.startsWith('/teacher') || 
                          location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/student');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isDashboardPage && (
        <nav>
          <div className="nav-inner">
            <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.125rem', letterSpacing: '1px' }}>
              📚 SecureExam
            </Link>
            
            <div style={{ flex: 1 }} />
            
            {!user && (
              <>
                <Link to="/login">Sign In</Link>
                <Link to="/register">Register</Link>
              </>
            )}
            
            {user && (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  {user.name || user.email}
                </span>
                
                {user?.role === 'teacher' && <Link to="/teacher">Teacher Dashboard</Link>}
                {user?.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
                {user?.role === 'student' && <Link to="/student">Student Dashboard</Link>}
                
                <button 
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--danger)';
                    e.target.style.background = 'var(--danger-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.background = 'none';
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      )}
      
      <div className="container" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
