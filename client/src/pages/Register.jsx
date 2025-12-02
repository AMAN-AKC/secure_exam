import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';

export default function Register(){
  const navigate = useNavigate();
  const { register, setUserData } = useAuth();
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');
  
  // Phone verification states
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [tempUserId, setTempUserId] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Step 1: Send phone verification code
  const handleSendPhoneCode = async () => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return;
    }

    setPhoneLoading(true);
    setPhoneError('');

    try {
      const { data } = await api.post('/auth/phone/send-code', {
        phone,
        role
      });

      setTempUserId(data.userId);
      setResendCountdown(60);
    } catch (err) {
      setPhoneError(err?.response?.data?.error || 'Failed to send code');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Step 2: Verify phone code
  const handleVerifyPhoneCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setPhoneError('Please enter a valid 6-digit code');
      return;
    }

    setPhoneLoading(true);
    setPhoneError('');

    try {
      await api.post('/auth/phone/verify-code', {
        userId: tempUserId,
        verificationCode
      });

      setPhoneVerified(true);
      setPhoneError('');
      setShowPhoneModal(false);
      // Auto-submit registration after phone verification
      await completeRegistration();
    } catch (err) {
      setPhoneError(err?.response?.data?.error || 'Verification failed');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Step 3: Resend code
  const handleResendCode = async () => {
    setPhoneLoading(true);
    setPhoneError('');

    try {
      await api.post('/auth/phone/resend-code', {
        userId: tempUserId
      });

      setResendCountdown(60);
    } catch (err) {
      setPhoneError(err?.response?.data?.error || 'Failed to resend code');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Complete registration after phone verification
  const completeRegistration = async () => {
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        phone,
        verifiedPhoneUserId: tempUserId
      });

      setUserData(data.user, data.token);
      setSuccess('Account created successfully!');
      setTimeout(() => {
        const path = data.user.role === 'student' ? '/student' : '/teacher';
        navigate(path, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Main form submission
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneError('');

    if (!phone) {
      setError('Phone number is required');
      return;
    }

    // First, verify phone number
    setShowPhoneModal(true);
    await handleSendPhoneCode();
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

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem',
        paddingTop: '4rem',
        position: 'relative',
        zIndex: 10
      }}>
      <div className="container" style={{ width: '100%', maxWidth: '520px' }}>
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
                <label className="form-label">Phone Number</label>
                <input 
                  className="input"
                  type="tel"
                  placeholder="Enter your phone number (e.g., +1234567890)"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <div className="form-help">
                  We'll send a verification code to this number
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
                loading={loading || phoneLoading}
                style={{ width: '100%' }}
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

      {/* Phone Verification Modal */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => {}}
        title="Verify Your Phone Number"
        size="medium"
      >
        <div className="space-y-4">
          <div className="p-3 bg-info-light border border-info rounded-lg text-info text-sm">
            📱 We've sent a 6-digit verification code to <strong>{phone}</strong>
          </div>

          {phoneError && (
            <div className="p-3 bg-danger-light border border-danger rounded-lg text-danger text-sm">
              {phoneError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Verification Code</label>
            <input
              className="input"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              maxLength="6"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleVerifyPhoneCode}
            loading={phoneLoading}
            style={{ width: '100%' }}
          >
            Verify & Create Account
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted">
              Didn't receive the code?{' '}
              {resendCountdown > 0 ? (
                <span>Resend in {resendCountdown}s</span>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={phoneLoading}
                  className="text-brand hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              )}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
