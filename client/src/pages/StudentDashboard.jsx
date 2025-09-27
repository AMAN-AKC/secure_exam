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

  const load = async () => {
    try {
      console.log('StudentDashboard: Starting to load data...');
      console.log('Current user:', user);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      setLoading(true);
      setError(null);
      
      // Load each endpoint separately to identify which one fails
      console.log('Loading exams...');
      const ex = await api.get('/student/exams');
      console.log('Exams loaded successfully:', ex.data);
      
      console.log('Loading registrations...');
      const rg = await api.get('/student/registrations');
      console.log('Registrations loaded successfully:', rg.data);
      
      console.log('Loading results...');
      const rs = await api.get('/student/results');
      console.log('Results loaded successfully:', rs.data);
      
      setApproved(ex.data || []);
      setRegs(rg.data || []);
      setResults(rs.data || []);
      
      console.log('StudentDashboard: All data loaded successfully');
      console.log('Final state - Approved exams:', ex.data?.length || 0);
      console.log('Final state - Registrations:', rg.data?.length || 0);
      console.log('Final state - Results:', rs.data?.length || 0);
    } catch (error) {
      console.error('StudentDashboard: Error loading data:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config?.url);
      console.error('Request headers:', error.config?.headers);
      setError(`Failed to load data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{ 
    console.log('StudentDashboard: Component mounted');
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('Auth token exists:', !!localStorage.getItem('token'));
    
    if (user?.role !== 'student') {
      console.warn('Wrong role for StudentDashboard:', user?.role);
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
      
      // Show registration success with timing details
      const message = data.message || 'Registration successful. Check your schedule.';
      if (data.startTime && data.endTime) {
        const startTime = dayjs(data.startTime).format('MMM DD, YYYY [at] HH:mm');
        const endTime = dayjs(data.endTime).format('HH:mm');
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
      setExamStartTime(new Date()); // Track when exam actually started
    } catch (e) {
      if (e?.response?.status === 403) {
        const error = e?.response?.data;
        if (error?.message) {
          // Show detailed timing message
          alert(`${error.error}\n\n${error.message}`);
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
      
      // Calculate time taken
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
      const { data } = await api.get(`/student/results/${resultId}/details`);
      setShowDetailedResult(data);
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to load detailed results');
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
          <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-xl)' }}>
            <Button 
              variant="secondary"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
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
          <div className="text-center">
            <div className="mb-4">
              <h4>Are you sure you want to submit your exam?</h4>
              <p className="text-muted mt-2">
                You have answered {examProgress.answered} out of {examProgress.total} questions.
                {flaggedQuestions.size > 0 && ` You have ${flaggedQuestions.size} questions flagged for review.`}
              </p>
              <p className="text-muted mt-2">
                <strong>Once submitted, you cannot make any changes.</strong>
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
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

        {/* Detailed Result Modal */}
        <Modal
          isOpen={!!showDetailedResult}
          onClose={() => setShowDetailedResult(null)}
          title="Detailed Exam Results"
          size="large"
        >
          {showDetailedResult && (
            <div className="space-y-6">
              {/* Result Summary */}
              <div className="bg-panel-light rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{showDetailedResult.exam?.title}</h3>
                    <div className="text-sm text-muted space-y-1">
                      <div>📅 Submitted: {dayjs(showDetailedResult.submittedAt).format('MMM DD, YYYY HH:mm')}</div>
                      {showDetailedResult.timeTaken && (
                        <div>⏱️ Time Taken: {Math.floor(showDetailedResult.timeTaken / 60)}m {showDetailedResult.timeTaken % 60}s</div>
                      )}
                      {showDetailedResult.examDuration && (
                        <div>📋 Allocated Time: {showDetailedResult.examDuration} minutes</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-2">
                      {showDetailedResult.score}/{showDetailedResult.total}
                    </div>
                    <div className={`text-lg font-semibold ${
                      showDetailedResult.percentage >= 70 ? 'text-success' : 
                      showDetailedResult.percentage >= 60 ? 'text-warning' : 'text-danger'
                    }`}>
                      {showDetailedResult.percentage}%
                    </div>
                    <div className={`badge ${
                      showDetailedResult.percentage >= 90 ? 'badge-success' : 
                      showDetailedResult.percentage >= 80 ? 'badge-success' : 
                      showDetailedResult.percentage >= 70 ? 'badge-warning' : 
                      showDetailedResult.percentage >= 60 ? 'badge-warning' : 'badge-danger'
                    }`}>
                      Grade: {showDetailedResult.percentage >= 90 ? 'A' : 
                              showDetailedResult.percentage >= 80 ? 'B' : 
                              showDetailedResult.percentage >= 70 ? 'C' : 
                              showDetailedResult.percentage >= 60 ? 'D' : 'F'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions and Answers */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-3">Question-wise Analysis</h4>
                {showDetailedResult.answers?.map((answer, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 ${
                      answer.isCorrect ? 'border-success bg-success-light' : 'border-danger bg-danger-light'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold">Question {answer.questionIndex + 1}</h5>
                      <span className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                        {answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="font-medium">{answer.questionText}</p>
                    </div>

                    <div className="space-y-2">
                      {answer.options.map((option, optionIndex) => {
                        const isCorrectOption = optionIndex === answer.correctAnswerIndex;
                        const isStudentAnswer = optionIndex === answer.studentAnswerIndex;
                        
                        return (
                          <div 
                            key={optionIndex}
                            className={`p-2 rounded border text-sm ${
                              isCorrectOption ? 'border-success bg-success-light text-success-dark' :
                              isStudentAnswer && !isCorrectOption ? 'border-danger bg-danger-light text-danger-dark' :
                              'border-border bg-panel'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span className="flex-1">{option}</span>
                              <div className="flex gap-1">
                                {isCorrectOption && (
                                  <span className="text-success font-semibold" title="Correct Answer">✓</span>
                                )}
                                {isStudentAnswer && (
                                  <span 
                                    className={isCorrectOption ? 'text-success' : 'text-danger'} 
                                    title="Your Answer"
                                  >
                                    👤
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {answer.studentAnswerIndex === null && (
                        <div className="p-2 border border-warning bg-warning-light text-warning-dark rounded text-sm">
                          <span className="font-semibold">Not Answered</span> - You did not select any option for this question.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-sm">
                      <div className="font-semibold text-success">
                        Correct Answer: {String.fromCharCode(65 + answer.correctAnswerIndex)}. {answer.correctAnswerText}
                      </div>
                      {answer.studentAnswerText && (
                        <div className={`font-semibold ${answer.isCorrect ? 'text-success' : 'text-danger'}`}>
                          Your Answer: {String.fromCharCode(65 + answer.studentAnswerIndex)}. {answer.studentAnswerText}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowDetailedResult(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
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
    <div className="container stack">
      {/* Header */}
      <Card
        title="Student Dashboard"
        subtitle={`Welcome back, ${user?.name || user?.email} (${user?.role?.toUpperCase()})`}
        variant="gradient" 
        headerAction={
          <Button variant="secondary" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </Button>
        }
      >
        <div className="flex gap-4">
          <div className="progress-stat">
            <div className="progress-stat-number">{approved.length}</div>
            <div className="progress-stat-label">Available Exams</div>
          </div>
          <div className="progress-stat">
            <div className="progress-stat-number">{regs.length}</div>
            <div className="progress-stat-label">Registered</div>
          </div>
          <div className="progress-stat">
            <div className="progress-stat-number">{results.length}</div>
            <div className="progress-stat-label">Completed</div>
          </div>
        </div>
      </Card>

      {/* Available Exams */}
      <Card
        title="Available Exams"
        subtitle="Register for upcoming examinations"
      >
        {approved.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="mb-4 text-4xl">📚</div>
            <p>No exams are currently available for registration.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approved.map(exam => {
              // Safety checks for exam data
              if (!exam || (!exam.id && !exam._id)) {
                console.warn('Invalid exam data:', exam);
                return null;
              }
              
              const examId = exam.id || exam._id;
              const examKey = examId;
              
              return (
              <div key={examKey} className="border border-border rounded-lg p-4 hover:border-brand transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{exam.title}</h4>
                    {exam.description && (
                      <p className="text-sm text-muted mb-3">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>📊 Questions: {exam.questionCount || 0}</span>
                      <span>⏱️ Duration: {exam.durationMinutes}min</span>
                      <span>👨‍🏫 By: {exam.createdBy?.name || exam.createdBy?.email}</span>
                    </div>
                    
                    {/* Schedule Information */}
                    {exam.examStartTime && exam.examEndTime ? (
                      <div className="mt-2 p-3 bg-panel-light rounded-lg">
                        <div className="text-sm font-medium text-warning mb-1">⏰ Scheduled Exam</div>
                        <div className="text-sm text-muted">
                          {dayjs(exam.examStartTime).format('MMM DD, YYYY [at] HH:mm')} - {dayjs(exam.examEndTime).format('HH:mm')}
                          {!exam.allowLateEntry && <span className="text-warning ml-2">(No late entry)</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-panel-light rounded-lg">
                        <div className="text-sm font-medium text-success mb-1">🕐 Flexible Schedule</div>
                        <div className="text-sm text-muted">
                          You can take this exam at any time within your registration period
                        </div>
                      </div>
                    )}
                    
                    {/* Availability Period */}
                    {(exam.availableFrom || exam.availableTo) && (
                      <div className="mt-2 text-sm text-muted">
                        <span className="font-medium">Registration:</span>
                        {exam.availableFrom && <span> from {dayjs(exam.availableFrom).format('MMM DD, HH:mm')}</span>}
                        {exam.availableTo && <span> until {dayjs(exam.availableTo).format('MMM DD, HH:mm')}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {exam.isRegistered ? (
                      <div className="text-center">
                        <span className="badge badge-success mb-2">✓ Registered</span>
                        <Button 
                          variant="primary"
                          size="small"
                          onClick={() => accessExam(examId)}
                        >
                          Start Exam
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="primary"
                        size="small"
                        onClick={() => registerExam(examId, exam.title)}
                      >
                        Register
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              );
            }).filter(Boolean)}
          </div>
        )}
      </Card>

      {/* My Schedule */}
      <Card
        title="My Schedule" 
        subtitle="Upcoming and scheduled examinations"
      >
        {regs.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="mb-4 text-4xl">📅</div>
            <p>You have no scheduled exams.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regs
              .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)) // Most recent first
              .map(reg => {
              const result = resultsByExamId.get(reg.exam?._id || reg.exam);
              const now = new Date();
              const startTime = new Date(reg.startTime);
              const endTime = new Date(reg.endTime);
              const isUpcoming = startTime > now;
              const isActive = now >= startTime && now <= endTime;
              
              return (
                <div key={reg._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold mb-1">{reg.exam?.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>📅 {dayjs(startTime).format('MMM DD, YYYY')}</span>
                      <span>⏰ {dayjs(startTime).format('HH:mm')} - {dayjs(endTime).format('HH:mm')}</span>
                      <span className={`badge ${isActive ? 'badge-success' : isUpcoming ? 'badge-warning' : 'badge-default'}`}>
                        {isActive ? 'Active Now' : isUpcoming ? 'Upcoming' : 'Ended'}
                      </span>
                    </div>
                  </div>
                  {result && (
                    <div className="text-right">
                      <div className="badge badge-success">
                        Score: {result.score}/{result.total}
                      </div>
                    </div>
                  )}
                  {isActive && !result && (
                    <Button 
                      variant="success"
                      onClick={() => accessExam(reg.exam._id)}
                    >
                      Start Now
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Results History */}
      <Card
        title="Results History"
        subtitle="Your examination performance overview"
      >
        {results.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="mb-4 text-4xl">🎯</div>
            <p>No exam results available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => {
              const percentage = Math.round((result.score / result.total) * 100);
              const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
              const badgeVariant = percentage >= 70 ? 'badge-success' : percentage >= 60 ? 'badge-warning' : 'badge-danger';
              
              if (result.resultsHidden) {
                return (
                  <div key={result._id || result.id} className="flex items-center justify-between p-4 border border-warning bg-warning-light rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{result.exam?.title || 'Exam'}</h4>
                      <div className="flex items-center gap-4 text-sm text-warning-dark">
                        <span>📅 {dayjs(result.submittedAt).format('MMM DD, YYYY HH:mm')}</span>
                        <span className="badge badge-warning">Results Hidden</span>
                      </div>
                      <div className="text-sm text-warning-dark mt-2">
                        <div className="font-medium">📋 {result.hideReason}</div>
                        {result.resultsReleaseMessage && (
                          <div className="mt-1 italic">{result.resultsReleaseMessage}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-center text-warning">
                      <div className="text-2xl mb-2">⏳</div>
                      <div className="text-sm font-medium">Results Pending</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={result._id || result.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{result.exam?.title || 'Exam'}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>📅 {dayjs(result.submittedAt).format('MMM DD, YYYY HH:mm')}</span>
                      <span>Grade: <span className={`badge ${badgeVariant} ml-1`}>{grade}</span></span>
                      {result.timeTaken && (
                        <span>⏱️ {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                      )}
                    </div>
                    {result.resultsReleaseMessage && (
                      <div className="text-sm text-success mt-2 italic">
                        💬 {result.resultsReleaseMessage}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold mb-1">{result.score}/{result.total}</div>
                      <div className="text-sm text-muted">{percentage}%</div>
                    </div>
                    <Button 
                      variant="secondary"
                      size="small"
                      onClick={() => viewDetailedResult(result._id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
