import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function TeacherDashboard(){
  const { user, logout } = useAuth();
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['','','','']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [exams, setExams] = useState([]);
  const [resultsByExam, setResultsByExam] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState(null);
  const [examSettings, setExamSettings] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    availableFrom: '',
    availableTo: '',
    examStartTime: '',
    examEndTime: '',
    allowLateEntry: false,
    shuffleQuestions: false,
    showResults: true
  });

  const load = async () => { 
    try {
      setLoading(true);
      const { data } = await api.get('/teacher/exams'); 
      setExams(data); 
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, []);

  const createExam = async () => { 
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const { data } = await api.post('/teacher/exams', { title }); 
      setExam(data);
      setExamSettings(prev => ({ ...prev, title, description: '' }));
      setTitle(''); 
      setShowSettingsModal(true);
    } catch (error) {
      alert('Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const updateExamSettings = async () => {
    if (!exam) return;
    try {
      const { data } = await api.put(`/teacher/exams/${exam._id}/settings`, examSettings);
      setExam(data);
      setShowSettingsModal(false);
      setShowQuestionModal(true);
    } catch (error) {
      alert('Failed to update exam settings');
    }
  };

  const openSettingsModal = (examItem) => {
    setExam(examItem);
    setExamSettings({
      title: examItem.title || '',
      description: examItem.description || '',
      durationMinutes: examItem.durationMinutes || 60,
      availableFrom: examItem.availableFrom ? new Date(examItem.availableFrom).toISOString().slice(0, 16) : '',
      availableTo: examItem.availableTo ? new Date(examItem.availableTo).toISOString().slice(0, 16) : '',
      examStartTime: examItem.examStartTime ? new Date(examItem.examStartTime).toISOString().slice(0, 16) : '',
      examEndTime: examItem.examEndTime ? new Date(examItem.examEndTime).toISOString().slice(0, 16) : '',
      allowLateEntry: examItem.allowLateEntry || false,
      shuffleQuestions: examItem.shuffleQuestions || false,
      showResults: examItem.showResults !== false
    });
    setShowSettingsModal(true);
  };

  const addQuestion = async () => { 
    if (!text.trim() || options.some(opt => !opt.trim())) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await api.post(`/teacher/exams/${exam._id}/questions`, { 
        text, 
        options, 
        correctIndex: Number(correctIndex) 
      }); 
      setText(''); 
      setOptions(['','','','']); 
      setCorrectIndex(0); 
      await load(); 
    } catch (error) {
      alert('Failed to add question');
    }
  };

  const finalize = async () => { 
    if (!window.confirm('Are you sure you want to finalize this exam? You won\'t be able to edit it anymore.')) {
      return;
    }
    try {
      await api.post(`/teacher/exams/${exam._id}/finalize`); 
      setExam(null); 
      setShowQuestionModal(false);
      await load(); 
      alert('Exam finalized successfully!');
    } catch (error) {
      alert('Failed to finalize exam');
    }
  };

  const fetchResults = async (examId, examTitle) => {
    try {
      const { data } = await api.get(`/teacher/exams/${examId}/results`);
      setResultsByExam(prev => ({ ...prev, [examId]: data }));
      setSelectedExamResults({ examId, examTitle, results: data });
      setShowResultsModal(true);
    } catch (error) {
      alert('Failed to fetch results');
    }
  };

  const openQuestionModal = () => {
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    if (exam && exam.questions.length === 0) {
      setExam(null); // Close draft if no questions added
    }
  };

  const currentQuestionNumber = (exam && exam.questions ? exam.questions.length + 1 : (exams.find(e=>e._id===exam?._id)?.questions?.length || 0) + 1);

  if (loading) {
    return (
      <div className="container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container stack">
      {/* Header */}
      <Card
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${user?.name || user?.email}`}
        variant="gradient"
        headerAction={
          <Button variant="secondary" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </Button>
        }
      >
        <div className="flex gap-4">
          <div className="progress-stat">
            <div className="progress-stat-number">{exams.length}</div>
            <div className="progress-stat-label">Total Exams</div>
          </div>
          <div className="progress-stat">
            <div className="progress-stat-number">{exams.filter(e => e.status === 'draft').length}</div>
            <div className="progress-stat-label">Drafts</div>
          </div>
          <div className="progress-stat">
            <div className="progress-stat-number">{exams.filter(e => e.status === 'approved').length}</div>
            <div className="progress-stat-label">Active</div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card
        title="Quick Actions"
        subtitle="Create and manage your examinations"
      >
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="form-label">Exam Title</label>
            <input 
              className="input" 
              placeholder="Enter exam title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createExam()}
            />
          </div>
          <Button 
            variant="primary" 
            loading={submitting}
            onClick={createExam}
            disabled={!title.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Exam
          </Button>
        </div>
      </Card>

      {/* My Exams */}
      <Card
        title="My Examinations"
        subtitle="Manage and track your created exams"
      >
        {exams.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="mb-4 text-4xl">📝</div>
            <p>No exams created yet. Create your first exam to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map(examItem => {
              const statusColors = {
                draft: 'badge-warning',
                pending: 'badge-primary', 
                approved: 'badge-success',
                rejected: 'badge-danger'
              };
              
              return (
                <div key={examItem._id} className="border border-border rounded-lg p-4 hover:border-brand transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{examItem.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span>📊 Questions: {examItem.questions?.length || 0}</span>
                        <span>⏱️ Duration: {examItem.durationMinutes || 60}min</span>
                        <span>📅 Created: {new Date(examItem.createdAt).toLocaleDateString()}</span>
                        <span className={`badge ${statusColors[examItem.status]}`}>
                          {examItem.status.toUpperCase()}
                        </span>
                      </div>
                      {examItem.description && (
                        <p className="text-sm text-muted mt-2">{examItem.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {examItem.status === 'draft' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="small"
                            onClick={() => openSettingsModal(examItem)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Settings
                          </Button>
                          <Button 
                            variant="outline" 
                            size="small"
                            onClick={() => {
                              setExam(examItem);
                              openQuestionModal();
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Questions
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => fetchResults(examItem._id, examItem.title)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M9 17H7A5 5 0 017 7h2m0 10v-5a5 5 0 011-3m0 8h2a5 5 0 005-5v-2a5 5 0 00-1-3m-4 10v-5a5 5 0 011-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Results
                      </Button>
                    </div>
                  </div>
                  
                  {examItem.questions && examItem.questions.length > 0 && (
                    <div className="text-sm text-muted">
                      Recent questions: {examItem.questions.slice(0, 2).map(q => q.text).join(', ')}
                      {examItem.questions.length > 2 && '...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Question Creation Modal */}
      <Modal
        isOpen={showQuestionModal}
        onClose={closeQuestionModal}
        title={`Add Questions to: ${exam?.title}`}
        size="large"
      >
        {exam && (
          <div className="space-y-6">
            <div className="bg-panel-light p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Current Progress</span>
                <span className="text-sm text-muted">Question #{currentQuestionNumber}</span>
              </div>
              <div className="text-sm text-muted">
                {exam.questions?.length || 0} questions added
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text</label>
              <textarea 
                className="input" 
                placeholder="Enter your question..." 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Answer Options</label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 border-2 rounded-full text-sm font-semibold" 
                         style={{ 
                           borderColor: correctIndex === index ? 'var(--success)' : 'var(--border)',
                           backgroundColor: correctIndex === index ? 'var(--success-light)' : 'transparent',
                           color: correctIndex === index ? 'var(--success)' : 'var(--text-secondary)'
                         }}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <input 
                      className="input flex-1" 
                      placeholder={`Option ${index + 1}`} 
                      value={option} 
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }} 
                    />
                    <Button
                      variant={correctIndex === index ? "success" : "outline"}
                      size="small"
                      onClick={() => setCorrectIndex(index)}
                    >
                      {correctIndex === index ? "✓ Correct" : "Mark Correct"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="text-sm text-muted">
                {exam.questions?.length || 0} questions added so far
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeQuestionModal}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={addQuestion}
                  disabled={!text.trim() || options.some(opt => !opt.trim())}
                >
                  Add Question
                </Button>
                {(exam.questions?.length || 0) > 0 && (
                  <Button variant="success" onClick={finalize}>
                    Finalize Exam
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Results Modal */}
      <Modal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        title={`Results for: ${selectedExamResults?.examTitle}`}
        size="large"
      >
        {selectedExamResults && (
          <div>
            {selectedExamResults.results.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <div className="mb-4 text-4xl">📊</div>
                <p>No submissions yet for this exam.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-panel-light p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-brand">{selectedExamResults.results.length}</div>
                      <div className="text-sm text-muted">Total Submissions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">
                        {Math.round(selectedExamResults.results.reduce((acc, r) => acc + (r.score / r.total * 100), 0) / selectedExamResults.results.length)}%
                      </div>
                      <div className="text-sm text-muted">Average Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-warning">
                        {Math.max(...selectedExamResults.results.map(r => r.score / r.total * 100)).toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted">Highest Score</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedExamResults.results.map(result => {
                    const percentage = Math.round((result.score / result.total) * 100);
                    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                    const badgeVariant = percentage >= 70 ? 'badge-success' : percentage >= 60 ? 'badge-warning' : 'badge-danger';
                    
                    return (
                      <div key={result.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{result.student?.name || result.student?.email}</h4>
                          <div className="text-sm text-muted">{result.student?.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold">{result.score}/{result.total}</div>
                              <div className="text-sm text-muted">{percentage}%</div>
                            </div>
                            <span className={`badge ${badgeVariant}`}>{grade}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Exam Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={`Exam Settings: ${examSettings.title}`}
        size="large"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input 
                className="input" 
                value={examSettings.title} 
                onChange={(e) => setExamSettings(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter exam title..."
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea 
                className="input" 
                value={examSettings.description} 
                onChange={(e) => setExamSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the exam content, instructions, or requirements..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Exam Duration (Minutes)</label>
              <input 
                className="input" 
                type="number"
                min="5"
                max="300"
                value={examSettings.durationMinutes} 
                onChange={(e) => setExamSettings(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
              />
              <div className="text-sm text-muted mt-1">
                How long students have to complete the exam (5-300 minutes)
              </div>
            </div>
          </div>

          {/* Availability Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Availability Schedule</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Available From</label>
                <input 
                  className="input" 
                  type="datetime-local"
                  value={examSettings.availableFrom} 
                  onChange={(e) => setExamSettings(prev => ({ ...prev, availableFrom: e.target.value }))}
                />
                <div className="text-sm text-muted mt-1">When students can start registering</div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Available Until</label>
                <input 
                  className="input" 
                  type="datetime-local"
                  value={examSettings.availableTo} 
                  onChange={(e) => setExamSettings(prev => ({ ...prev, availableTo: e.target.value }))}
                />
                <div className="text-sm text-muted mt-1">Registration deadline</div>
              </div>
            </div>
          </div>

          {/* Fixed Schedule (Optional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Fixed Schedule (Optional)</h3>
            <div className="text-sm text-muted mb-3">
              If set, all students must take the exam at the same time. Leave empty for flexible scheduling.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Exam Start Time</label>
                <input 
                  className="input" 
                  type="datetime-local"
                  value={examSettings.examStartTime} 
                  onChange={(e) => setExamSettings(prev => ({ ...prev, examStartTime: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Exam End Time</label>
                <input 
                  className="input" 
                  type="datetime-local"
                  value={examSettings.examEndTime} 
                  onChange={(e) => setExamSettings(prev => ({ ...prev, examEndTime: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Exam Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Exam Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={examSettings.allowLateEntry}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, allowLateEntry: e.target.checked }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Allow Late Entry</div>
                  <div className="text-sm text-muted">Students can join up to 15 minutes after scheduled start</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={examSettings.shuffleQuestions}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Shuffle Questions</div>
                  <div className="text-sm text-muted">Randomize question order for each student</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={examSettings.showResults}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, showResults: e.target.checked }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Show Results to Students</div>
                  <div className="text-sm text-muted">Students can see their scores after submission</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={updateExamSettings}
              disabled={!examSettings.title.trim()}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
