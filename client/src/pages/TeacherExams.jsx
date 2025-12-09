import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Users,
  BarChart2,
  Share2,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  LayoutDashboard,
  FileText,
  Clock,
  Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import './TeacherDashboard.css';

export default function TeacherExams() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('exams');
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [selectedExams, setSelectedExams] = useState(new Set());

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/teacher/exams');
        const formattedExams = data.map(exam => ({
          id: exam._id,
          title: exam.title,
          description: exam.description,
          status: exam.status,
          students: exam.results?.length || 0,
          questions: exam.questions?.length || 0,
          createdAt: new Date(exam.createdAt),
          updatedAt: new Date(exam.updatedAt),
          durationMinutes: exam.durationMinutes || 60,
          availableFrom: exam.availableFrom,
          availableTo: exam.availableTo,
          examStartTime: exam.examStartTime,
          examEndTime: exam.examEndTime
        }));
        setExams(formattedExams);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExams();
    }
  }, [user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = exams;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'created') {
      filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'status') {
      filtered = filtered.sort((a, b) => a.status.localeCompare(b.status));
    } else if (sortBy === 'students') {
      filtered = filtered.sort((a, b) => b.students - a.students);
    }

    setFilteredExams(filtered);
  }, [exams, statusFilter, searchTerm, sortBy]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedExams.size === 0) return;

    if (!window.confirm(`Delete ${selectedExams.size} exam(s)? This cannot be undone.`)) {
      return;
    }

    try {
      setSubmitting(true);
      for (const examId of selectedExams) {
        await api.delete(`/teacher/exams/${examId}`);
      }
      setExams(exams.filter(exam => !selectedExams.has(exam.id)));
      setSelectedExams(new Set());
      alert('Exams deleted successfully');
    } catch (error) {
      alert('Failed to delete exams');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit exam
  const handleEditExam = async (exam) => {
    if (exam.status !== 'draft') {
      alert('Only draft exams can be edited');
      return;
    }

    try {
      // Fetch full exam details with questions
      const { data: fullExam } = await api.get(`/teacher/exams`);
      const examToEdit = fullExam.find(e => e._id === exam.id);

      if (!examToEdit) {
        alert('Exam not found');
        return;
      }

      // Store exam in sessionStorage for TeacherDashboard to retrieve
      sessionStorage.setItem('editExam', JSON.stringify(examToEdit));
      sessionStorage.setItem('showQuestionModal', 'true');

      // Navigate to dashboard
      navigate('/teacher/dashboard');
    } catch (error) {
      alert('Failed to load exam for editing: ' + error.message);
    }
  };

  // Handle delete single exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Delete this exam? This cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.delete(`/teacher/exams/${examId}`);
      setExams(exams.filter(exam => exam.id !== examId));
      alert('Exam deleted successfully');
    } catch (error) {
      alert('Failed to delete exam');
    } finally {
      setSubmitting(false);
    }
  };

  // Export results as CSV
  const handleExportCSV = async (exam) => {
    try {
      const { data } = await api.get(`/teacher/exams/${exam.id}/results`);

      if (!data || data.length === 0) {
        alert('No results to export');
        return;
      }

      // Create CSV content
      const headers = ['Student Name', 'Email', 'Score', 'Total', 'Percentage', 'Submitted At'];
      const rows = data.map(result => [
        result.student?.name || 'Unknown',
        result.student?.email || 'Unknown',
        result.score,
        result.total,
        ((result.score / result.total) * 100).toFixed(2) + '%',
        new Date(result.submittedAt).toLocaleString()
      ]);

      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exam.title}_results.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export results');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      draft: '#f59e0b',
      pending: '#3b82f6',
      approved: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
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
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>Exams</h1>
            <p style={{ color: '#6b7280' }}>Manage and track all your created exams</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Loading exams...
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                border: '1px solid #e5e7eb',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', paddingLeft: '0.75rem' }}>
                  <Search size={18} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', padding: '0.75rem 0', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="created">Sort by Created</option>
                  <option value="status">Sort by Status</option>
                  <option value="students">Sort by Students</option>
                </select>

                {/* Bulk Delete */}
                {selectedExams.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={submitting}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      opacity: submitting ? 0.5 : 1
                    }}
                  >
                    Delete {selectedExams.size} ({submitting ? 'Deleting...' : 'Delete'})
                  </button>
                )}
              </div>

              {/* Exams Table */}
              {filteredExams.length === 0 ? (
                <div style={{
                  background: 'white',
                  padding: '3rem',
                  borderRadius: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb'
                }}>
                  <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No exams found</p>
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedExams.size === filteredExams.length && filteredExams.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExams(new Set(filteredExams.map(e => e.id)));
                              } else {
                                setSelectedExams(new Set());
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Title</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Students</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Questions</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Created</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map((exam, idx) => (
                        <tr key={exam.id} style={{ borderBottom: idx !== filteredExams.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedExams.has(exam.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedExams);
                                if (e.target.checked) {
                                  newSelected.add(exam.id);
                                } else {
                                  newSelected.delete(exam.id);
                                }
                                setSelectedExams(newSelected);
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div>
                              <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>{exam.title}</p>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{exam.description?.substring(0, 50)}...</p>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{
                              background: getStatusColor(exam.status) + '20',
                              color: getStatusColor(exam.status),
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {exam.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#1f2937', fontWeight: '500' }}>{exam.students}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#1f2937', fontWeight: '500' }}>{exam.questions}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                            {exam.createdAt.toLocaleDateString()}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              {exam.status === 'draft' && (
                                <button
                                  onClick={() => handleEditExam(exam)}
                                  title="Edit"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed' }}
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setShowDetailsModal(true);
                                }}
                                title="View details"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                              >
                                <Eye size={16} />
                              </button>
                              {exam.students > 0 && (
                                <>
                                  <button
                                    onClick={() => handleExportCSV(exam)}
                                    title="Export results"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}
                                  >
                                    <Download size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteExam(exam.id)}
                                title="Delete"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Exams</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#7c3aed' }}>{exams.length}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Draft</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#f59e0b' }}>{exams.filter(e => e.status === 'draft').length}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pending Approval</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#3b82f6' }}>{exams.filter(e => e.status === 'pending').length}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Approved</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#10b981' }}>{exams.filter(e => e.status === 'approved').length}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedExam && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>{selectedExam.title}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</p>
                <span style={{
                  background: getStatusColor(selectedExam.status) + '20',
                  color: getStatusColor(selectedExam.status),
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  display: 'inline-block'
                }}>
                  {selectedExam.status}
                </span>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Description</p>
                <p style={{ color: '#1f2937' }}>{selectedExam.description}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Questions</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>{selectedExam.questions}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Students</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{selectedExam.students}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Duration</p>
                  <p style={{ color: '#1f2937', fontWeight: '500' }}>{selectedExam.durationMinutes} mins</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Created</p>
                  <p style={{ color: '#1f2937', fontWeight: '500' }}>{selectedExam.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Last Modified</p>
                <p style={{ color: '#1f2937', fontWeight: '500' }}>{selectedExam.updatedAt.toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#374151'
                }}
              >
                Close
              </button>
              {selectedExam.students > 0 && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleExportCSV(selectedExam);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    background: '#10b981',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Export Results
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
