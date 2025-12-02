import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  LogOut,
  Download,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import './TeacherDashboard.css';

export default function TeacherAnalytics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // Overall Statistics
  const [overallStats, setOverallStats] = useState({
    totalExams: 0,
    totalStudentsParticipated: 0,
    averageScore: 0,
    completionRate: 0,
    passRate: 0,
    failRate: 0,
  });

  // Chart Data
  const [weeklyTrendData, setWeeklyTrendData] = useState([
    { name: 'Mon', avgScore: 0 },
    { name: 'Tue', avgScore: 0 },
    { name: 'Wed', avgScore: 0 },
    { name: 'Thu', avgScore: 0 },
    { name: 'Fri', avgScore: 0 },
    { name: 'Sat', avgScore: 0 },
    { name: 'Sun', avgScore: 0 },
  ]);
  const [studentDistributionData, setStudentDistributionData] = useState([
    { name: '90-100%', value: 0 },
    { name: '80-89%', value: 0 },
    { name: '70-79%', value: 0 },
    { name: '60-69%', value: 0 },
    { name: '0-59%', value: 0 },
  ]);
  const [performanceTrendData, setPerformanceTrendData] = useState([]);
  const [topExamsData, setTopExamsData] = useState([]);
  const [bottomExamsData, setBottomExamsData] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [bottomStudents, setBottomStudents] = useState([]);

  // Filter states
  const [dateRange, setDateRange] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // Optimized data fetching with Promise.all
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedExam]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Parallel fetching
      const examsRes = await api.get('/teacher/exams');
      setExams(examsRes.data);

      // Fetch results for all exams in parallel
      const resultPromises = examsRes.data.map(exam =>
        api.get(`/teacher/exams/${exam._id}/results`).catch(() => [])
      );
      
      const resultsArrays = await Promise.all(resultPromises);
      const allResults = resultsArrays.flat().filter(r => r);

      // Calculate analytics
      calculateAnalytics(examsRes.data, allResults);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (examsData, resultsData) => {
    // Filter by date range
    let filteredResults = resultsData;
    const now = dayjs();

    if (dateRange === '7days') {
      filteredResults = resultsData.filter(r => dayjs(r.submittedAt).isAfter(now.subtract(7, 'days')));
    } else if (dateRange === '30days') {
      filteredResults = resultsData.filter(r => dayjs(r.submittedAt).isAfter(now.subtract(30, 'days')));
    } else if (dateRange === '90days') {
      filteredResults = resultsData.filter(r => dayjs(r.submittedAt).isAfter(now.subtract(90, 'days')));
    }

    // Filter by exam
    if (selectedExam !== 'all') {
      filteredResults = filteredResults.filter(r => r.examId === selectedExam || r.exam === selectedExam);
    }

    // Calculate statistics - ALL DYNAMIC DATA
    const uniqueStudents = new Set(filteredResults.map(r => r.studentId?._id || r.studentId || r.student?._id || r.student)).size;
    
    // Get score data - handle both percentage and score fields
    const scoreData = filteredResults.map(r => r.percentage !== undefined ? r.percentage : (r.score || 0));
    const totalScore = scoreData.reduce((sum, score) => sum + score, 0);
    const avgScore = filteredResults.length > 0 ? Math.round((totalScore / filteredResults.length) * 100) / 100 : 0;
    
    const PASS_THRESHOLD = 60;
    const passCount = filteredResults.filter(r => {
      const score = r.percentage !== undefined ? r.percentage : (r.score || 0);
      return score >= PASS_THRESHOLD;
    }).length;
    const failCount = filteredResults.length - passCount;
    const passRate = filteredResults.length > 0 ? Math.round((passCount / filteredResults.length) * 100) : 0;
    const failRate = filteredResults.length > 0 ? Math.round((failCount / filteredResults.length) * 100) : 0;
    
    // Calculate completion rate (submissions / total possible)
    const totalPossibleSubmissions = examsData.length * (uniqueStudents || 1);
    const completionRate = totalPossibleSubmissions > 0 ? Math.round((filteredResults.length / totalPossibleSubmissions) * 100) : 0;

    setOverallStats({
      totalExams: examsData.length,
      totalStudentsParticipated: uniqueStudents,
      averageScore: avgScore,
      completionRate: completionRate,
      passRate: passRate,
      failRate: failRate,
    });

    // Score distribution - DYNAMIC CALCULATION
    const scoreRanges = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 };
    filteredResults.forEach(r => {
      const score = r.percentage !== undefined ? r.percentage : (r.score || 0);
      if (score >= 90) scoreRanges['90-100']++;
      else if (score >= 80) scoreRanges['80-89']++;
      else if (score >= 70) scoreRanges['70-79']++;
      else if (score >= 60) scoreRanges['60-69']++;
      else scoreRanges['0-59']++;
    });

    setStudentDistributionData([
      { name: '90-100%', value: scoreRanges['90-100'] },
      { name: '80-89%', value: scoreRanges['80-89'] },
      { name: '70-79%', value: scoreRanges['70-79'] },
      { name: '60-69%', value: scoreRanges['60-69'] },
      { name: '0-59%', value: scoreRanges['0-59'] },
    ]);

    // Weekly trend - DYNAMIC CALCULATION
    const weeklyData = {};
    for (let i = 6; i >= 0; i--) {
      const date = now.subtract(i, 'days');
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.day()];
      weeklyData[dayName] = { total: 0, count: 0 };
    }

    filteredResults.forEach(r => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayjs(r.submittedAt).day()];
      if (weeklyData[dayName]) {
        const score = r.percentage !== undefined ? r.percentage : (r.score || 0);
        weeklyData[dayName].total += score;
        weeklyData[dayName].count++;
      }
    });

    const weeklyTrend = Object.entries(weeklyData).map(([day, data]) => ({
      name: day,
      avgScore: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
    }));
    setWeeklyTrendData(weeklyTrend);

    // Recent performance (last 10) - DYNAMIC CALCULATION
    const recentPerf = filteredResults.slice(-10).map(r => ({
      name: dayjs(r.submittedAt).format('MMM DD'),
      score: r.percentage !== undefined ? r.percentage : (r.score || 0),
    }));
    setPerformanceTrendData(recentPerf);

    // Exam rankings - DYNAMIC CALCULATION
    const examStats = {};
    filteredResults.forEach(r => {
      const examId = r.examId || r.exam;
      if (!examStats[examId]) {
        const exam = examsData.find(e => e._id === examId);
        examStats[examId] = { examId, title: exam?.title || 'Unknown', scores: [], students: 0 };
      }
      const score = r.percentage !== undefined ? r.percentage : (r.score || 0);
      examStats[examId].scores.push(score);
      examStats[examId].students++;
    });

    const examPerf = Object.values(examStats).map(exam => ({
      ...exam,
      avgScore: exam.scores.length > 0 ? Math.round((exam.scores.reduce((a, b) => a + b, 0) / exam.scores.length) * 100) / 100 : 0,
    }));

    setTopExamsData(examPerf.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5));
    setBottomExamsData(examPerf.sort((a, b) => a.avgScore - b.avgScore).slice(0, 5));

    // Student rankings - DYNAMIC CALCULATION
    const studentStats = {};
    filteredResults.forEach(r => {
      const studentId = r.studentId?._id || r.studentId || r.student?._id || r.student;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          studentId,
          name: r.studentId?.name || r.student?.name || 'Unknown',
          email: r.studentId?.email || r.student?.email || 'N/A',
          scores: [],
          examsAttempted: 0,
        };
      }
      const score = r.percentage !== undefined ? r.percentage : (r.score || 0);
      studentStats[studentId].scores.push(score);
      studentStats[studentId].examsAttempted++;
    });

    const studentPerf = Object.values(studentStats).map(student => ({
      ...student,
      avgScore: student.scores.length > 0 ? Math.round((student.scores.reduce((a, b) => a + b, 0) / student.scores.length) * 100) / 100 : 0,
    }));

    setTopStudents(studentPerf.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5));
    setBottomStudents(studentPerf.sort((a, b) => a.avgScore - b.avgScore).slice(0, 5));
  };

  // Export functions
  const exportCSV = () => {
    let csv = 'Type,Name,Email,Metric,Value\n';
    csv += `Overall,Overall,Overall,Total Exams,${overallStats.totalExams}\n`;
    csv += `Overall,Overall,Overall,Students,${overallStats.totalStudentsParticipated}\n`;
    csv += `Overall,Overall,Overall,Average Score,${overallStats.averageScore}%\n`;
    csv += `Overall,Overall,Overall,Pass Rate,${overallStats.passRate}%\n`;
    csv += `Overall,Overall,Overall,Fail Rate,${overallStats.failRate}%\n`;
    csv += `Overall,Overall,Overall,Completion Rate,${overallStats.completionRate}%\n`;

    topStudents.forEach(s => {
      csv += `Student,${s.name},${s.email},Average Score,${s.avgScore}%\n`;
    });

    topExamsData.forEach(e => {
      csv += `Exam,${e.title},N/A,Average Score,${e.avgScore}%\n`;
    });

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `analytics-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 15;
    const lineHeight = 7;
    const margin = 10;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(124, 58, 237); // Violet color
    pdf.text('Analytics Report', margin, yPos);
    yPos += lineHeight + 3;

    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, margin, yPos);
    yPos += lineHeight + 5;

    // Overall Statistics
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Overall Statistics', margin, yPos);
    yPos += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    const stats = [
      `Total Exams: ${overallStats.totalExams}`,
      `Total Students: ${overallStats.totalStudentsParticipated}`,
      `Average Score: ${overallStats.averageScore}%`,
      `Pass Rate: ${overallStats.passRate}%`,
      `Fail Rate: ${overallStats.failRate}%`,
    ];
    stats.forEach(stat => {
      pdf.text(stat, margin + 3, yPos);
      yPos += lineHeight;
    });

    yPos += 3;

    // Top Students
    if (topStudents.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Top Performing Students', margin, yPos);
      yPos += lineHeight + 2;

      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      topStudents.slice(0, 5).forEach((student, i) => {
        pdf.text(`${i + 1}. ${student.name} - ${student.avgScore}%`, margin + 3, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    // Top Exams
    if (topExamsData.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Top Performing Exams', margin, yPos);
      yPos += lineHeight + 2;

      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      topExamsData.slice(0, 5).forEach((exam, i) => {
        pdf.text(`${i + 1}. ${exam.title} - ${exam.avgScore}%`, margin + 3, yPos);
        yPos += lineHeight;
      });
    }

    pdf.save(`analytics-${dayjs().format('YYYY-MM-DD')}.pdf`);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div style={{ fontSize: '24px' }}>📊</div>
            <div style={{ fontWeight: 700, color: '#1f2937' }}>Analytics</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map(item => {
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
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Analytics</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>

              <select 
                value={selectedExam} 
                onChange={(e) => setSelectedExam(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                <option value="all">All Exams</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>{exam.title}</option>
                ))}
              </select>

              <button onClick={exportCSV} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={18} /> CSV
              </button>
              <button onClick={exportPDF} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={18} /> PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7c3aed' }}>Loading analytics...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Exams</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#7c3aed' }}>{overallStats.totalExams}</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Students</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#7c3aed' }}>{overallStats.totalStudentsParticipated}</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Avg Score</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#7c3aed' }}>{overallStats.averageScore}%</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Pass Rate</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#10b981' }}>{overallStats.passRate}%</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Fail Rate</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ef4444' }}>{overallStats.failRate}%</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Completion Rate</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#2563eb' }}>{overallStats.completionRate}%</div>
                </div>
              </div>

              {/* Charts - 2 column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: '#1f2937' }}>Weekly Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '0.875rem' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '0.875rem' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
                      <Line type="monotone" dataKey="avgScore" stroke="#7c3aed" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: '#1f2937' }}>Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={studentDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {studentDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rankings - 2 column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: '#1f2937' }}>🏆 Top Exams</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topExamsData.map((exam, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', borderLeft: '3px solid #10b981' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{i + 1}. {exam.title}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{exam.students} students</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>{exam.avgScore}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: '#1f2937' }}>⚠️ Needs Attention</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bottomStudents.map((student, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', borderLeft: '3px solid #f59e0b' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{i + 1}. {student.name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{student.examsAttempted} exams</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#ef4444' }}>{student.avgScore}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Performance */}
              {performanceTrendData.length > 0 && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: '#1f2937' }}>Recent Performance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '0.875rem' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '0.875rem' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
                      <Bar dataKey="score" fill="#7c3aed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
