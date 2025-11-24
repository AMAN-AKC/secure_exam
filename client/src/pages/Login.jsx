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
      console.log('Google response:', response);
      setLoading(true);
      setError('');
      
      const { data } = await api.post('/auth/google-login', {
        token: response.credential
      });

      console.log('Google login successful:', data);
      setUserData(data.user, data.token);
      const path = data.user.role === 'admin' ? '/admin' : data.user.role === 'teacher' ? '/teacher' : '/student';
      console.log('Navigating to:', path);
      navigate(path, { replace: true });
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
        
        setTimeout(() => {
          const element = document.getElementById('google-login-btn');
          console.log('Element found:', !!element);
          
          if (element) {
            window.google.accounts.id.renderButton(
              element,
              { 
                theme: 'filled_black', 
                size: 'large', 
                width: '100%',
                logo_alignment: 'center'
              }
            );
            console.log('Button rendered successfully');
            setGoogleLoaded(true);
          } else {
            console.error('Element with id "google-login-btn" not found');
          }
        }, 0);
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

  // Re-render Google button when Google tab is clicked
  useEffect(() => {
    if (authMethod === 'google' && window.google && callbackRef.current) {
      console.log('Google tab activated, re-rendering button...');
      setTimeout(() => {
        const element = document.getElementById('google-login-btn');
        if (element) {
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
          setGoogleLoaded(true);
        } else {
          console.error('google-login-btn element not found when re-rendering');
        }
      }, 50);
    }
  }, [authMethod]);

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
              
              {/* Auth Method Tabs */}
              <div className="flex gap-2 mt-4 border-b border-border">
                <button
                  onClick={() => setAuthMethod('password')}
                  className={`flex-1 pb-2 text-sm font-medium transition ${
                    authMethod === 'password'
                      ? 'border-b-2 border-brand text-brand'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => setAuthMethod('google')}
                  className={`flex-1 pb-2 text-sm font-medium transition ${
                    authMethod === 'google'
                      ? 'border-b-2 border-brand text-brand'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Google
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
                  style={{ width: '100%' }}
                >
                  Sign In
                </Button>
              </form>
            )}

            {/* Google Login */}
            {authMethod === 'google' && (
              <div className="space-y-4">
                <p className="text-sm text-muted text-center mb-4">
                  Sign in with your Google account for quick and secure access.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }}>
                  <div id="google-login-btn"></div>
                </div>
                {!googleLoaded && (
                  <p className="text-muted text-sm text-center">Loading Google Sign-In...</p>
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
