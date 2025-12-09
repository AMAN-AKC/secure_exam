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
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PageTransition, SlideUp } from '../components/Animations';
import '../styles/QuestionBank.css';
import './TeacherDashboard.css';

const QuestionBank = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('question-bank');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showForm, setShowForm] = useState(false);

  const categories = ['math', 'science', 'english', 'history', 'geography', 'reasoning', 'technology', 'general'];
  const difficulties = ['easy', 'medium', 'hard'];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  useEffect(() => {
    fetchQuestions();
  }, [search, category, difficulty]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);

      const response = await fetch(`/api/question-bank?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
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

                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
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
  return (
    <motion.div className="question-card" whileHover={{ y: -5 }}>
      <div className="qc-header">
        <h3>{question.title}</h3>
        <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
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
        <button className="btn-sm">Edit</button>
        <button className="btn-sm btn-danger">
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const QuestionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    content: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    points: 1,
    negativeMark: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/question-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  return (
    <motion.form className="question-form" onSubmit={handleSubmit}>
      <h2>Create New Question</h2>

      <input
        type="text"
        placeholder="Question Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
        <option>Select Category</option>
        <option value="math">Math</option>
        <option value="science">Science</option>
        <option value="english">English</option>
      </select>

      <textarea
        placeholder="Question Content"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        required
      />

      {formData.options.map((opt, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={`Option ${idx + 1}`}
          value={opt}
          onChange={(e) => {
            const newOpts = [...formData.options];
            newOpts[idx] = e.target.value;
            setFormData({ ...formData, options: newOpts });
          }}
        />
      ))}

      <button type="submit" className="btn-primary">Create Question</button>
    </motion.form>
  );
};

export default QuestionBank;
