import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  LogOut,
  Clock,
  Search,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import './TeacherDashboard.css';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function TeacherHistory() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  useEffect(() => {
    fetchHistoryData();
  }, []);

  useEffect(() => {
    // Filter logic
    let result = [...exams];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(exam =>
        exam.title.toLowerCase().includes(q) ||
        exam.status.toLowerCase().includes(q)
      );
    }

    // Sort logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle specific nested keys or date conversions
        if (sortConfig.key === 'students') {
          aValue = a.results?.length || 0;
          bValue = b.results?.length || 0;
        } else if (['createdAt', 'updatedAt', 'availableFrom', 'availableTo', 'examStartTime', 'examEndTime', 'resultsReleaseDate'].includes(sortConfig.key)) {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredExams(result);
  }, [exams, searchQuery, sortConfig]);

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
      setFilteredExams(examsWithResults);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleNavigation = (item) => {
    if (item.id === 'dashboard') navigate('/teacher');
    else if (item.id === 'exams') navigate('/teacher/exams');
    else if (item.id === 'analytics') navigate('/teacher/analytics');
    else if (item.id === 'history') navigate('/teacher/history');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('MMM DD, YYYY HH:mm');
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredExams.map(exam => ({
      Subject: exam.title,
      'Created At': formatDateTime(exam.createdAt),
      'Approval Status': exam.status,
      'Reg. Start': formatDateTime(exam.availableFrom),
      'Reg. Close': formatDateTime(exam.availableTo),
      'Exam Start': formatDateTime(exam.examStartTime),
      'Exam End': formatDateTime(exam.examEndTime),
      'Result Time': formatDateTime(exam.resultsReleaseDate),
      'Student Count': exam.results?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam History");
    XLSX.writeFile(wb, `Exam_History_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
    doc.setFontSize(16);
    doc.text('Exam History Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 22);

    const headers = [['Subject', 'Created', 'Status', 'Reg. Start', 'Reg. Close', 'Exam Start', 'Exam End', 'Result Time', 'Students']];
    const data = filteredExams.map(exam => [
      exam.title,
      formatDateTime(exam.createdAt),
      exam.status,
      formatDateTime(exam.availableFrom),
      formatDateTime(exam.availableTo),
      formatDateTime(exam.examStartTime),
      formatDateTime(exam.examEndTime),
      formatDateTime(exam.resultsReleaseDate),
      exam.results?.length || 0
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] }
    });

    doc.save(`Exam_History_${dayjs().format('YYYY-MM-DD')}.pdf`);
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const TableHeader = ({ label, sortKey, width }) => (
    <th
      style={{
        padding: '1rem',
        textAlign: 'left',
        fontWeight: '600',
        color: '#374151',
        fontSize: '0.8rem',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        width: width
      }}
      onClick={() => handleSort(sortKey)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {label} <SortIcon column={sortKey} />
      </div>
    </th>
  );

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
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`nav-item ${item.id === 'history' ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>History & Logs</h1>
              <p style={{ color: '#6b7280' }}>Detailed record of all exams and timelines</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={exportToExcel}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', background: '#10b981', color: 'white',
                  border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500'
                }}
              >
                <Download size={16} /> Excel
              </button>
              <button
                onClick={exportToPDF}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', background: '#ef4444', color: 'white',
                  border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500'
                }}
              >
                <Download size={16} /> PDF
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search by subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <TableHeader label="Subject" sortKey="title" />
                    <TableHeader label="Created At" sortKey="createdAt" />
                    <TableHeader label="Approval/Status" sortKey="status" />
                    <TableHeader label="Reg. Start" sortKey="availableFrom" />
                    <TableHeader label="Reg. Close" sortKey="availableTo" />
                    <TableHeader label="Exam Start" sortKey="examStartTime" />
                    <TableHeader label="Exam End" sortKey="examEndTime" />
                    <TableHeader label="Result Time" sortKey="resultsReleaseDate" />
                    <TableHeader label="Students" sortKey="students" width="100px" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredExams.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredExams.map((exam, idx) => (
                      <tr key={exam._id} style={{ borderBottom: idx !== filteredExams.length - 1 ? '1px solid #e5e7eb' : 'none', hover: { background: '#f9fafb' } }}>
                        <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '600' }}>{exam.title}</td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.createdAt)}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            background: exam.status === 'approved' ? '#d1fae5' : exam.status === 'draft' ? '#fef3c7' : '#f3f4f6',
                            color: exam.status === 'approved' ? '#065f46' : exam.status === 'draft' ? '#92400e' : '#374151'
                          }}>
                            {exam.status}
                          </span>
                          {exam.status === 'approved' && exam.updatedAt && (
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              {formatDateTime(exam.updatedAt)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.availableFrom)}</td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.availableTo)}</td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.examStartTime)}</td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.examEndTime)}</td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateTime(exam.resultsReleaseDate)}</td>
                        <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '600', textAlign: 'center' }}>{exam.results?.length || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
