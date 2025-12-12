import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Database } from 'lucide-react';

const QuestionSetupMethodModal = ({ onMethodSelect, onCancel }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = () => {
    if (!selectedMethod) return;
    setSubmitting(true);
    onMethodSelect(selectedMethod);
    setSubmitting(false);
  };

  return (
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
      zIndex: 60
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: '#1f2937'
        }}>
          How would you like to add questions?
        </h2>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          Choose how you'd like to build your exam. You can mix manual + QB questions only in "Create Your Own" mode.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Option 1: Create Your Own */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedMethod('own')}
            style={{
              border: selectedMethod === 'own' ? '2px solid #7c3aed' : '2px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              background: selectedMethod === 'own' ? '#f3e8ff' : 'white',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: selectedMethod === 'own' ? '#7c3aed' : '#e5e7eb',
                color: 'white',
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <PenTool size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Create Your Own Questions
                </h3>

                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem',
                  lineHeight: '1.6'
                }}>
                  Write questions manually for your exam.
                </p>

                <div style={{
                  background: selectedMethod === 'own' ? '#ede9fe' : '#f3f4f6',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  color: selectedMethod === 'own' ? '#6d28d9' : '#6b7280'
                }}>
                  ✓ Can also add questions from Question Bank
                  <br />
                  ✓ Mix manual + QB questions
                  <br />
                  ✓ Full flexibility & customization
                </div>
              </div>

              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: selectedMethod === 'own' ? '2px solid #7c3aed' : '2px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedMethod === 'own' ? '#7c3aed' : 'white',
                flexShrink: 0
              }}>
                {selectedMethod === 'own' && (
                  <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Option 2: Question Bank Only */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedMethod('bank')}
            style={{
              border: selectedMethod === 'bank' ? '2px solid #10b981' : '2px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              background: selectedMethod === 'bank' ? '#f0fdf4' : 'white',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: selectedMethod === 'bank' ? '#10b981' : '#e5e7eb',
                color: 'white',
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Database size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Select from Question Bank Only
                </h3>

                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem',
                  lineHeight: '1.6'
                }}>
                  Choose from pre-built approved questions.
                </p>

                <div style={{
                  background: selectedMethod === 'bank' ? '#ecfdf5' : '#f3f4f6',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  color: selectedMethod === 'bank' ? '#047857' : '#6b7280'
                }}>
                  ✓ Fast & quick setup
                  <br />
                  ✓ Use pre-approved questions
                  <br />
                  ✗ Cannot add manual questions
                </div>
              </div>

              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: selectedMethod === 'bank' ? '2px solid #10b981' : '2px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedMethod === 'bank' ? '#10b981' : 'white',
                flexShrink: 0
              }}>
                {selectedMethod === 'bank' && (
                  <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

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
                e.target.style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedMethod || submitting}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: !selectedMethod || submitting ? 'not-allowed' : 'pointer',
              background: selectedMethod ? '#7c3aed' : '#d1d5db',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (selectedMethod && !submitting) {
                e.target.style.background = '#6d28d9';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedMethod) {
                e.target.style.background = '#7c3aed';
              }
            }}
          >
            {submitting ? 'Loading...' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestionSetupMethodModal;
