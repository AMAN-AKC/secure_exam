import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import ExamTimer from '../components/ExamTimer.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function StudentDashboard(){
  const { user, logout } = useAuth();
  const [approved, setApproved] = useState([]);
  const [regs, setRegs] = useState([]);
  const [results, setResults] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  const [examStartTime, setExamStartTime] = useState(null);
  const [showDetailedResult, setShowDetailedResult] = useState(null);

  const resultsByExamId = useMemo(()=>{
    const map = new Map();
    results.forEach(r => { map.set(r.exam?._id || r.exam, r); });
    return map;
  }, [results]);

  const examProgress = useMemo(() => {
    if (!activeExam || !answers.length) return { answered: 0, total: 0, percentage: 0 };
    const answered = answers.filter(a => a !== null && a !== undefined).length;
    const total = answers.length;
    return { answered, total, percentage: Math.round((answered / total) * 100) };
  }, [answers, activeExam]);

  const availableExamsForRegistration = useMemo(() => {
    const registeredExamIds = new Set(regs.map(reg => (reg.exam?.id || reg.exam?._id || reg.exam)));
    return approved.filter(exam => !registeredExamIds.has(exam.id || exam._id));
  }, [approved, regs]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const exResponse = await api.get('/student/exams');
      const exams = exResponse.data || [];
      
      const regResponse = await api.get('/student/registrations');
      const registrations = regResponse.data || [];
      
      const resultResponse = await api.get('/student/results');
      const myResults = resultResponse.data || [];
      
      setApproved(exams);
      setRegs(registrations);
      setResults(myResults);
    } catch (error) {
      console.error('StudentDashboard: Error loading data:', error);
      setError(`Failed to load data: ${error.response?.data?.error || error.message}`);
      setApproved([]);
      setRegs([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{ 
    if (user?.role !== 'student') {
      setError(`Access denied: This dashboard is for students only. Your role: ${user?.role}`);
      return;
    }
    load(); 
  }, [user]);

  const registerExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to register for "${title}"?`)) return;
    try {
      const { data } = await api.post('/student/registrations', { examId });
      await load();
      
      const message = data.message || 'Registration successful. Check your schedule.';
      if (data.startTime && data.endTime) {
        // Convert UTC to IST (UTC+5:30)
        const formatUTCToIST = (utcDate) => {
          const date = new Date(utcDate);
          const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
          const day = String(istDate.getDate()).padStart(2, '0');
          const month = String(istDate.getMonth() + 1).padStart(2, '0');
          const year = istDate.getFullYear();
          const hours = String(istDate.getHours()).padStart(2, '0');
          const minutes = String(istDate.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} at ${hours}:${minutes}`;
        };
        const startTime = formatUTCToIST(data.startTime);
        const endTimeObj = new Date(data.endTime);
        const endTimeIST = new Date(endTimeObj.getTime() + (5.5 * 60 * 60 * 1000));
        const endTime = String(endTimeIST.getHours()).padStart(2, '0') + ':' + String(endTimeIST.getMinutes()).padStart(2, '0');
        alert(`Registration successful!\n\n${message}\n\nScheduled: ${startTime} - ${endTime}`);
      } else {
        alert(message);
      }
    } catch (e) {
      const error = e?.response?.data;
      alert(error?.error || 'Failed to register');
    }
  };

  const accessExam = async (examId) => {
    try {
      const { data } = await api.get(`/student/exams/${examId}/access`);
      setActiveExam(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setCurrentQuestion(0);
      setFlaggedQuestions(new Set());
      setExamStartTime(new Date());
    } catch (e) {
      if (e?.response?.status === 403) {
        const error = e?.response?.data;
        if (error?.message) {
          let displayMessage = error.message;
          if (error.minutesUntilStart !== undefined && error.startTime) {
            const startTime = dayjs(error.startTime);
            displayMessage = `Exam starts in ${error.minutesUntilStart} minutes at ${startTime.format('HH:mm')}`;
          }
          alert(`${error.error}\n\n${displayMessage}`);
        } else {
          alert(error?.error || 'Exam not accessible now.');
        }
      } else if (e?.response?.status === 400) {
        const error = e?.response?.data;
        alert(error?.error || 'Unable to access exam');
      } else {
        alert('Failed to access exam');
      }
    }
  };

  const handleAnswerChange = useCallback((questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  }, [answers]);

  const toggleFlag = useCallback((questionIndex) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionIndex)) {
      newFlagged.delete(questionIndex);
    } else {
      newFlagged.add(questionIndex);
    }
    setFlaggedQuestions(newFlagged);
  }, [flaggedQuestions]);

  const navigateToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < answers.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleTimeUp = useCallback(() => {
    alert('Time is up! Your exam will be submitted automatically.');
    submitExam();
  }, []);

  const submitExam = async () => {
    try {
      setSubmitting(true);
      const timeTaken = examStartTime ? Math.floor((new Date() - examStartTime) / 1000) : null;
      
      const { data } = await api.post(`/student/exams/${activeExam.exam.id}/submit`, { 
        answers,
        timeTaken 
      });
      
      alert('Exam submitted successfully!\n\nYour results will be available based on the teacher\'s release settings. Check "My Results" to view them when available.');
      setActiveExam(null);
      setShowConfirmModal(false);
      setExamStartTime(null);
      await load();
    } catch (error) {
      alert('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const viewDetailedResult = async (resultId) => {
    try {
      setShowDetailedResult(null);
      const { data } = await api.get(`/student/results/${resultId}/details`);
      setShowDetailedResult(data);
    } catch (error) {
      alert(`Failed to load detailed results: ${error?.response?.data?.message || error?.response?.data?.error || error?.message}`);
    }
  };

  if (activeExam) {
    const currentQ = activeExam.questions[currentQuestion];
    
    return (
      <div className="container">
        {/* Exam Header */}
        <Card 
          title={activeExam.exam.title}
          variant="gradient"
          padding="large"
          headerAction={
            <Button 
              variant="secondary" 
              size="small"
              onClick={() => setActiveExam(null)}
            >
              Exit Exam
            </Button>
          }
        >
          {/* Timer */}
          <ExamTimer 
            duration={activeExam.timing ? activeExam.timing.remainingMinutes * 60 + activeExam.timing.remainingSeconds : activeExam.exam.durationMinutes * 60 || 3600}
            onTimeUp={handleTimeUp}
          />
          
          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className="progress-header">
              <h4>Progress</h4>
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="progress-stat-number">{examProgress.answered}</div>
                  <div className="progress-stat-label">Answered</div>
                </div>
                <div className="progress-stat">
                  <div className="progress-stat-number">{examProgress.total - examProgress.answered}</div>
                  <div className="progress-stat-label">Remaining</div>
                </div>
                <div className="progress-stat">
                  <div className="progress-stat-number">{flaggedQuestions.size}</div>
                  <div className="progress-stat-label">Flagged</div>
                </div>
              </div>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${examProgress.percentage}%` }}
              />
            </div>
          </div>

          {/* Question Navigation */}
          <div className="question-nav">
            {activeExam.questions.map((_, index) => (
              <button
                key={index}
                className={`question-nav-item ${
                  index === currentQuestion ? 'current' : ''
                } ${
                  answers[index] !== null && answers[index] !== undefined ? 'answered' : ''
                } ${
                  flaggedQuestions.has(index) ? 'flagged' : ''
                }`}
                onClick={() => navigateToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>

        {/* Current Question */}
        <div className="question-container">
          <div className="question-header">
            <div className="question-number">
              Question {currentQuestion + 1} of {activeExam.questions.length}
            </div>
            <button
              className={`question-flag ${flaggedQuestions.has(currentQuestion) ? 'flagged' : ''}`}
              onClick={() => toggleFlag(currentQuestion)}
              title="Flag for review"
            >
              🏴
            </button>
          </div>
          
          <div className="question-text">
            {currentQ.text}
          </div>

          <div className="question-options">
            {currentQ.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className={`question-option ${answers[currentQuestion] === optionIndex ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(currentQuestion, optionIndex)}
              >
                <div className="question-option-radio"></div>
                <div className="question-option-text">{option}</div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <Button 
              variant="secondary"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {currentQuestion === activeExam.questions.length - 1 ? (
                <Button 
                  variant="success"
                  onClick={handleSubmitClick}
                >
                  Submit Exam
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  onClick={nextQuestion}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Submit Exam"
          size="medium"
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h4>Are you sure you want to submit your exam?</h4>
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                You have answered {examProgress.answered} out of {examProgress.total} questions.
                {flaggedQuestions.size > 0 && ` You have ${flaggedQuestions.size} questions flagged for review.`}
              </p>
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                <strong>Once submitted, you cannot make any changes.</strong>
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button 
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Continue Exam
              </Button>
              <Button 
                variant="danger"
                loading={submitting}
                onClick={submitExam}
              >
                Submit Final Answer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Card title="Error" variant="danger">
          <p>Failed to load student dashboard: {error}</p>
          <Button onClick={() => { setError(null); load(); }}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(230, 230, 250, 0.4) 0%,
          rgba(255, 218, 224, 0.3) 25%,
          rgba(200, 180, 230, 0.3) 50%,
          rgba(255, 245, 220, 0.3) 75%,
          rgba(216, 191, 216, 0.3) 100%
        ),
        radial-gradient(circle at 20% 30%, rgba(147, 112, 219, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(186, 85, 211, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(221, 160, 221, 0.1) 0%, transparent 70%)
      `,
      backgroundAttachment: 'fixed',
      overflow: 'auto',
      padding: '2rem',
      position: 'relative'
    }}>
      <style>{`
        @keyframes wave {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(20px); }
          75% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        @keyframes wave2 {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(-10px); }
          50% { transform: translateY(-30px) translateX(-20px); }
          75% { transform: translateY(-15px) translateX(-10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        .wave-bg::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(168, 85, 247, 0.05)" d="M0,96L288,112C576,128,1152,160,1440,165.3C1728,171,2016,149,2304,144C2592,139,2880,149,3168,149.3C3456,149,3744,139,4032,128C4320,117,4608,107,4896,112C5184,117,5472,139,5760,138.7C6048,139,6336,117,6624,112C6912,107,7200,117,7488,128C7776,139,8064,149,8352,154.7C8640,160,8928,160,9216,149.3C9504,139,9792,117,10080,112C10368,107,10656,117,10944,128C11232,139,11520,149,11808,144C12096,139,12384,117,12672,112C12960,107,13248,107,13536,112C13824,117,14112,128,14400,133.3L14688,139L14688,320L14400,320C14112,320,13824,320,13536,320C13248,320,12960,320,12672,320C12384,320,12096,320,11808,320C11520,320,11232,320,10944,320C10656,320,10368,320,10080,320C9792,320,9504,320,9216,320C8928,320,8640,320,8352,320C8064,320,7776,320,7488,320C7200,320,6912,320,6624,320C6336,320,6048,320,5760,320C5472,320,5184,320,4896,320C4608,320,4320,320,4032,320C3744,320,3456,320,3168,320C2880,320,2592,320,2304,320C2016,320,1728,320,1440,320C1152,320,576,320,288,320L0,320Z"></path></svg>');
          background-size: auto 100%;
          opacity: 0.5;
          animation: wave 15s linear infinite;
          z-index: -1;
        }
        
        .wave-bg::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(219, 112, 147, 0.04)" d="M0,64L288,80C576,96,1152,128,1440,138.7C1728,149,2016,139,2304,128C2592,117,2880,107,3168,101.3C3456,96,3744,96,4032,101.3C4320,107,4608,117,4896,122.7C5184,128,5472,128,5760,128C6048,128,6336,128,6624,122.7C6912,117,7200,107,7488,101.3C7776,96,8064,96,8352,101.3C8640,107,8928,117,9216,128C9504,139,9792,149,10080,144C10368,139,10656,117,10944,112C11232,107,11520,117,11808,122.7C12096,128,12384,128,12672,128C12960,128,13248,128,13536,122.7C13824,117,14112,107,14400,101.3L14688,96L14688,320L14400,320C14112,320,13824,320,13536,320C13248,320,12960,320,12672,320C12384,320,12096,320,11808,320C11520,320,11232,320,10944,320C10656,320,10368,320,10080,320C9792,320,9504,320,9216,320C8928,320,8640,320,8352,320C8064,320,7776,320,7488,320C7200,320,6912,320,6624,320C6336,320,6048,320,5760,320C5472,320,5184,320,4896,320C4608,320,4320,320,4032,320C3744,320,3456,320,3168,320C2880,320,2592,320,2304,320C2016,320,1728,320,1440,320C1152,320,576,320,288,320L0,320Z"></path></svg>');
          background-size: auto 100%;
          opacity: 0.4;
          animation: wave2 20s linear infinite reverse;
          z-index: -1;
        }
      `}</style>
      <div className="wave-bg" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1, paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
          {/* Top Navigation Header */}
          <nav style={{
            marginBottom: '2rem',
            padding: '1.75rem 2.5rem',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.25rem',
            border: '1px solid rgba(229, 231, 235, 0.6)',
            boxShadow: '0 20px 50px rgba(124, 58, 237, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Left Section - Logo and Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🎓
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 0.25rem',
                  letterSpacing: '-0.5px'
                }}>
                  SecureExam
                </h2>
                <p style={{
                  fontSize: '1.05rem',
                  color: '#9333ea',
                  fontWeight: '700',
                  margin: 0,
                  letterSpacing: '0.3px'
                }}>
                  Student Dashboard
                </p>
              </div>
            </div>

            {/* Center Section - Student Name */}
            <div style={{ textAlign: 'center', flex: 1, px: '2rem' }}>
              <p style={{
                fontSize: '1.3rem',
                color: '#64748b',
                margin: 0,
                fontWeight: '600',
                letterSpacing: '0.2px'
              }}>
                Welcome, <span style={{ 
                  fontWeight: '900', 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{user?.name || user?.email}</span>
              </p>
            </div>

            {/* Right Section - Logout Button */}
            <button
              onClick={() => {
                logout();
              }}
              style={{
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                letterSpacing: '0.3px',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🚪 Logout
            </button>
          </nav>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { icon: '📚', label: 'Available Exams', value: approved.length, color: '#7c3aed' },
              { icon: '📋', label: 'Registered', value: regs.length, color: '#2563eb' },
              { icon: '✅', label: 'Completed', value: results.length, color: '#10b981' },
              { icon: '🎯', label: 'Avg. Score', value: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score / r.total * 100), 0) / results.length) + '%' : 'N/A', color: '#f59e0b' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.75rem'
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: stat.color
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Available Exams Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              📚 Available Exams
            </h2>


            {availableExamsForRegistration.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>No exams are currently available for registration.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {availableExamsForRegistration.map(exam => {
                  if (!exam || (!exam.id && !exam._id)) return null;
                  const examId = exam.id || exam._id;
                  
                  // Helper function to format UTC date to IST (24-hour format)
                  const formatUTCToIST = (utcDate) => {
                    if (!utcDate) return 'N/A';
                    const date = new Date(utcDate);
                    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                    const day = String(istDate.getDate()).padStart(2, '0');
                    const month = String(istDate.getMonth() + 1).padStart(2, '0');
                    const year = istDate.getFullYear();
                    const hours = String(istDate.getHours()).padStart(2, '0');
                    const minutes = String(istDate.getMinutes()).padStart(2, '0');
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                  };
                  
                  return (
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.875rem',
                      padding: '1.5rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            margin: '0 0 0.5rem'
                          }}>
                            {exam.title}
                          </h4>
                          {exam.description && (
                            <p style={{
                              fontSize: '0.9rem',
                              color: '#6b7280',
                              margin: '0 0 1rem'
                            }}>
                              {exam.description}
                            </p>
                          )}
                          <div style={{
                            display: 'flex',
                            gap: '1.5rem',
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            flexWrap: 'wrap'
                          }}>
                            <span>📊 {exam.questionCount || 0} Questions</span>
                            <span>⏱️ {exam.durationMinutes}min Duration</span>
                            <span>👨‍🏫 By {exam.createdBy?.name || 'Teacher'}</span>
                            {exam.availableFrom && (
                              <span>📅 Reg: {formatUTCToIST(exam.availableFrom)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => registerExam(examId, exam.title)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.625rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            marginLeft: '1rem'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Schedule Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              📅 My Schedule
            </h2>

            {regs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>You have no scheduled exams yet. Register for available exams above.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {regs
                  .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                  .map(reg => {
                    const now = new Date();
                    const startTime = new Date(reg.startTime);
                    const endTime = new Date(reg.endTime);
                    const isUpcoming = startTime > now;
                    const isActive = now >= startTime && now <= endTime;
                    
                    // Helper function to format UTC date to IST (24-hour format)
                    const formatUTCToIST = (utcDate) => {
                      const date = new Date(utcDate);
                      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                      const day = String(istDate.getDate()).padStart(2, '0');
                      const month = String(istDate.getMonth() + 1).padStart(2, '0');
                      const year = istDate.getFullYear();
                      const hours = String(istDate.getHours()).padStart(2, '0');
                      const minutes = String(istDate.getMinutes()).padStart(2, '0');
                      return `${day}/${month}/${year} ${hours}:${minutes}`;
                    };
                    
                    return (
                      <div key={reg._id} style={{
                        background: isActive ? 'rgba(16, 185, 129, 0.05)' : isUpcoming ? 'rgba(245, 158, 11, 0.05)' : '#f3f4f6',
                        border: `1px solid ${isActive ? '#10b981' : isUpcoming ? '#f59e0b' : '#e5e7eb'}`,
                        borderRadius: '0.875rem',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            margin: '0 0 0.75rem'
                          }}>
                            {reg.exam?.title}
                          </h4>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.9rem',
                            color: '#6b7280'
                          }}>
                            <span>📅 {formatUTCToIST(startTime)}</span>
                            <span>⏱️ {formatUTCToIST(startTime).split(' ')[1]} - {formatUTCToIST(endTime).split(' ')[1]}</span>
                            <span style={{
                              background: isActive ? '#10b981' : isUpcoming ? '#f59e0b' : '#9ca3af',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {isActive ? '🟢 Active Now' : isUpcoming ? '🟡 Upcoming' : '⚫ Ended'}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <button
                            onClick={() => accessExam(reg.exam._id)}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.625rem',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#059669';
                              e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#10b981';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            Start Exam
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Results History Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              🎯 Results History
            </h2>

            {results.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>No exam results available yet. Complete an exam to see your results here.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {results.map(result => {
                  // Check if results are pending/hidden
                  if (result.resultsHidden) {
                    return (
                      <div key={result._id} style={{
                        background: '#fff7ed',
                        border: '2px solid #f59e0b',
                        borderRadius: '0.875rem',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            margin: '0 0 0.75rem'
                          }}>
                            {result.exam?.title}
                          </h4>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            flexWrap: 'wrap',
                            marginBottom: '0.75rem'
                          }}>
                            <span>📅 Submitted: {dayjs(result.submittedAt).format('MMM DD, YYYY HH:mm')}</span>
                          </div>
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fef3c7',
                            borderRadius: '0.5rem',
                            color: '#92400e',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '50%'
                          }}>
                            ⏳ Results will be available on {result.hideReason ? (() => {
                              const formatUTCToIST = (utcDate) => {
                                if (!utcDate) return 'N/A';
                                const date = new Date(utcDate);
                                const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                                const day = String(istDate.getDate()).padStart(2, '0');
                                const month = String(istDate.getMonth() + 1).padStart(2, '0');
                                const year = istDate.getFullYear();
                                const hours = String(istDate.getHours()).padStart(2, '0');
                                const minutes = String(istDate.getMinutes()).padStart(2, '0');
                                const seconds = String(istDate.getSeconds()).padStart(2, '0');
                                return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
                              };
                              return formatUTCToIST(result.hideReason);
                            })() : 'N/A'}
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'center',
                          padding: '1.25rem',
                          background: '#fef3c7',
                          borderRadius: '0.75rem',
                          minWidth: '100px',
                          flexShrink: 0
                        }}>
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#92400e',
                            fontWeight: '600'
                          }}>
                            ⏱️ PENDING
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Normal result display
                  const percentage = result.score !== undefined && result.total ? Math.round((result.score / result.total) * 100) : 0;
                  const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                  const gradeColor = percentage >= 70 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div key={result._id} style={{
                      background: '#f9fafb',
                      border: `2px solid ${gradeColor}`,
                      borderRadius: '0.875rem',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#1f2937',
                          margin: '0 0 0.75rem'
                        }}>
                          {result.exam?.title}
                        </h4>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          flexWrap: 'wrap'
                        }}>
                          <span>📅 {dayjs(result.submittedAt).format('MMM DD, YYYY HH:mm')}</span>
                          {result.timeTaken && (
                            <span>⏱️ {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          textAlign: 'center',
                          padding: '1rem',
                          background: gradeColor + '15',
                          borderRadius: '0.75rem'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: gradeColor,
                            marginBottom: '0.25rem'
                          }}>
                            {grade}
                          </div>
                          <div style={{
                            fontSize: '0.9rem',
                            color: gradeColor,
                            fontWeight: '600'
                          }}>
                            {percentage}%
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {result.score}/{result.total}
                          </div>
                        </div>
                        <button
                          onClick={() => viewDetailedResult(result._id)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.625rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#6d28d9';
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#7c3aed';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>

      {/* Detailed Result Modal */}
      <Modal
        isOpen={!!showDetailedResult}
        onClose={() => setShowDetailedResult(null)}
        title="Detailed Exam Results"
        size="large"
      >
        {showDetailedResult && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Result Summary */}
            <div style={{ background: '#f3f4f6', borderRadius: '0.75rem', padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: '600', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>{showDetailedResult.exam?.title}</h3>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', display: 'grid', gap: '0.25rem' }}>
                    <div>📅 Submitted: {dayjs(showDetailedResult.submittedAt).format('MMM DD, YYYY HH:mm')}</div>
                    {showDetailedResult.timeTaken && (
                      <div>⏱️ Time Taken: {Math.floor(showDetailedResult.timeTaken / 60)}m {showDetailedResult.timeTaken % 60}s</div>
                    )}
                    {showDetailedResult.examDuration && (
                      <div>📋 Allocated Time: {showDetailedResult.examDuration} minutes</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    {showDetailedResult.score}/{showDetailedResult.total}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#7c3aed', marginBottom: '0.5rem' }}>
                    {showDetailedResult.percentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Questions and Answers */}
            <div style={{ display: 'grid', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <h4 style={{ fontWeight: '600', margin: '0 0 0.5rem' }}>Question-wise Analysis</h4>
              {showDetailedResult.answers?.map((answer, index) => (
                <div 
                  key={index} 
                  style={{
                    border: `1px solid ${answer.isCorrect ? '#10b981' : '#ef4444'}`,
                    borderRadius: '0.625rem',
                    padding: '1rem',
                    background: answer.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h5 style={{ fontWeight: '600', margin: 0 }}>Question {answer.questionIndex + 1}</h5>
                    <span style={{
                      background: answer.isCorrect ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontWeight: '500', margin: 0 }}>{answer.questionText}</p>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {answer.options.map((option, optionIndex) => {
                      const isCorrectOption = optionIndex === answer.correctAnswerIndex;
                      const isStudentAnswer = optionIndex === answer.studentAnswerIndex;
                      
                      return (
                        <div 
                          key={optionIndex}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.85rem',
                            border: isCorrectOption ? '1px solid #10b981' : isStudentAnswer && !isCorrectOption ? '1px solid #ef4444' : '1px solid #e5e7eb',
                            background: isCorrectOption ? '#ecfdf5' : isStudentAnswer && !isCorrectOption ? '#fef2f2' : '#f9fafb'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600' }}>{String.fromCharCode(65 + optionIndex)}.</span>
                            <span style={{ flex: 1 }}>{option}</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {isCorrectOption && (
                                <span style={{ color: '#10b981', fontWeight: '600' }}>✓</span>
                              )}
                              {isStudentAnswer && (
                                <span style={{ color: isCorrectOption ? '#10b981' : '#ef4444' }}>👤</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {answer.studentAnswerIndex === null && (
                      <div style={{
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.85rem',
                        border: '1px solid #f59e0b',
                        background: '#fffbeb',
                        color: '#92400e'
                      }}>
                        <strong>Not Answered</strong> - You did not select any option for this question.
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                    <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Correct Answer: {String.fromCharCode(65 + answer.correctAnswerIndex)}. {answer.correctAnswerText}
                    </div>
                    {answer.studentAnswerText && (
                      <div style={{ color: answer.isCorrect ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                        Your Answer: {String.fromCharCode(65 + answer.studentAnswerIndex)}. {answer.studentAnswerText}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailedResult(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
