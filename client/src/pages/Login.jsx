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
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('password');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [mfaToken, setMfaToken] = useState(null); // Store MFA token from step 1
  const [otpSentTo, setOtpSentTo] = useState(''); // Phone number OTP was sent to
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
            logo_alignment: 'left'
          }
        );
      }
    }
  }, [authMethod, googleLoaded]);

  // Password Login - Step 1: Verify Password
  const onSubmitStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Step 1: Send email and password
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });
      
      console.log('Step 1 response:', response.data);
      
      // Step 1 success: Store mfaToken and show OTP input
      setMfaToken(response.data.mfaToken);
      setOtpSentTo(response.data.otpSentTo);
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify MFA OTP
  const onSubmitStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!mfaToken) {
        throw new Error('Session expired. Please login again.');
      }
      
      if (!otp || otp.length < 4) {
        throw new Error('Please enter a valid OTP');
      }
      
      // Step 2: Verify OTP with mfaToken
      const response = await api.post('/auth/login/verify-mfa', {
        mfaToken,
        otp
      });
      
      console.log('Step 2 response:', response.data);
      
      const { token, user: userData } = response.data;
      
      // Success! Set user data and navigate
      setUserData(userData, token);
      const path = userData.role === 'admin' ? '/admin' : userData.role === 'teacher' ? '/teacher' : '/student';
      navigate(path, { replace: true });
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'OTP verification failed';
      setError(errorMsg);
      console.error('MFA error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f5f0ff 0%, #fef5e7 25%, #ffe8f0 50%, #e8f4ff 75%, #f0e8ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Wave Background Shapes */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(196, 181, 253, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(253, 192, 248, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '-5%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(174, 194, 248, 0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(253, 208, 162, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite'
      }}></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
      `}</style>
      {/* Modern Navbar */}
      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}>
            <div style={{
              background: '#7c3aed',
              padding: '0.375rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🔒
            </div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#7c3aed',
              letterSpacing: '-0.5px'
            }}>SecureExam</span>
          </Link>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <Link to="/" style={{
              color: '#7c3aed',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }} onMouseEnter={(e) => e.target.style.color = '#2563eb'} onMouseLeave={(e) => e.target.style.color = '#7c3aed'}>
              Home
            </Link>
            <Link to="/register" style={{
              background: '#7c3aed',
              border: '1px solid #7c3aed',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }} onMouseEnter={(e) => (e.target.style.background = 'rgba(124, 58, 237, 0.9)')} onMouseLeave={(e) => (e.target.style.background = '#7c3aed')}>
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        paddingTop: '4rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              marginBottom: '1rem',
              fontSize: '5rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🔒</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}>Welcome Back</h1>
            <p style={{ fontSize: '1rem', color: '#6b7280' }}>Sign in to access your examinations</p>
          </div>

          {/* Main Card */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            {/* Card Header */}
            <div style={{
              padding: '2.5rem 2rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                textAlign: 'center',
                color: '#1f2937',
                margin: 0,
                marginBottom: '0.75rem'
              }}>Sign In</h2>
              <p style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.95rem',
                margin: 0
              }}>Continue to your dashboard</p>
            </div>

            {/* Card Body */}
            <div style={{ padding: '2.5rem 2rem' }}>
            {/* Auth Method Tabs - Enhanced */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              padding: '0.5rem',
              background: '#f3f4f6',
              borderRadius: '1rem'
            }}>
              <button
                onClick={() => setAuthMethod('password')}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: authMethod === 'password'
                    ? 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
                    : 'transparent',
                  color: authMethod === 'password' ? 'white' : '#6b7280',
                  boxShadow: authMethod === 'password'
                    ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                    : 'none'
                }}
              >
                🔐 Password
              </button>
              <button
                onClick={() => setAuthMethod('google')}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: authMethod === 'google'
                    ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
                    : 'transparent',
                  color: authMethod === 'google' ? 'white' : '#6b7280',
                  boxShadow: authMethod === 'google'
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                    : 'none'
                }}
              >
                🌐 Google
              </button>
            </div>
            
            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '0.75rem',
                color: '#dc2626',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}
            
            {/* Password Login */}
            {authMethod === 'password' && (
              <form onSubmit={mfaToken ? onSubmitStep2 : onSubmitStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* STEP 1: Email and Password */}
                {!mfaToken ? (
                  <>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Email Address</label>
                      <input 
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          fontSize: '1rem',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#7c3aed';
                          e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                        type="email"
                        placeholder="name@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Password</label>
                      <input 
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          fontSize: '1rem',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#7c3aed';
                          e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                        type="password" 
                        placeholder="••••••••"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        marginTop: '0.5rem',
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.875rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                        opacity: loading ? 0.7 : 1,
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)')}
                      onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)')}
                    >
                      {loading ? '⏳ Verifying...' : '🔓 Next: Verify with OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* STEP 2: OTP Verification */}
                    <div style={{
                      padding: '1.25rem',
                      background: '#ecfdf5',
                      border: '1px solid #86efac',
                      borderRadius: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <p style={{
                        margin: 0,
                        color: '#166534',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}>
                        ✅ Password verified!<br/>
                        Enter the OTP sent to {otpSentTo}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>One-Time Password (OTP)</label>
                      <input 
                        style={{
                          width: '100%',
                          padding: '1rem 1rem',
                          fontSize: '1.5rem',
                          letterSpacing: '0.5rem',
                          textAlign: 'center',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace',
                          fontWeight: '600'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#7c3aed';
                          e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                        type="text" 
                        placeholder="000000"
                        maxLength="6"
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#9ca3af',
                        marginTop: '0.5rem',
                        margin: '0.5rem 0 0 0'
                      }}>
                        Check your SMS or server logs (demo mode) for the code
                      </p>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || otp.length < 4}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        marginTop: '0.5rem',
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.875rem',
                        cursor: (loading || otp.length < 4) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                        opacity: (loading || otp.length < 4) ? 0.7 : 1,
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => !(loading || otp.length < 4) && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)')}
                      onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)')}
                    >
                      {loading ? '⏳ Verifying OTP...' : '🔐 Verify & Login'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setMfaToken(null);
                        setOtp('');
                        setOtpSentTo('');
                        setError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        background: 'white',
                        color: '#7c3aed',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#7c3aed';
                        e.target.style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = 'white';
                      }}
                    >
                      ← Back to login
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Google Login */}
            {authMethod === 'google' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  🚀 Sign in with your Google account for quick and secure access
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '50px',
                  padding: '0.875rem',
                  borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
                  border: '2px solid rgba(124, 58, 237, 0.2)',
                  width: '100%'
                }}>
                  <div id="google-login-btn" style={{ width: '100%' }}></div>
                </div>
                {!googleLoaded && (
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    margin: 0,
                    animation: 'pulse 2s infinite'
                  }}>⏳ Loading Google Sign-In...</p>
                )}
              </div>
            )}
            </div>

          {/* Card Footer */}
          <div style={{
            padding: '1.5rem 2rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            background: '#f9fafb'
          }}>
            <p style={{
              fontSize: '0.95rem',
              color: '#6b7280',
              margin: 0
            }}>
              Don't have an account?{' '}
              <Link to="/register" style={{
                color: '#7c3aed',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.85rem',
          marginTop: '2rem'
        }}>
          By signing in, you agree to our Terms & Conditions
        </p>
        </div>
      </div>
    </div>
  );
}
