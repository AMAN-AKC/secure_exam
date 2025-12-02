import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart2, 
  LogOut, 
  Plus,
  TrendingUp,
  BookOpen,
  Award,
  Clock,
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Total Exams', value: '0', icon: FileText, color: '#7c3aed' },
    { label: 'Active Students', value: '0', icon: Users, color: '#2563eb' },
    { label: 'Avg Score', value: '0%', icon: TrendingUp, color: '#7c3aed' },
    { label: 'Completion Rate', value: '0%', icon: Award, color: '#2563eb' },
  ]);
  const [chartData, setChartData] = useState([
    { name: 'Mon', score: 0 },
    { name: 'Tue', score: 0 },
    { name: 'Wed', score: 0 },
    { name: 'Thu', score: 0 },
    { name: 'Fri', score: 0 },
  ]);
  const [summary, setSummary] = useState({
    activeExams: 0,
    totalStudents: 0,
    pendingReviews: 0
  });

  // Exam creation states
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['','','','']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAllExams, setShowAllExams] = useState(false);
  const [examSettings, setExamSettings] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    availableFrom: '',
    availableTo: '',
    examStartTime: '',
    examEndTime: '',
    allowLateEntry: false,
    shuffleQuestions: false,
    showResults: true,
    resultsReleaseType: 'after_exam_ends',
    resultsReleaseDate: '',
    resultsReleaseMessage: ''
  });

  // Fetch exams and results data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const examsRes = await api.get('/teacher/exams');
        const examsData = examsRes.data || [];
        
        // Format exams for display
        const formattedExams = examsData.map(exam => ({
          id: exam._id,
          title: exam.title,
          class: exam.classname || 'General',
          students: exam.results?.length || 0,
          date: new Date(exam.examStartTime || exam.availableFrom || exam.createdAt).toLocaleDateString(),
          duration: `${exam.durationMinutes || 60} mins`,
          status: getExamStatus(exam.examStartTime, exam.examEndTime)
        }));
        
        // Show only first 3 or all based on showAllExams flag
        setExams(formattedExams.slice(0, showAllExams ? formattedExams.length : 3));

        // Calculate stats from exams - ALL DYNAMIC DATA
        const totalExams = examsData.length;
        const uniqueStudents = new Set();
        let totalScores = 0;
        let scoredResults = 0;
        let passedResults = 0; // Count results with score >= 60 (passing threshold)
        const PASS_THRESHOLD = 60;

        examsData.forEach(exam => {
          if (exam.results && exam.results.length > 0) {
            exam.results.forEach(result => {
              uniqueStudents.add(result.studentId?._id || result.student);
              if (result.score !== undefined && result.score !== null) {
                totalScores += result.score;
                scoredResults++;
                if (result.score >= PASS_THRESHOLD) {
                  passedResults++;
                }
              }
            });
          }
        });

        const avgScore = scoredResults > 0 ? Math.round(totalScores / scoredResults) : 0;
        const passRate = scoredResults > 0 ? Math.round((passedResults / scoredResults) * 100) : 0;

        // Count active exams
        const activeExams = examsData.filter(exam => getExamStatus(exam.examStartTime, exam.examEndTime) === 'active').length;
        
        // Count exams with submissions
        let examsWithSubmissions = 0;
        examsData.forEach(exam => {
          if (exam.results && exam.results.length > 0) {
            examsWithSubmissions++;
          }
        });

        setSummary({
          activeExams,
          totalStudents: uniqueStudents.size,
          pendingReviews: totalExams - examsWithSubmissions
        });

        setStats([
          { label: 'Total Exams', value: totalExams.toString(), icon: FileText, color: '#7c3aed' },
          { label: 'Active Students', value: uniqueStudents.size.toString(), icon: Users, color: '#2563eb' },
          { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: '#7c3aed' },
          { label: 'Pass Rate', value: `${passRate}%`, icon: Award, color: '#2563eb' },
        ]);

        // Generate chart data from results - ALL DYNAMIC DATA
        const weeklyScores = generateWeeklyScores(examsData);
        setChartData(weeklyScores);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, showAllExams]);

  // Helper function to calculate missing exam timing values
  const calculateExamTiming = (updates, currentSettings) => {
    const newSettings = { ...currentSettings, ...updates };

    // If we have start time and duration, calculate end time
    if (newSettings.examStartTime && newSettings.durationMinutes &&
        (!newSettings.examEndTime || updates.examStartTime || updates.durationMinutes)) {
      const startTime = dayjs(newSettings.examStartTime);
      const endTime = startTime.add(newSettings.durationMinutes, 'minute');
      newSettings.examEndTime = endTime.format('YYYY-MM-DDTHH:mm');
    }

    // If we have end time and duration, calculate start time
    else if (newSettings.examEndTime && newSettings.durationMinutes &&
             (!newSettings.examStartTime || updates.examEndTime || updates.durationMinutes)) {
      const endTime = dayjs(newSettings.examEndTime);
      const startTime = endTime.subtract(newSettings.durationMinutes, 'minute');
      newSettings.examStartTime = startTime.format('YYYY-MM-DDTHH:mm');
    }

    // If we have start time and end time, calculate duration
    else if (newSettings.examStartTime && newSettings.examEndTime &&
             (updates.examStartTime || updates.examEndTime)) {
      const startTime = dayjs(newSettings.examStartTime);
      const endTime = dayjs(newSettings.examEndTime);
      const durationMinutes = endTime.diff(startTime, 'minute');

      if (durationMinutes > 0) {
        newSettings.durationMinutes = durationMinutes;
      } else {
        console.warn('End time cannot be before start time');
        return currentSettings;
      }
    }

    return newSettings;
  };

  // Enhanced setExamSettings that auto-calculates timing
  const setExamSettingsWithCalculation = (updates) => {
    setExamSettings(prev => calculateExamTiming(updates, prev));
  };

  const createExam = async () => {
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const { data } = await api.post('/teacher/exams', { title });
      setExam(data);
      setExamSettings(prev => ({ ...prev, title, description: '' }));
      setTitle('');
      setShowSettingsModal(true);
    } catch (error) {
      alert('Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = async () => {
    if (!text.trim() || options.some(opt => !opt.trim())) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const { data } = await api.post(`/teacher/exams/${exam._id}/questions`, {
        text,
        options,
        correctIndex: Number(correctIndex)
      });
      setExam(data);
      setText('');
      setOptions(['','','','']);
      setCorrectIndex(0);
      alert('Question added successfully!');
    } catch (error) {
      alert('Failed to add question');
    }
  };

  const finalize = async () => {
    if (!exam || !exam.questions || exam.questions.length === 0) {
      alert('❌ Cannot finalize exam!\n\nYou must add at least 1 question before finalizing the exam.');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this exam? You won\'t be able to edit it anymore.')) {
      return;
    }
    try {
      await api.post(`/teacher/exams/${exam._id}/finalize`);
      setExam(null);
      setShowQuestionModal(false);
      setShowSettingsModal(false);
      alert('Exam finalized and sent to admin for approval!');
      // Reload exams
      const { data } = await api.get('/teacher/exams');
      setExams(data.slice(0, 3).map(e => ({
        id: e._id,
        title: e.title,
        class: e.classname || 'General',
        students: e.results?.length || 0,
        date: new Date(e.examStartTime || e.availableFrom || e.createdAt).toLocaleDateString(),
        duration: `${e.durationMinutes || 60} mins`,
        status: getExamStatus(e.examStartTime, e.examEndTime)
      })));
    } catch (error) {
      alert('Failed to finalize exam');
    }
  };

  const getExamStatus = (startTime, endTime) => {
    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (!start && !end) return 'draft';
    if (start && now < start) return 'scheduled';
    if (end && now > end) return 'completed';
    return 'active';
  };

  const generateWeeklyScores = (examsData) => {
    // Get current week start date (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const scores = [
      { name: 'Mon', score: 0, count: 0, date: new Date(weekStart) },
      { name: 'Tue', score: 0, count: 0, date: new Date(weekStart.getTime() + 86400000) },
      { name: 'Wed', score: 0, count: 0, date: new Date(weekStart.getTime() + 172800000) },
      { name: 'Thu', score: 0, count: 0, date: new Date(weekStart.getTime() + 259200000) },
      { name: 'Fri', score: 0, count: 0, date: new Date(weekStart.getTime() + 345600000) },
    ];

    // Process each exam result and assign to the day it was submitted/created
    examsData.forEach(exam => {
      if (exam.results && exam.results.length > 0) {
        exam.results.forEach(result => {
          // Use submission date if available, otherwise use exam date
          const resultDate = result.submittedAt ? new Date(result.submittedAt) : new Date(exam.createdAt);
          resultDate.setHours(0, 0, 0, 0);

          // Find which day of the current week this result belongs to
          const dayDiff = Math.floor((resultDate - weekStart) / 86400000);
          
          if (dayDiff >= 0 && dayDiff < 5) {
            if (result.score !== undefined && result.score !== null) {
              scores[dayDiff].score += result.score;
              scores[dayDiff].count += 1;
            }
          }
        });
      }
    });

    return scores.map(day => ({
      name: day.name,
      score: day.count > 0 ? Math.round(day.score / day.count) : 0
    }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1a103c' }}>SecureExam</span>
          </div>
          {user && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.875rem'
            }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Welcome back,</p>
              <p style={{ fontWeight: '700', color: '#1f2937' }}>{user.name || user.email}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.id === 'dashboard') navigate('/teacher');
                  if (item.id === 'exams') navigate('/teacher/exams');
                  if (item.id === 'analytics') navigate('/teacher/analytics');
                  if (item.id === 'history') navigate('/teacher/history');
                }}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Content */}
        <div className="dashboard-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '1.125rem', color: '#6b7280' }}>
              Loading dashboard...
            </div>
          ) : (
            <>
            {/* Stats Grid */}
            <div className="stats-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="stat-card" style={{ borderLeftColor: stat.color }}>
                  <div className="stat-icon" style={{ color: stat.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="grid-left">
              {/* Upcoming Exams */}
              <div className="card">
                <div className="card-header">
                  <h2>Upcoming Exams</h2>
                  <button 
                    onClick={() => setShowAllExams(!showAllExams)}
                    style={{ color: '#7c3aed', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                    {showAllExams ? '← Show Less' : 'View All →'}
                  </button>
                </div>

                <div className="exams-list">
                  {exams.map((exam) => (
                    <div key={exam.id} className="exam-card">
                      <div className="exam-content">
                        <h3>{exam.title}</h3>
                        <p className="exam-class">{exam.class} • {exam.students} Students</p>
                        <div className="exam-meta">
                          <span className="exam-time">📅 {exam.date}</span>
                          <span className="exam-duration">⏱️ {exam.duration}</span>
                        </div>
                      </div>
                      <span className={`status-badge status-${exam.status}`}>{exam.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Exam CTA */}
              <div className="cta-card" style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                color: 'white',
                padding: '2rem',
                borderRadius: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <Plus size={40} style={{ margin: '0 auto', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Create New Exam</h3>
                  <p style={{ opacity: 0.9 }}>Build and launch your next assessment in minutes</p>
                </div>
                <button style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }} onClick={() => setShowQuestionModal(true)}>
                  Get Started
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="grid-right">
              {/* Analytics Card */}
              <div className="card analytics-card">
                <div className="card-header">
                  <h2>Performance Analytics</h2>
                </div>

                <div className="analytics-content">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="analytics-stats">
                  <div className="analytics-stat">
                    <p>Avg Score</p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#7c3aed' }}>{stats[2].value}</p>
                  </div>
                  <div className="analytics-stat">
                    <p>Pass Rate</p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#2563eb' }}>{stats[3].value}</p>
                  </div>
                  <div className="analytics-stat">
                    <p>Total Exams</p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#7c3aed' }}>{stats[0].value}</p>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="card">
                <div className="card-header">
                  <h2>Quick Summary</h2>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Active Exams</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>{summary.activeExams}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Total Students</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{summary.totalStudents}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Pending Reviews</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>{summary.pendingReviews}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Create Exam Modal */}
      {showQuestionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Create New Exam</h2>

            {!exam ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Exam Title</label>
                  <input
                    type="text"
                    placeholder="Enter exam title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createExam()}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: 'white',
                      color: '#374151'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createExam}
                    disabled={!title.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      opacity: title.trim() ? 1 : 0.5
                    }}
                  >
                    Create Exam
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Exam: {exam.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{exam.questions?.length || 0} questions added</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Question Text</label>
                  <textarea
                    placeholder="Enter your question..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Answer Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {options.map((option, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setCorrectIndex(index)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: `2px solid ${correctIndex === index ? '#7c3aed' : '#e5e7eb'}`,
                            background: correctIndex === index ? '#f3e8ff' : 'transparent',
                            color: correctIndex === index ? '#7c3aed' : '#9ca3af',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </button>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            setOptions(newOptions);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setExam(null);
                      setText('');
                      setOptions(['','','','']);
                      setCorrectIndex(0);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: 'white',
                      color: '#374151'
                    }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={addQuestion}
                    disabled={!text.trim() || options.some(opt => !opt.trim())}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      opacity: text.trim() && !options.some(opt => !opt.trim()) ? 1 : 0.5
                    }}
                  >
                    Add Question
                  </button>
                  {(exam.questions?.length || 0) > 0 && (
                    <button
                      onClick={finalize}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: '#10b981',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Finalize Exam
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal - Exam Timing Configuration */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Exam Settings & Timing</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Exam Title</label>
                <input
                  type="text"
                  value={examSettings.title}
                  onChange={(e) => setExamSettingsWithCalculation({ title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  value={examSettings.description}
                  onChange={(e) => setExamSettingsWithCalculation({ description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Timing Section */}
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>Exam Timing</h3>

                {/* Duration */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Duration (minutes)</label>
                  <input
                    type="number"
                    value={examSettings.durationMinutes}
                    onChange={(e) => setExamSettingsWithCalculation({ durationMinutes: Number(e.target.value) })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Exam Start Time */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Exam Start Time</label>
                  <input
                    type="datetime-local"
                    value={examSettings.examStartTime}
                    onChange={(e) => setExamSettingsWithCalculation({ examStartTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Exam End Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Exam End Time</label>
                  <input
                    type="datetime-local"
                    value={examSettings.examEndTime}
                    onChange={(e) => setExamSettingsWithCalculation({ examEndTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    💡 Tip: Fill in any 2 of (Start Time, End Time, Duration) and the third will auto-calculate
                  </p>
                </div>
              </div>

              {/* Availability Section */}
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>Availability</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Available From</label>
                  <input
                    type="datetime-local"
                    value={examSettings.availableFrom}
                    onChange={(e) => setExamSettingsWithCalculation({ availableFrom: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Available To</label>
                  <input
                    type="datetime-local"
                    value={examSettings.availableTo}
                    onChange={(e) => setExamSettingsWithCalculation({ availableTo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Options Section */}
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>Options</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={examSettings.allowLateEntry}
                    onChange={(e) => setExamSettingsWithCalculation({ allowLateEntry: e.target.checked })}
                    id="allowLateEntry"
                  />
                  <label htmlFor="allowLateEntry" style={{ fontSize: '0.875rem' }}>Allow Late Entry</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={examSettings.shuffleQuestions}
                    onChange={(e) => setExamSettingsWithCalculation({ shuffleQuestions: e.target.checked })}
                    id="shuffleQuestions"
                  />
                  <label htmlFor="shuffleQuestions" style={{ fontSize: '0.875rem' }}>Shuffle Questions</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={examSettings.showResults}
                    onChange={(e) => setExamSettingsWithCalculation({ showResults: e.target.checked })}
                    id="showResults"
                  />
                  <label htmlFor="showResults" style={{ fontSize: '0.875rem' }}>Show Results to Students</label>
                </div>
              </div>

              {/* Results Release */}
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>Results Release</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Release Type</label>
                  <select
                    value={examSettings.resultsReleaseType}
                    onChange={(e) => setExamSettingsWithCalculation({ resultsReleaseType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="after_exam_ends">After Exam Ends</option>
                    <option value="on_date">On Specific Date</option>
                    <option value="manual">Manual Release</option>
                  </select>
                </div>

                {examSettings.resultsReleaseType === 'on_date' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Release Date</label>
                    <input
                      type="datetime-local"
                      value={examSettings.resultsReleaseDate}
                      onChange={(e) => setExamSettingsWithCalculation({ resultsReleaseDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Release Message</label>
                  <textarea
                    value={examSettings.resultsReleaseMessage}
                    onChange={(e) => setExamSettingsWithCalculation({ resultsReleaseMessage: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      const { data } = await api.put(`/teacher/exams/${exam._id}/settings`, examSettings);
                      setExam(data);
                      setShowSettingsModal(false);
                      setShowQuestionModal(true);
                      alert('Exam settings saved! Now add your questions.');
                    } catch (error) {
                      alert('Failed to save exam settings');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    opacity: submitting ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
