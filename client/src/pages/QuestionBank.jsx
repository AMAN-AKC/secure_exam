import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { PageTransition, SlideUp } from './Animations';
import '../styles/QuestionBank.css';

export const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showForm, setShowForm] = useState(false);

  const categories = ['math', 'science', 'english', 'history', 'geography', 'reasoning', 'technology', 'general'];
  const difficulties = ['easy', 'medium', 'hard'];

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

  return (
    <PageTransition>
      <div className="question-bank-container">
        <div className="qb-header">
          <h1>Question Bank</h1>
          <motion.button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} /> Add Question
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
