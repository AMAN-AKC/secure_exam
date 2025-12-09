import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  LogOut,
  Download,
  Clock,
  Search,
  Filter,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import './TeacherDashboard.css';

export default function TeacherHistory() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const ACTION_TYPES = {
    'exam_created': { label: 'Exam Created', color: '#3b82f6', bg: '#dbeafe' },
    'exam_updated': { label: 'Exam Updated', color: '#f59e0b', bg: '#fef3c7' },
    'exam_deleted': { label: 'Exam Deleted', color: '#ef4444', bg: '#fee2e2' },
    'exam_approved': { label: 'Exam Approved', color: '#10b981', bg: '#d1fae5' },
    'exam_rejected': { label: 'Exam Rejected', color: '#ef4444', bg: '#fee2e2' },
    'exam_published': { label: 'Exam Published', color: '#8b5cf6', bg: '#ede9fe' },
    'exam_started': { label: 'Exam Started', color: '#2563eb', bg: '#dbeafe' },
    'exam_ended': { label: 'Exam Ended', color: '#6b7280', bg: '#f3f4f6' },
    'submission_received': { label: 'Submission Received', color: '#10b981', bg: '#d1fae5' },
    'result_released': { label: 'Result Released', color: '#06b6d4', bg: '#cffafe' },
    'status_changed': { label: 'Status Changed', color: '#a855f7', bg: '#f3e8ff' },
  };

  // REAL activity data generator - uses actual exam and result data
  const generateRealActivities = (examsData) => {
    const activities = [];

    // Create activities for each exam
    examsData.forEach((exam, index) => {
      // 1. Exam created activity
      activities.push({
        _id: `${exam._id}-created`,
        actionType: 'exam_created',
        examId: exam._id,
        examTitle: exam.title,
        timestamp: exam.createdAt ? new Date(exam.createdAt) : new Date(),
        details: `Exam "${exam.title}" was created with ${exam.questions?.length || 0} questions`,
        changes: {
          title: exam.title,
          totalQuestions: exam.questions?.length || 0,
          duration: exam.durationMinutes || 60,
        },
      });

      // 2. Exam updated activity (if updatedAt differs from createdAt)
      if (exam.updatedAt && new Date(exam.updatedAt).getTime() !== new Date(exam.createdAt).getTime()) {
        activities.push({
          _id: `${exam._id}-updated`,
          actionType: 'exam_updated',
          examId: exam._id,
          examTitle: exam.title,
          timestamp: new Date(exam.updatedAt),
          details: `Exam "${exam.title}" was updated`,
          changes: {
            duration: exam.durationMinutes || 60,
            totalMarks: exam.totalMarks || 'N/A',
          },
        });
      }

      // 3. Status changed activity (if status exists)
      if (exam.status && exam.status !== 'draft') {
        activities.push({
          _id: `${exam._id}-status`,
          actionType: 'status_changed',
          examId: exam._id,
          examTitle: exam.title,
          timestamp: exam.updatedAt ? new Date(exam.updatedAt) : new Date(exam.createdAt),
          details: `Status changed to "${exam.status}"`,
          changes: {
            previousStatus: 'draft',
            newStatus: exam.status,
          },
        });
      }

      // 4. Exam published activity
      if (exam.status === 'published' || exam.status === 'ongoing') {
        activities.push({
          _id: `${exam._id}-published`,
          actionType: 'exam_published',
          examId: exam._id,
          examTitle: exam.title,
          timestamp: exam.publishedAt ? new Date(exam.publishedAt) : new Date(exam.updatedAt || exam.createdAt),
          details: `Exam "${exam.title}" was published`,
          changes: {
            publishedAt: exam.publishedAt ? new Date(exam.publishedAt) : new Date(exam.updatedAt || exam.createdAt),
          },
        });
      }

      // 5. Real submission activities (from actual results)
      if (exam.results && exam.results.length > 0) {
        exam.results.forEach((result, rIndex) => {
          activities.push({
            _id: `${exam._id}-submission-${rIndex}`,
            actionType: 'submission_received',
            examId: exam._id,
            examTitle: exam.title,
            studentName: result.studentId?.name || 'Unknown Student',
            studentEmail: result.studentId?.email || 'unknown@email.com',
            timestamp: result.submittedAt ? new Date(result.submittedAt) : new Date(),
            details: `Student submitted answers for "${exam.title}"`,
            changes: {
              submittedAt: result.submittedAt ? new Date(result.submittedAt) : new Date(),
              score: result.score || result.percentage || 'N/A',
              totalQuestions: exam.questions?.length || 0,
            },
          });

          // 6. Result released activity (if result has been graded)
          if (result.score !== undefined || result.percentage !== undefined) {
            activities.push({
              _id: `${exam._id}-result-${rIndex}`,
              actionType: 'result_released',
              examId: exam._id,
              examTitle: exam.title,
              studentName: result.studentId?.name || 'Unknown Student',
              studentEmail: result.studentId?.email || 'unknown@email.com',
              timestamp: result.gradedAt ? new Date(result.gradedAt) : new Date(result.submittedAt || new Date()),
              details: `Result released for student on "${exam.title}" - Score: ${result.score || result.percentage || 'N/A'}%`,
              changes: {
                score: result.score || result.percentage || 'N/A',
                status: result.status || 'completed',
              },
            });
          }
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const examsRes = await api.get('/teacher/exams');
      const examsWithResults = await Promise.all(
        examsRes.data.map(async (exam) => {
          try {
            const resultsRes = await api.get(`/teacher/exams/${exam._id}/results`);
            return { ...exam, results: resultsRes.data };
          } catch {
            return { ...exam, results: [] };
          }
        })
      );

      setExams(examsWithResults);
      // Generate REAL activities from actual exam and result data (no more mock data)
      const realActivities = generateRealActivities(examsWithResults);
      setActivities(realActivities);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredActivities = () => {
    let filtered = [...activities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.examTitle.toLowerCase().includes(query) ||
          activity.details.toLowerCase().includes(query) ||
          (activity.studentName && activity.studentName.toLowerCase().includes(query))
      );
    }

    // Action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.actionType === actionTypeFilter);
    }

    // Exam filter
    if (examFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.examId === examFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = dayjs();
      let startDate;

      if (dateRangeFilter === '7') {
        startDate = now.subtract(7, 'days');
      } else if (dateRangeFilter === '30') {
        startDate = now.subtract(30, 'days');
      } else if (dateRangeFilter === '90') {
        startDate = now.subtract(90, 'days');
      }

      filtered = filtered.filter((activity) =>
        dayjs(activity.timestamp).isAfter(startDate)
      );
    }

    // Student filter
    if (studentFilter) {
      filtered = filtered.filter((activity) =>
        activity.studentName?.toLowerCase().includes(studentFilter.toLowerCase())
      );
    }

    return filtered;
  };

  const handleNavigation = (item) => {
    if (item.id === 'dashboard') navigate('/teacher');
    else if (item.id === 'exams') navigate('/teacher/exams');
    else if (item.id === 'question-bank') navigate('/teacher/question-bank');
    else if (item.id === 'analytics') navigate('/teacher/analytics');
    else if (item.id === 'history') navigate('/teacher/history');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportCSV = () => {
    const filteredData = getFilteredActivities();
    let csv = 'Timestamp,Action Type,Exam Title,Student,Details\n';

    filteredData.forEach((activity) => {
      const timestamp = dayjs(activity.timestamp).format('YYYY-MM-DD HH:mm:ss');
      const actionLabel = ACTION_TYPES[activity.actionType]?.label || activity.actionType;
      const student = activity.studentName || '-';
      const details = activity.details.replace(/"/g, '""');

      csv += `"${timestamp}","${actionLabel}","${activity.examTitle}","${student}","${details}"\n`;
    });

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `history-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  const exportPDF = () => {
    const { jsPDF } = window.jspdf;
    const filteredData = getFilteredActivities();
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Activity History Report', 20, 15);

    // Report Info
    doc.setFontSize(10);
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 20, 25);
    doc.text(`Total Activities: ${filteredData.length}`, 20, 32);

    // Table Headers
    const headers = ['Date', 'Action', 'Exam', 'Student', 'Details'];
    const columnWidths = [30, 25, 35, 25, 50];
    let yPos = 45;

    // Header styling
    doc.setFillColor(124, 58, 237);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    let xPos = 20;
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos - 5, columnWidths[index], 7, 'F');
      doc.text(header, xPos + 2, yPos);
      xPos += columnWidths[index];
    });

    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 10;

    // Table rows
    filteredData.forEach((activity) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const timestamp = dayjs(activity.timestamp).format('MM/DD HH:mm');
      const actionLabel = ACTION_TYPES[activity.actionType]?.label || activity.actionType;
      const student = activity.studentName || '-';
      const details = activity.details.substring(0, 40);

      xPos = 20;
      doc.text(timestamp, xPos, yPos);
      xPos += columnWidths[0];
      doc.text(actionLabel, xPos, yPos);
      xPos += columnWidths[1];
      doc.text(activity.examTitle.substring(0, 15), xPos, yPos);
      xPos += columnWidths[2];
      doc.text(student.substring(0, 12), xPos, yPos);
      xPos += columnWidths[3];
      doc.text(details, xPos, yPos);

      yPos += 8;
    });

    doc.save(`history-${dayjs().format('YYYY-MM-DD')}.pdf`);
  };

  const filteredActivities = getFilteredActivities();
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (actionTypeFilter !== 'all' ? 1 : 0) +
    (examFilter !== 'all' ? 1 : 0) +
    (dateRangeFilter !== 'all' ? 1 : 0) +
    (studentFilter ? 1 : 0);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div style={{ fontSize: '1.5rem' }}>📚</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7c3aed' }}>SecureExam</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'history';
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Content */}
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>Activity History</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Track all exam activities and events</p>
          </div>

          {/* Search and Export */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.75rem 1rem',
                background: showFilters ? '#f3e8ff' : '#f3f4f6',
                color: showFilters ? '#7c3aed' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              <Filter size={18} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: '#7c3aed',
                  color: 'white',
                  borderRadius: '9999px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Export Buttons */}
            <button
              onClick={exportCSV}
              style={{
                padding: '0.75rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#059669')}
              onMouseLeave={(e) => (e.target.style.background = '#10b981')}
            >
              <Download size={18} />
              CSV
            </button>

            <button
              onClick={exportPDF}
              style={{
                padding: '0.75rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#991b1b')}
              onMouseLeave={(e) => (e.target.style.background = '#dc2626')}
            >
              <Download size={18} />
              PDF
            </button>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {/* Action Type Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Action Type
                </label>
                <select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="all">All Actions</option>
                  {Object.entries(ACTION_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Exam
                </label>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="all">All Exams</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Date Range
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>

              {/* Student Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="Filter by student..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Clear Filters */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setActionTypeFilter('all');
                    setExamFilter('all');
                    setDateRangeFilter('all');
                    setStudentFilter('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    width: '100%',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#e5e7eb')}
                  onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Activity Count */}
          <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
            Showing <strong>{filteredActivities.length}</strong> activities
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied)`}
          </div>

          {/* Timeline */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              Loading activities...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              No activities found
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: '23px',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#e5e7eb',
                }}
              />

              {/* Activity items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredActivities.map((activity, index) => {
                  const actionInfo = ACTION_TYPES[activity.actionType];

                  return (
                    <div key={activity._id} style={{ position: 'relative', paddingLeft: '60px' }}>
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '2px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: actionInfo?.color || '#9ca3af',
                          border: '3px solid white',
                          boxShadow: '0 0 0 1px #e5e7eb',
                        }}
                      />

                      {/* Activity card */}
                      <div
                        style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                background: actionInfo?.bg || '#f3f4f6',
                                color: actionInfo?.color || '#6b7280',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                              }}
                            >
                              {actionInfo?.label || activity.actionType}
                            </span>
                          </div>
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                            {dayjs(activity.timestamp).format('MMM DD, YYYY HH:mm')}
                          </span>
                        </div>

                        {/* Exam Title */}
                        <h3 style={{ margin: '0.5rem 0', color: '#1f2937', fontSize: '1rem', fontWeight: 600 }}>
                          {activity.examTitle}
                        </h3>

                        {/* Details */}
                        <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                          {activity.details}
                        </p>

                        {/* Student name if applicable */}
                        {activity.studentName && (
                          <div style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                            <strong>Student:</strong> {activity.studentName} ({activity.studentEmail})
                          </div>
                        )}

                        {/* Changes details */}
                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                            <details>
                              <summary style={{ cursor: 'pointer', color: '#7c3aed', fontSize: '0.875rem', fontWeight: 500 }}>
                                View Details
                              </summary>
                              <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {Object.entries(activity.changes).map(([key, value]) => (
                                  <div key={key} style={{ paddingBlock: '0.25rem' }}>
                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
