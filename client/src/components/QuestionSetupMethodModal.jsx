import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool } from 'lucide-react';

const QuestionSetupMethodModal = ({ onMethodSelect, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = () => {
    setSubmitting(true);
    onMethodSelect('own');
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
          Create Your Exam Questions
        </h2>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          Add questions manually to build your exam with complete flexibility and customization.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Create Your Own Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              border: '2px solid #7c3aed',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              background: '#f3e8ff',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: '#7c3aed',
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
                  Write questions manually for your exam with full control over content and structure.
                </p>

                <div style={{
                  background: '#ede9fe',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  color: '#6d28d9'
                }}>
                  ✓ Full flexibility & customization
                  <br />
                  ✓ Add multiple-choice questions
                  <br />
                  ✓ Control exam structure and flow
                </div>
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
            disabled={submitting}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: '#7c3aed',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.target.style.background = '#6d28d9';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#7c3aed';
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
