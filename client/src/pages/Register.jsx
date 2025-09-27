import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function Register(){
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => { 
    e.preventDefault(); 
    setError(''); 
    setSuccess('');
    setLoading(true);
    
    try { 
      await register(name, email, password, role); 
      setSuccess('Account created successfully! Please login with your credentials.'); 
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setRole('student');
      // Redirect after a delay
      setTimeout(() => navigate('/login', { replace: true }), 2000); 
    } catch (err) { 
      setError(err?.response?.data?.error || 'Registration failed'); 
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
            <div className="mb-4 text-4xl">🚀</div>
            <h1 className="text-2xl font-bold mb-2">Join Secure Exam System</h1>
            <p className="text-muted">Create your account to get started</p>
          </div>

          <Card variant="elevated" padding="large">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center">Create Account</h2>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-light border border-danger rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-success-light border border-success rounded-lg text-success text-sm">
                {success}
              </div>
            )}
            
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  className="input"
                  type="text"
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className="input"
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
                  className="input"
                  type="password" 
                  placeholder="Create a strong password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <div className="form-help">
                  Password must be at least 6 characters long
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select 
                  className="select" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student - Take exams and view results</option>
                  <option value="teacher">Teacher - Create and manage exams</option>
                </select>
              </div>
              
              <Button 
                type="submit" 
                variant="primary" 
                size="large"
                loading={loading}
                style={{ width: '100%' }}
                disabled={success}
              >
                Create Account
              </Button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-brand hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
