import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  LogOut,
  Download,
  TrendingUp,
  Clock,
  BookOpen,
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
  const [allResults, setAllResults] = useState([]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
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
        api.get(`/teacher/exams/${exam._id}/results`)
          .then(res => res.data || [])
          .catch(() => [])
      );

      const resultsArrays = await Promise.all(resultPromises);
      const allResultsFlat = resultsArrays.flat().filter(r => r);
      setAllResults(allResultsFlat);

      // Calculate analytics
      calculateAnalytics(examsRes.data, allResultsFlat);
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
      filteredResults = filteredResults.filter(r => {
        const examId = r.exam?._id || r.examId || r.exam;
        return examId === selectedExam;
      });
    }

    // Helper to get percentage
    const getPercentage = (r) => {
      if (r.percentage !== undefined) return r.percentage;
      if (r.score !== undefined && r.total) return (r.score / r.total) * 100;
      return r.score || 0; // Fallback
    };

    // Calculate statistics - ALL DYNAMIC DATA
    const uniqueStudents = new Set(filteredResults.map(r => r.studentId?._id || r.studentId || r.student?._id || r.student)).size;

    // Get score data - handle both percentage and score fields
    const scoreData = filteredResults.map(r => getPercentage(r));
    const totalScore = scoreData.reduce((sum, score) => sum + score, 0);
    const avgScore = filteredResults.length > 0 ? Math.round((totalScore / filteredResults.length) * 100) / 100 : 0;

    const PASS_THRESHOLD = 60;
    const passCount = filteredResults.filter(r => {
      const score = getPercentage(r);
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
      const score = getPercentage(r);
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
        const score = getPercentage(r);
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
      score: getPercentage(r),
    }));
    setPerformanceTrendData(recentPerf);

    // Exam rankings - DYNAMIC CALCULATION
    const examStats = {};
    filteredResults.forEach(r => {
      const examId = r.exam?._id || r.examId || r.exam;
      const examTitle = r.exam?.title || (examsData.find(e => e._id === examId))?.title || 'Unknown';

      if (!examStats[examId]) {
        examStats[examId] = { examId, title: examTitle, scores: [], students: 0 };
      }
      const score = getPercentage(r);
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
      const score = getPercentage(r);
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

  // Export Logic
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('date'); // 'date' or 'subject'
  const [exportDate, setExportDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [exportExamId, setExportExamId] = useState('');
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' or 'pdf'

  // Helper to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calculate grade based on percentage
  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const generateDateReport = () => {
    const targetDate = dayjs(exportDate);
    // Filter results where the exam submission happened on this date
    // OR where the exam start time was on this date.
    // User requested "exams conducted", so we'll look at results submitted on that date primarily,
    // or we could look at exams created/scheduled for that date. 
    // Given the request "average score of the subject date and time", result aggregation seems best.

    // Group results by Exam
    const statsByExam = {};

    allResults.forEach(r => {
      const resultDate = dayjs(r.submittedAt);
      if (resultDate.isSame(targetDate, 'day')) {
        const examId = r.exam?._id || r.examId || r.exam;
        const examTitle = r.exam?.title || exams.find(e => e._id === examId)?.title || 'Unknown Exam';

        if (!statsByExam[examId]) {
          statsByExam[examId] = {
            id: examId,
            subject: examTitle,
            studentCount: 0,
            totalScore: 0,
            date: resultDate.format('YYYY-MM-DD'),
            time: resultDate.format('HH:mm') // Using last submission time or maybe exam start time?
          };
        }

        statsByExam[examId].studentCount++;
        // Handle score/percentage
        const score = r.percentage !== undefined ? r.percentage : (r.score / r.total * 100);
        statsByExam[examId].totalScore += score;
      }
    });

    const reportData = Object.values(statsByExam).map(stat => ({
      Subject: stat.subject,
      'Student Count': stat.studentCount,
      'Average Score': (stat.totalScore / stat.studentCount).toFixed(2) + '%',
      Date: stat.date,
      Time: stat.time // Could be refined to show Exam Start Time if available in exam object
    }));

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daily Exam Report");
      XLSX.writeFile(wb, `Exam_Report_${exportDate}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.text(`Exam Report - ${exportDate}`, 14, 15);

      let yPos = 30;
      const headers = ['Subject', 'Count', 'Avg Score', 'Date'];
      // Simple table
      doc.setFontSize(10);
      doc.text(headers.join('     '), 14, 25);

      reportData.forEach(row => {
        const line = `${row.Subject}     ${row['Student Count']}       ${row['Average Score']}     ${row.Date}`;
        doc.text(line, 14, yPos);
        yPos += 10;
      });
      doc.save(`Exam_Report_${exportDate}.pdf`);
    }
  };

  const generateSubjectReport = () => {
    if (!exportExamId) return;
    const selectedExamObj = exams.find(e => e._id === exportExamId);
    const examTitle = selectedExamObj?.title || 'Exam';

    // Filter results for this exam
    const examResults = allResults.filter(r => {
      const rExamId = r.exam?._id || r.examId || r.exam;
      return rExamId === exportExamId;
    });

    const reportData = examResults.map(r => {
      const score = r.percentage !== undefined ? r.percentage : (r.score / r.total * 100);
      return {
        'Student Name': r.studentId?.name || r.student?.name || 'Unknown',
        'Score': score.toFixed(2) + '%',
        'Grade': calculateGrade(score),
        'Time Taken': formatDuration(r.timeTaken),
        'Submitted At': dayjs(r.submittedAt).format('YYYY-MM-DD HH:mm')
      };
    });

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Student Results");
      XLSX.writeFile(wb, `${examTitle}_Report.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Results: ${examTitle}`, 14, 15);

      let yPos = 30;
      const headers = ['Name', 'Score', 'Grade', 'Time Taken', 'Submitted'];

      // Basic table setup
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');

      // Draw headers with some spacing
      const xPositions = [14, 60, 85, 110, 150];
      headers.forEach((h, i) => doc.text(h, xPositions[i], 25));

      doc.setFont(undefined, 'normal');
      reportData.forEach(row => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(row['Student Name'].substring(0, 20), xPositions[0], yPos);
        doc.text(row['Score'], xPositions[1], yPos);
        doc.text(row['Grade'], xPositions[2], yPos);
        doc.text(row['Time Taken'], xPositions[3], yPos);
        doc.text(row['Submitted At'], xPositions[4], yPos);
        yPos += 10;
      });
      doc.save(`${examTitle}_Report.pdf`);
    }
  };

  const handleExport = () => {
    if (exportType === 'date') {
      generateDateReport();
    } else {
      generateSubjectReport();
    }
    setShowExportModal(false);
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
                  if (item.id === 'question-bank') navigate('/teacher/question-bank');
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

              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}
              >
                <Download size={18} /> Export Report
              </button>
            </div>
          </div>

          {/* Export Modal */}
          {showExportModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1f2937' }}>Export Report</h2>

                {/* Radio Group for Report Type */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Report Type</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" checked={exportType === 'date'} onChange={() => setExportType('date')} />
                      By Date
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" checked={exportType === 'subject'} onChange={() => setExportType('subject')} />
                      By Subject
                    </label>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {exportType === 'date' ? (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Select Date</label>
                    <input
                      type="date"
                      value={exportDate}
                      onChange={(e) => setExportDate(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Select Subject/Exam</label>
                    <select
                      value={exportExamId}
                      onChange={(e) => setExportExamId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    >
                      <option value="">Select an exam...</option>
                      {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                  </div>
                )}

                {/* Format Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    onClick={() => setShowExportModal(false)}
                    style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exportType === 'subject' && !exportExamId}
                    style={{
                      padding: '0.5rem 1rem',
                      background: (exportType === 'subject' && !exportExamId) ? '#9ca3af' : '#7c3aed',
                      color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

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
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
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
