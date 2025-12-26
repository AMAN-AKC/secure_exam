import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  LayoutDashboard,
  FileText,
  BarChart2,
  LogOut,
  BookOpen,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PageTransition, SlideUp } from '../components/Animations';
import '../styles/QuestionBank.css';
import './TeacherDashboard.css';

// API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const QuestionBank = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('question-bank');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState(''); // Add status filter
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Track if categories have been loaded to prevent repeated fetches
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const difficulties = ['easy', 'medium', 'hard'];
  const statuses = ['approved', 'pending_review', 'rejected'];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  useEffect(() => {
    if (!categoriesLoaded) {
      fetchCategories().then(() => setCategoriesLoaded(true)).catch(() => setCategoriesLoaded(true));
    }
  }, [categoriesLoaded]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        setCategories([]);
        return;
      }

      console.log('📥 Fetching categories from:', `${API_BASE_URL}/categories`);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Categories API response status:', response.status);

      if (!response.ok) {
        console.error('❌ Categories API error:', response.status, response.statusText);
        setCategories([]);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Response is not JSON:', contentType);
        setCategories([]);
        return;
      }

      const data = await response.json();
      console.log('📦 Full response data:', data);
      
      if (data.success && data.categories) {
        setCategories(data.categories);
        console.log('✅ Categories loaded:', data.categories.length, 'categories');
      } else if (Array.isArray(data.categories)) {
        // Handle case where response doesn't have success flag but has categories array
        setCategories(data.categories);
        console.log('✅ Categories loaded (no success flag):', data.categories.length);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        setCategories([]);
      }
    } catch (error) {
      // Silently fail on subsequent calls to prevent repeated error logging
      console.warn('⚠️ Warning fetching categories (will retry):', error.message);
      // Don't set categories to empty on error - keep the ones we already have
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      if (status) params.append('status', status);

      const queryString = params.toString();
      console.log('🔍 Fetching questions with filters:', { search, category, difficulty, status, queryString });

      const response = await fetch(`${API_BASE_URL}/question-bank?${queryString}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        console.error('❌ Error fetching questions:', response.status, response.statusText);
        setQuestions([]);
        return;
      }

      const data = await response.json();
      console.log('✅ Questions fetched:', data.questions?.length || 0, 'questions');
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (item) => {
    setActiveNav(item.id);
    if (item.id === 'dashboard') navigate('/teacher');
    else if (item.id === 'exams') navigate('/teacher/exams');
    else if (item.id === 'question-bank') navigate('/teacher/question-bank');
    else if (item.id === 'analytics') navigate('/teacher/analytics');
    else if (item.id === 'history') navigate('/teacher/history');
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(() => setCategoriesLoaded(true)).catch(() => setCategoriesLoaded(true));
  }, []);

  // Fetch questions whenever filters change
  useEffect(() => {
    fetchQuestions();
  }, [search, category, difficulty, status]);

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
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
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
          <PageTransition>
            <div className="question-bank-container">
              <div className="qb-header">
                <h1>Question Bank</h1>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(!showForm)}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <Plus size={20} color="white" strokeWidth={2.5} />
                  <span>Add New Question</span>
                </motion.button>
              </div>

              {showForm && <QuestionForm onSubmit={() => { setShowForm(false); fetchQuestions(); }} />}

              <div className="qb-filters">
                <div className="search-box">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Filter by category"
                  title="Filter questions by category"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id || cat.name} value={cat.name}>
                      {cat.name} {cat.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>

                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  aria-label="Filter by difficulty"
                  title="Filter questions by difficulty"
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>

                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Filter by status"
                  title="Filter questions by status"
                >
                  <option value="">All Status</option>
                  {statuses.map(stat => (
                    <option key={stat} value={stat}>{stat.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="loading">Loading questions...</div>
              ) : (
                <div className="questions-grid">
                  {questions.map((q, idx) => (
                    <SlideUp key={q._id} delay={idx * 0.1}>
                      <QuestionCard question={q} onDelete={() => fetchQuestions()} />
                    </SlideUp>
                  ))}
                </div>
              )}

              {!loading && questions.length === 0 && (
                <div className="empty-state">
                  <p>No questions found</p>
                </div>
              )}
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

const QuestionCard = ({ question, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/question-bank/${question._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
        return;
      }

      alert('Question deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div className="question-card" whileHover={{ y: -5 }}>
        <div className="qc-header">
          <h3>{question.title}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
            {question.status && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                background: question.status === 'approved' ? '#d1fae5' : question.status === 'pending_review' ? '#fef3c7' : '#fee2e2',
                color: question.status === 'approved' ? '#065f46' : question.status === 'pending_review' ? '#92400e' : '#7f1d1d'
              }}>
                {question.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <p className="qc-category">{question.category}</p>
        <p className="qc-content">{question.content.substring(0, 100)}...</p>

        <div className="qc-stats">
          <div className="stat">
            <Clock size={16} />
            <span>{question.usageCount || 0} uses</span>
          </div>
          {question.isApproved && (
            <div className="stat approved">
              <CheckCircle size={16} />
              <span>Approved</span>
            </div>
          )}
        </div>

        <div className="qc-footer">
          <button 
            className="btn-sm" 
            onClick={() => setShowDetails(true)}
            style={{
              background: '#e0e7ff',
              color: '#4f46e5',
              border: '1px solid #c7d2fe'
            }}
          >
            View
          </button>
          <button 
            className="btn-sm" 
            disabled
            style={{
              opacity: 0.5
            }}
          >
            Edit
          </button>
          <button 
            className="btn-sm btn-danger" 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              background: isDeleting ? '#fee2e2' : '#fecaca',
              color: '#991b1b',
              border: '1px solid #fca5a5'
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>

      {/* Details Modal */}
      {showDetails && (
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
          zIndex: 100
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>{question.title}</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <strong>Category:</strong> {question.category}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <strong>Difficulty:</strong> <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <strong>Points:</strong> {question.points || 1}
              </p>
              {question.negativeMark !== undefined && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Negative Mark:</strong> {question.negativeMark}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Question</h3>
              <p style={{ color: '#374151', lineHeight: '1.6' }}>{question.content}</p>
            </div>

            {question.options && question.options.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.options.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        background: opt.isCorrect ? '#d1fae5' : '#f3f4f6',
                        borderLeft: opt.isCorrect ? '4px solid #10b981' : '4px solid #d1d5db',
                        borderRadius: '0.375rem',
                        color: '#1f2937'
                      }}
                    >
                      <strong>{String.fromCharCode(65 + idx)}.</strong> {opt.text || opt}
                      {opt.isCorrect && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓ Correct</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Description</h3>
                <p style={{ color: '#374151', lineHeight: '1.6' }}>{question.description}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

const QuestionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    content: '',
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
    points: 1,
    negativeMark: 0,
    description: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Reusable input styles
  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    marginBottom: '1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.625rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
  };

  const inputFocusHandler = (e) => {
    e.target.style.borderColor = '#7c3aed';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(124, 58, 237, 0.1)';
  };

  const inputBlurHandler = (e) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        setCategories([]);
        return;
      }

      console.log('📥 Fetching categories from:', `${API_BASE_URL}/categories`);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Categories API response status:', response.status);

      if (!response.ok) {
        console.error('❌ Categories API error:', response.status, response.statusText);
        setCategories([]);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Response is not JSON:', contentType);
        setCategories([]);
        return;
      }

      const data = await response.json();
      console.log('📦 Full response data:', data);
      
      if (data.success && data.categories) {
        setCategories(data.categories);
        console.log('✅ Categories loaded:', data.categories.length, 'categories');
      } else if (Array.isArray(data.categories)) {
        // Handle case where response doesn't have success flag but has categories array
        setCategories(data.categories);
        console.log('✅ Categories loaded (no success flag):', data.categories.length);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        setCategories([]);
      }
    } catch (error) {
      // Silently fail on subsequent calls to prevent repeated error logging
      console.warn('⚠️ Warning fetching categories (will retry):', error.message);
      // Don't set categories to empty on error - keep the ones we already have
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setCreatingCategory(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing');
        setCreatingCategory(false);
        return;
      }

      console.log('🔄 Creating category:', newCategoryName);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      console.log('📊 Create category response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Response text:', text);
        try {
          const data = JSON.parse(text);
          setError(data.error || `Server error: ${response.status}`);
        } catch {
          setError(`Server error: ${response.status}`);
        }
        setCreatingCategory(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Category created:', data);

      // Set the category in form
      setFormData({ ...formData, category: data.category?.name || newCategoryName.trim().toLowerCase() });
      setNewCategoryName('');
      setShowNewCategory(false);
      setError('');
      
      // Delay a bit to ensure backend is ready
      setTimeout(() => {
        console.log('🔄 Refreshing categories list...');
        fetchCategories();
      }, 500);
      
      alert('✅ Category created successfully!');
    } catch (error) {
      console.error('❌ Error creating category:', error);
      setError('Error creating category: ' + error.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        setError('Question title is required');
        setLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      if (!formData.content.trim()) {
        setError('Question content is required');
        setLoading(false);
        return;
      }
      if (formData.options.some(opt => !opt.text.trim())) {
        setError('All options must have text');
        setLoading(false);
        return;
      }
      if (!formData.options.some(opt => opt.isCorrect)) {
        setError('At least one option must be marked as correct');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/question-bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Question created successfully!');
        setFormData({
          title: '',
          category: '',
          difficulty: 'medium',
          content: '',
          options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
          points: 1,
          negativeMark: 0,
          description: ''
        });
        onSubmit();
      } else {
        setError(data.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setError('Error creating question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      className="question-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(124, 58, 237, 0.1)',
        maxWidth: '600px',
        margin: '2rem auto'
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>📝 Create New Question</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Add a new question to your question bank</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: '#991b1b',
            marginBottom: '1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '0.75rem',
            borderLeft: '4px solid #dc2626',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          ⚠️ {error}
        </motion.div>
      )}

      <input
        type="text"
        placeholder="Question Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
          border: '2px solid #e5e7eb',
          borderRadius: '0.625rem',
          fontSize: '1rem',
          fontFamily: 'inherit',
          transition: 'all 0.3s ease',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#7c3aed';
          e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(124, 58, 237, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
        }}
      />

      {/* Category Selection with Add New Option */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
          Category *
        </label>
        {!showNewCategory ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                ...inputStyle,
                flex: 1,
                appearance: 'none',
                paddingRight: '2.5rem',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%237c3aed%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                cursor: 'pointer',
                zIndex: 10
              }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            >
              <option value="">Select Category</option>
              {categories && categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {cat.name}
                    {cat.isDefault ? ' (Default)' : ` (${cat.usageCount || 0} questions)`}
                  </option>
                ))
              ) : (
                <option disabled>Loading categories...</option>
              )}
            </select>
            <motion.button
              type="button"
              onClick={() => setShowNewCategory(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '0.75rem 1.25rem',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 15px -3px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <Plus size={18} /> New
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter new category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              style={{
                padding: '0.75rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: creatingCategory ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                opacity: creatingCategory ? 0.5 : 1
              }}
            >
              {creatingCategory ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
              style={{
                padding: '0.75rem 1rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <select
        value={formData.difficulty}
        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
        style={{
          ...inputStyle,
          appearance: 'none',
          paddingRight: '2.5rem',
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%237c3aed%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.5em 1.5em',
          cursor: 'pointer'
        }}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <textarea
        placeholder="Question Content"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        required
        rows={3}
        style={{
          ...inputStyle,
          resize: 'vertical',
          minHeight: '7rem'
        }}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
      />

      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        style={{
          ...inputStyle,
          resize: 'vertical',
          minHeight: '5rem'
        }}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
        rows={2}
      />

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Options:</label>
        {formData.options.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt.text}
              onChange={(e) => {
                const newOpts = [...formData.options];
                newOpts[idx].text = e.target.value;
                setFormData({ ...formData, options: newOpts });
              }}
              style={{
                ...inputStyle,
                flex: 1,
                marginBottom: 0
              }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={opt.isCorrect}
                onChange={(e) => {
                  const newOpts = [...formData.options];
                  newOpts[idx].isCorrect = e.target.checked;
                  setFormData({ ...formData, options: newOpts });
                }}
              />
              <span style={{ fontSize: '0.875rem' }}>Correct</span>
            </label>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Points</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: Math.max(0.25, parseFloat(e.target.value) || 1) })}
            step="0.25"
            min="0.25"
            style={{
              ...inputStyle,
              marginBottom: 0
            }}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Negative Mark</label>
          <input
            type="number"
            value={formData.negativeMark}
            onChange={(e) => setFormData({ ...formData, negativeMark: Math.max(0, parseFloat(e.target.value) || 0) })}
            step="0.25"
            min="0"
            style={{
              ...inputStyle,
              marginBottom: 0
            }}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          padding: '1rem',
          marginTop: '1.5rem',
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontSize: '1rem',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          boxShadow: loading ? 'none' : '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.boxShadow = '0 20px 35px -5px rgba(124, 58, 237, 0.6)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.boxShadow = '0 10px 25px -5px rgba(124, 58, 237, 0.4)';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Plus size={24} strokeWidth={3} />
            </motion.div>
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Send size={22} strokeWidth={2.5} />
            <span>Create Question</span>
          </>
        )}
      </motion.button>
    </motion.form>
  );
};

export default QuestionBank;
