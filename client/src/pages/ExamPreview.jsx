import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Lock, Download, Save } from 'lucide-react';
import { PageTransition, SlideUp } from './Animations';
import '../styles/ExamPreview.css';

export const ExamPreview = ({ examId, onClose }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingStats, setMarkingStats] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    fetchPreview();
    fetchMarkingStats();
  }, [examId]);

  const fetchPreview = async () => {
    try {
      const response = await fetch(`/api/exam-preview/${examId}/preview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPreview(data.preview);
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkingStats = async () => {
    try {
      const response = await fetch(`/api/exam-preview/${examId}/marking-stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setMarkingStats(data.markingScheme);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCompletePreview = async () => {
    try {
      const response = await fetch(`/api/exam-preview/${examId}/preview/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        fetchPreview();
      }
    } catch (error) {
      console.error('Error completing preview:', error);
    }
  };

  const handleFinalizeExam = async () => {
    try {
      const response = await fetch(`/api/exam-preview/${examId}/finalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        alert('Exam finalized successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error finalizing exam:', error);
    }
  };

  if (loading) return <div className="loading">Loading preview...</div>;
  if (!preview) return <div className="error">Failed to load preview</div>;

  return (
    <PageTransition>
      <div className="exam-preview-container">
        <div className="ep-header">
          <div>
            <h1>{preview.title}</h1>
            <p className="ep-subtitle">{preview.totalQuestions} questions • {preview.totalPoints} points</p>
          </div>
          <div className="ep-actions">
            <button className="btn-secondary" onClick={() => window.print()}>
              <Download size={20} /> Export
            </button>
            {!preview.isFinalized && (
              <button className="btn-primary" onClick={handleFinalizeExam}>
                <Lock size={20} /> Finalize Exam
              </button>
            )}
          </div>
        </div>

        {/* Marking Statistics */}
        {markingStats && (
          <SlideUp>
            <div className="marking-stats">
              <h2>Marking Summary</h2>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-value">{markingStats.totalPoints}</div>
                  <div className="stat-label">Total Points</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{markingStats.averagePoints}</div>
                  <div className="stat-label">Avg per Question</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{markingStats.questionsWithPartialCredit}</div>
                  <div className="stat-label">Partial Credit Q's</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{markingStats.totalNegativeMark}</div>
                  <div className="stat-label">Total Negative Mark</div>
                </div>
              </div>
            </div>
          </SlideUp>
        )}

        {/* Questions Preview */}
        <div className="questions-preview">
          <h2>Question Preview</h2>
          {preview.questions.map((q, idx) => (
            <SlideUp key={idx} delay={idx * 0.1}>
              <QuestionPreviewCard
                question={q}
                index={idx}
                marking={markingStats?.questions[idx]}
                editing={editingQuestion === idx}
                onEdit={() => setEditingQuestion(idx)}
              />
            </SlideUp>
          ))}
        </div>

        {/* Action Buttons */}
        {!preview.isPreviewComplete && (
          <motion.button
            className="btn-primary btn-lg"
            onClick={handleCompletePreview}
            whileHover={{ scale: 1.05 }}
          >
            <Eye size={20} /> Mark Preview as Complete
          </motion.button>
        )}

        {preview.isPreviewComplete && !preview.isFinalized && (
          <motion.button
            className="btn-success btn-lg"
            onClick={handleFinalizeExam}
            whileHover={{ scale: 1.05 }}
          >
            <Lock size={20} /> Finalize & Submit for Approval
          </motion.button>
        )}

        {preview.isFinalized && (
          <div className="finalized-banner">
            <Lock size={20} />
            <p>This exam has been finalized and submitted for approval. No further modifications allowed.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

const QuestionPreviewCard = ({ question, index, marking, editing, onEdit }) => {
  const [updatedMarking, setUpdatedMarking] = useState(marking);

  const handleSaveMarking = async () => {
    // Save marking logic here
    onEdit();
  };

  return (
    <motion.div className="question-preview-card" whileHover={{ y: -2 }}>
      <div className="qpc-number">Q{question.number}</div>

      <h3>{question.text}</h3>

      <div className="qpc-options">
        {question.options.map((opt, idx) => (
          <div
            key={idx}
            className={`option ${opt.isCorrect ? 'correct' : ''}`}
          >
            <span className="option-letter">{opt.letter}</span>
            <span className="option-text">{opt.text}</span>
            {opt.isCorrect && <span className="correct-badge">✓ Correct</span>}
          </div>
        ))}
      </div>

      <div className="qpc-marking">
        {!editing ? (
          <>
            <div className="marking-info">
              <span>Points: <strong>{marking?.points || 1}</strong></span>
              <span>Negative: <strong>{marking?.negativeMark || 0}</strong></span>
              {marking?.partialCredit && <span className="badge">Partial Credit</span>}
            </div>
            <button className="btn-sm" onClick={onEdit}>Edit Marking</button>
          </>
        ) : (
          <MarkingEditor marking={updatedMarking} onSave={handleSaveMarking} />
        )}
      </div>
    </motion.div>
  );
};

const MarkingEditor = ({ marking, onSave }) => {
  const [points, setPoints] = useState(marking?.points || 1);
  const [negativeMark, setNegativeMark] = useState(marking?.negativeMark || 0);

  return (
    <div className="marking-editor">
      <div className="input-group">
        <label>Points</label>
        <input type="number" step="0.25" value={points} onChange={(e) => setPoints(parseFloat(e.target.value))} />
      </div>
      <div className="input-group">
        <label>Negative Mark</label>
        <input type="number" step="0.25" value={negativeMark} onChange={(e) => setNegativeMark(parseFloat(e.target.value))} />
      </div>
      <button className="btn-sm btn-primary" onClick={onSave}>
        <Save size={16} /> Save
      </button>
    </div>
  );
};

export default ExamPreview;
