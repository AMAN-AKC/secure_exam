import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function Login(){
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => { 
    e.preventDefault(); 
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);
      const path = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student';
      navigate(path, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-center">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="mb-4 text-4xl">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Secure Exam System</h1>
            <p className="text-muted">Sign in to access your examinations</p>
          </div>

          <Card variant="elevated" padding="large">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center">Welcome Back</h2>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-light border border-danger rounded-lg text-danger text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className={`input ${error ? 'error' : ''}`}
                  type="email"
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  className={`input ${error ? 'error' : ''}`}
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                variant="primary" 
                size="large"
                loading={loading}
                style={{ width: '100%' }}
              >
                Sign In
              </Button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand hover:underline font-medium">
                  Create Account
                </Link>
              </p>
            </div>
          </Card>

          {/* Demo Accounts Info */}
          <Card variant="bordered" padding="normal" className="mt-6">
            <h4 className="font-semibold mb-3">Demo Accounts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Admin:</span>
                <span>Check server console</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Teacher:</span>
                <span>Register as teacher</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Student:</span>
                <span>Register as student</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
