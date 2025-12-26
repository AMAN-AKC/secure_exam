import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const QuestionBankSelectionPanel = ({ onSelect, onCancel, mode = 'standalone' }) => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const difficulties = ['easy', 'medium', 'hard'];

  // Fetch questions and categories
  useEffect(() => {
    fetchCategoriesAndQuestions();
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  const fetchCategoriesAndQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch categories
      const catResponse = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const catData = await catResponse.json();
      if (catData.success && catData.categories) {
        setCategories(catData.categories);
      }

      // Fetch questions with filters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await fetch(`${API_BASE_URL}/question-bank?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Show all questions (approved, pending_review, etc.) - teachers can use their own questions
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === questions.length && questions.length > 0) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q._id)));
    }
  };

  const handleSubmit = () => {
    if (selectedQuestions.size === 0) {
      alert('Please select at least one question');
      return;
    }

    setSubmitting(true);
    const selectedQuestionsData = questions.filter(q => selectedQuestions.has(q._id));
    onSelect(selectedQuestionsData);
    setSubmitting(false);
  };

  const totalMarks = questions
    .filter(q => selectedQuestions.has(q._id))
    .reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <div style={{
      position: mode === 'standalone' ? 'fixed' : 'relative',
      top: mode === 'standalone' ? 0 : 'auto',
      left: mode === 'standalone' ? 0 : 'auto',
      right: mode === 'standalone' ? 0 : 'auto',
      bottom: mode === 'standalone' ? 0 : 'auto',
      background: mode === 'standalone' ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: mode === 'standalone' ? 70 : 'auto',
      padding: mode === 'standalone' ? '2rem' : '0'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'white',
          borderRadius: mode === 'standalone' ? '1.5rem' : '1rem',
          padding: '2rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: mode === 'standalone' ? '90vh' : '100%',
          overflowY: 'auto',
          boxShadow: mode === 'standalone' ? '0 20px 60px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: '#1f2937'
        }}>
          Select Questions from Question Bank
        </h2>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            paddingLeft: '0.75rem',
            background: 'white'
          }}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                padding: '0.75rem 0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id || cat.name} value={cat.name}>
                {cat.name} {cat.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Difficulties</option>
            {difficulties.map(diff => (
              <option key={diff} value={diff}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Select All / Clear */}
        {questions.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              onClick={toggleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#7c3aed',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              {selectedQuestions.size === questions.length && questions.length > 0
                ? '☑ Deselect All'
                : '☐ Select All'}
            </button>
            {selectedQuestions.size > 0 && (
              <button
                onClick={() => setSelectedQuestions(new Set())}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No questions found matching your filters
          </div>
        ) : (
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem'
          }}>
            {questions.map((question, idx) => (
              <motion.div
                key={question._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  padding: '1rem',
                  borderBottom: idx !== questions.length - 1 ? '1px solid #e5e7eb' : 'none',
                  background: selectedQuestions.has(question._id) ? '#f3e8ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleQuestion(question._id)}
                onMouseEnter={(e) => {
                  if (!selectedQuestions.has(question._id)) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedQuestions.has(question._id) ? '#f3e8ff' : 'white';
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Checkbox */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '0.375rem',
                    border: selectedQuestions.has(question._id) ? '2px solid #7c3aed' : '2px solid #d1d5db',
                    background: selectedQuestions.has(question._id) ? '#7c3aed' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '0.125rem',
                    flexShrink: 0
                  }}>
                    {selectedQuestions.has(question._id) && (
                      <Check size={14} color="white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Question Content */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '0.25rem'
                    }}>
                      {question.title}
                    </h4>

                    <p style={{
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      lineHeight: '1.5'
                    }}>
                      {question.content?.substring(0, 100)}...
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>
                      <span style={{ textTransform: 'capitalize' }}>
                        📁 {question.category}
                      </span>
                      <span style={{
                        textTransform: 'capitalize',
                        padding: '0.125rem 0.5rem',
                        background: question.difficulty === 'easy' ? '#d1fae5' :
                                   question.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                        color: question.difficulty === 'easy' ? '#047857' :
                               question.difficulty === 'medium' ? '#b45309' : '#991b1b',
                        borderRadius: '0.25rem'
                      }}>
                        {question.difficulty}
                      </span>
                      <span>⭐ {question.points || 1} mark(s)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {questions.length > 0 && (
          <div style={{
            background: '#f3f4f6',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Selected Questions
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>
                {selectedQuestions.size} / {questions.length}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Total Marks
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                {totalMarks}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1.5rem'
        }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '0.75rem 1.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              background: 'white',
              color: '#374151',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.target.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
          >
            {mode === 'standalone' ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={selectedQuestions.size === 0 || submitting}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: selectedQuestions.size === 0 || submitting ? 'not-allowed' : 'pointer',
              background: selectedQuestions.size > 0 ? '#10b981' : '#d1d5db',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (selectedQuestions.size > 0 && !submitting) {
                e.target.style.background = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedQuestions.size > 0) {
                e.target.style.background = '#10b981';
              }
            }}
          >
            {submitting ? 'Loading...' : `Add ${selectedQuestions.size} Question(s)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestionBankSelectionPanel;
