import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function Login(){
  const navigate = useNavigate();
  const { login, setUserData } = useAuth();
  
  // Debug: Log environment variables
  console.log('=== Login Component Loaded ===');
  console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('password');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const callbackRef = useRef(null);

  // Google Login Handler
  const handleGoogleLogin = useCallback(async (response) => {
    try {
      console.log('Google response received');
      setLoading(true);
      setError('');
      
      const { data } = await api.post('/auth/google-login', {
        token: response.credential
      });

      console.log('Google login successful:', data);
      console.log('User data:', data.user);
      console.log('User role:', data.user.role);
      console.log('User ID:', data.user._id);
      
      // Set user data in context AND localStorage
      console.log('Calling setUserData...');
      setUserData(data.user, data.token);
      console.log('setUserData completed');
      
      // Determine navigation path BEFORE navigating
      const path = data.user.role === 'admin' ? '/admin' : data.user.role === 'teacher' ? '/teacher' : '/student';
      console.log('Will navigate to:', path);
      
      // Use setTimeout to ensure state has updated before navigation
      // (React batches updates, but localStorage is set immediately)
      setTimeout(() => {
        console.log('Navigating to:', path);
        navigate(path, { replace: true });
      }, 0);
      
    } catch (err) {
      console.error('Google login error:', err);
      const errorMsg = err?.response?.data?.error || 'Google login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [navigate, setUserData]);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = handleGoogleLogin;
  }, [handleGoogleLogin]);

  // Load Google Script - only once on mount
  useEffect(() => {
    console.log('Loading Google script...');
    
    const initializeGoogleSignIn = () => {
      console.log('Initializing Google...');
      console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      console.log('Callback ref:', callbackRef.current);
      
      if (!window.google) {
        console.error('window.google not available');
        return;
      }
      
      if (!callbackRef.current) {
        console.error('callbackRef.current not available');
        return;
      }
      
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
          callback: callbackRef.current
        });
        console.log('Google initialized successfully');
        setGoogleLoaded(true);
      } catch (error) {
        console.error('Error initializing Google:', error);
      }
    };
    
    if (window.google) {
      console.log('Google script already loaded');
      initializeGoogleSignIn();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google script onload fired');
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 100);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google script');
    };
    
    document.body.appendChild(script);
  }, []);

  // Re-render Google button when Google tab is clicked or when Google loads
  useEffect(() => {
    if (authMethod === 'google' && googleLoaded && window.google && callbackRef.current) {
      console.log('Google tab activated, rendering button...');
      const element = document.getElementById('google-login-btn');
      if (element && element.children.length === 0) {
        // Only render if element is empty (not already rendered)
        console.log('Rendering button to element');
        window.google.accounts.id.renderButton(
          element,
          { 
            theme: 'filled_black', 
            size: 'large',
            width: '100%',
            logo_alignment: 'center'
          }
        );
      }
    }
  }, [authMethod, googleLoaded]);

  // Password Login
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
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="mb-4 text-6xl" style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🔒</div>
            <h1 className="text-3xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Secure Exam System</h1>
            <p className="text-muted text-sm">Sign in to access your examinations</p>
          </div>

          <Card variant="elevated" padding="large">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center mb-4">Welcome Back</h2>
              
              {/* Auth Method Tabs - Enhanced */}
              <div className="flex gap-3 mb-6 p-1 bg-panel-light rounded-lg">
                <button
                  onClick={() => setAuthMethod('password')}
                  className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition duration-300 ${
                    authMethod === 'password'
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30'
                      : 'text-muted hover:text-text hover:bg-panel/50'
                  }`}
                >
                  🔐 Password
                </button>
                <button
                  onClick={() => setAuthMethod('google')}
                  className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition duration-300 ${
                    authMethod === 'google'
                      ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-muted hover:text-text hover:bg-panel/50'
                  }`}
                >
                  🌐 Google
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-light border border-danger rounded-lg text-danger text-sm">
                {error}
              </div>
            )}
            
            {/* Password Login */}
            {authMethod === 'password' && (
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
                  style={{ 
                    width: '100%',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    fontSize: '1rem'
                  }}
                >
                  🔓 Sign In Securely
                </Button>
              </form>
            )}

            {/* Google Login */}
            {authMethod === 'google' && (
              <div className="space-y-4">
                <p className="text-sm text-muted text-center mb-6">
                  🚀 Sign in with your Google account for quick and secure access
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  minHeight: '50px',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                  border: '2px solid rgba(124, 58, 237, 0.2)'
                }}>
                  <div id="google-login-btn"></div>
                </div>
                {!googleLoaded && (
                  <p className="text-muted text-sm text-center animate-pulse">⏳ Loading Google Sign-In...</p>
                )}
              </div>
            )}

            <div className="text-center mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand hover:underline font-medium">
                  Create Account
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
