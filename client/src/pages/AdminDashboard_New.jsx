import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

dayjs.extend(utc);

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [output, setOutput] = useState('Click a button to view database contents or perform actions...');
  const [examIdInput, setExamIdInput] = useState('');
  const [loading, setLoading] = useState(false);

  const viewData = async (endpoint) => {
    setLoading(true);
    setOutput('Loading...');
    try {
      const { data } = await api.get(`/debug/${endpoint}`);
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const viewPendingExams = async () => {
    setLoading(true);
    setOutput('Loading pending exams...');
    try {
      const { data } = await api.get('/debug/pending-exams');

      if (data.length === 0) {
        setOutput('✅ No pending exams to approve.');
        setLoading(false);
        return;
      }

      let outputText = `📋 PENDING EXAMS (${data.length} total)\n\n`;

      // Helper function to format UTC date to IST (24-hour format)
      const formatUTCToIST = (utcDate) => {
        if (!utcDate) return 'N/A';
        // Use dayjs with UTC mode, then add 5:30 hours for IST
        const dayjsUtc = dayjs(utcDate).utc();
        const istTime = dayjsUtc.add(5, 'hour').add(30, 'minute');
        return istTime.format('DD/MM/YYYY, HH:mm:ss');
      };

      data.forEach((exam, index) => {
        const status = exam.isExpired ? '❌ EXPIRED' : '⏳ PENDING';
        outputText += `${index + 1}. ${exam.title}\n`;
        outputText += `   Status: ${status}\n`;
        outputText += `   Teacher: ${exam.createdBy.name} (${exam.createdBy.email})\n`;
        outputText += `   Created: ${formatUTCToIST(exam.createdAt)}\n`;

        if (exam.availableFrom) {
          outputText += `   Registration: ${formatUTCToIST(exam.availableFrom)}`;
          if (exam.availableTo) {
            outputText += ` - ${formatUTCToIST(exam.availableTo)}`;
          }
          outputText += '\n';
        }

        if (exam.examStartTime) {
          outputText += `   Exam Time: ${formatUTCToIST(exam.examStartTime)} - ${formatUTCToIST(exam.examEndTime)}\n`;
        }

        if (exam.expiryReason) {
          outputText += `   ⚠️ Cannot Approve: ${exam.expiryReason}\n`;
        }

        outputText += `   Questions: ${exam.questions?.length || 0}\n`;
        outputText += `   Duration: ${exam.durationMinutes} minutes\n\n`;
      });

      setOutput(outputText + '\n\n' + JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const approveAllPendingExams = async () => {
    if (!window.confirm('Approve ALL eligible pending exams? Expired exams will be marked as expired.')) {
      return;
    }

    setLoading(true);
    setOutput('Processing all pending exams...');

    try {
      const { data: exams } = await api.get('/debug/pending-exams');

      if (exams.length === 0) {
        setOutput('✅ No pending exams to process.');
        setLoading(false);
        return;
      }

      let results = [];

      for (const exam of exams) {
        try {
          const { data: statusData } = await api.patch(`/debug/exam-status/${exam._id}`, {
            status: exam.isExpired ? 'expired' : 'approved',
          });

          results.push(`✅ ${exam.isExpired ? 'Expired' : 'Approved'}: "${exam.title}"`);
        } catch (err) {
          results.push(`❌ Failed: "${exam.title}" - ${err.response?.data?.error || err.message}`);
        }
      }

      setOutput(`📋 BATCH PROCESSING COMPLETE\n\n${results.join('\n')}\n\n🔄 Refresh "View Pending Exams" to see updated status.`);
    } catch (error) {
      setOutput(`❌ Error processing exams: ${error.message}`);
    }
    setLoading(false);
  };

  const validateBlockchain = async () => {
    if (!examIdInput.trim()) {
      alert('Please enter an Exam ID first! Get it from "All Exams" button.');
      return;
    }

    setLoading(true);
    setOutput('🔍 Validating blockchain integrity...');

    try {
      const { data } = await api.get(`/debug/validate-blockchain/${examIdInput}`);

      let statusIcon = data.blockchainStatus === 'VALID' ? '✅' : '🚨';
      let result = `${statusIcon} BLOCKCHAIN STATUS: ${data.blockchainStatus}\n\n`;
      result += `📊 Validation Summary:\n`;
      result += `- Total Chunks: ${data.totalChunks}\n`;
      result += `- Valid Chunks: ${data.validChunks}\n`;
      result += `- Invalid Chunks: ${data.invalidChunks}\n\n`;
      result += `🔒 Security Assessment:\n${data.securityAssessment}\n\n`;
      result += `📋 Detailed Results:\n${JSON.stringify(data, null, 2)}`;

      setOutput(result);
    } catch (error) {
      setOutput(`❌ Error validating blockchain: ${error.message}`);
    }
    setLoading(false);
  };

  const tamperWithExam = async () => {
    if (!examIdInput.trim()) {
      alert('Please enter an Exam ID first! Get it from "All Exams" button.');
      return;
    }

    const confirmed = window.confirm(
      '🚨 SIMULATE HACKER ATTACK 🚨\n\nThis will:\n- Corrupt encrypted exam data\n- Break the blockchain hash chain\n- Demonstrate tamper detection\n\nProceed with simulation?'
    );

    if (!confirmed) return;

    setLoading(true);
    setOutput('🚨 Simulating hacker attack - corrupting blockchain...');

    try {
      const { data } = await api.post(`/debug/tamper-exam/${examIdInput}`);

      let result = `🚨 HACKER ATTACK SIMULATED!\n\n`;
      result += `💥 Tampering Details:\n`;
      result += `- Target: Chunk ${data.tamperingDetails.chunkIndex + 1}\n`;
      result += `- Status: ${data.tamperingDetails.integrityStatus}\n`;
      result += `- Original Data: ${data.tamperingDetails.originalCipherText}\n`;
      result += `- Corrupted Data: ${data.tamperingDetails.tamperedCipherText}\n\n`;
      result += `⛓️ Blockchain Comparison:\n`;
      result += `BEFORE (Original):\n${data.originalBlockchain.map(c => `Chunk ${c.index}: ${c.hash} <- ${c.prevHash}`).join('\n')}\n\n`;
      result += `AFTER (Tampered):\n${data.tamperedBlockchain.map(c => `Chunk ${c.index}: ${c.hash} <- ${c.prevHash}`).join('\n')}\n\n`;
      result += `🔍 Now click "Validate Blockchain Integrity" to see the security breach detection!\n\n`;
      result += JSON.stringify(data, null, 2);

      setOutput(result);
    } catch (error) {
      setOutput(`❌ Error simulating tampering: ${error.message}`);
    }
    setLoading(false);
  };

  const clearTestData = async () => {
    if (!window.confirm('Clear all test data? This will remove users with "test" or "debug" in their email.')) {
      return;
    }

    setLoading(true);
    setOutput('Clearing test data...');

    try {
      const { data } = await api.delete('/debug/clear-test-data');
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const resetDatabase = async () => {
    const confirmed = window.confirm(
      '🚨 DANGER: This will delete ALL data from the database!\n\nThis includes:\n- All users\n- All exams\n- All registrations\n- All results\n\nAre you absolutely sure?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm('This action cannot be undone. Click OK if you want to proceed.');
    if (!doubleConfirm) return;

    setLoading(true);
    setOutput('Resetting database... This may take a moment.');

    try {
      const { data } = await api.delete('/debug/reset-database');
      setOutput(`✅ Database Reset Complete!\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(230, 230, 250, 0.4) 0%,
          rgba(255, 218, 224, 0.3) 25%,
          rgba(200, 180, 230, 0.3) 50%,
          rgba(255, 245, 220, 0.3) 75%,
          rgba(216, 191, 216, 0.3) 100%
        ),
        radial-gradient(circle at 20% 30%, rgba(147, 112, 219, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(186, 85, 211, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(221, 160, 221, 0.1) 0%, transparent 70%)
      `,
      backgroundAttachment: 'fixed',
      overflow: 'auto',
      padding: '2rem',
      position: 'relative'
    }}>
      <style>{`
        @keyframes wave {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(20px); }
          75% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        @keyframes wave2 {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(-10px); }
          50% { transform: translateY(-30px) translateX(-20px); }
          75% { transform: translateY(-15px) translateX(-10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        .wave-bg::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(168, 85, 247, 0.05)" d="M0,96L288,112C576,128,1152,160,1440,165.3C1728,171,2016,149,2304,144C2592,139,2880,149,3168,149.3C3456,149,3744,139,4032,128C4320,117,4608,107,4896,112C5184,117,5472,139,5760,138.7C6048,139,6336,117,6624,112C6912,107,7200,117,7488,128C7776,139,8064,149,8352,154.7C8640,160,8928,160,9216,149.3C9504,139,9792,117,10080,112C10368,107,10656,117,10944,128C11232,139,11520,149,11808,144C12096,139,12384,117,12672,112C12960,107,13248,107,13536,112C13824,117,14112,128,14400,133.3L14688,139L14688,320L14400,320C14112,320,13824,320,13536,320C13248,320,12960,320,12672,320C12384,320,12096,320,11808,320C11520,320,11232,320,10944,320C10656,320,10368,320,10080,320C9792,320,9504,320,9216,320C8928,320,8640,320,8352,320C8064,320,7776,320,7488,320C7200,320,6912,320,6624,320C6336,320,6048,320,5760,320C5472,320,5184,320,4896,320C4608,320,4320,320,4032,320C3744,320,3456,320,3168,320C2880,320,2592,320,2304,320C2016,320,1728,320,1440,320C1152,320,576,320,288,320L0,320Z"></path></svg>');
          background-size: auto 100%;
          opacity: 0.5;
          animation: wave 15s linear infinite;
          z-index: -1;
        }
        
        .wave-bg::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(219, 112, 147, 0.04)" d="M0,64L288,80C576,96,1152,128,1440,138.7C1728,149,2016,139,2304,128C2592,117,2880,107,3168,101.3C3456,96,3744,96,4032,101.3C4320,107,4608,117,4896,122.7C5184,128,5472,128,5760,128C6048,128,6336,128,6624,122.7C6912,117,7200,107,7488,101.3C7776,96,8064,96,8352,101.3C8640,107,8928,117,9216,128C9504,139,9792,149,10080,144C10368,139,10656,117,10944,112C11232,107,11520,117,11808,122.7C12096,128,12384,128,12672,128C12960,128,13248,128,13536,122.7C13824,117,14112,107,14400,101.3L14688,96L14688,320L14400,320C14112,320,13824,320,13536,320C13248,320,12960,320,12672,320C12384,320,12096,320,11808,320C11520,320,11232,320,10944,320C10656,320,10368,320,10080,320C9792,320,9504,320,9216,320C8928,320,8640,320,8352,320C8064,320,7776,320,7488,320C7200,320,6912,320,6624,320C6336,320,6048,320,5760,320C5472,320,5184,320,4896,320C4608,320,4320,320,4032,320C3744,320,3456,320,3168,320C2880,320,2592,320,2304,320C2016,320,1728,320,1440,320C1152,320,576,320,288,320L0,320Z"></path></svg>');
          background-size: auto 100%;
          opacity: 0.4;
          animation: wave2 20s linear infinite reverse;
          z-index: -1;
        }
      `}</style>
      <div className="wave-bg" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1, paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
        {/* Top Navigation Header */}
        <nav style={{
          marginBottom: '2rem',
          padding: '1.75rem 2.5rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.25rem',
          border: '1px solid rgba(229, 231, 235, 0.6)',
          boxShadow: '0 20px 50px rgba(124, 58, 237, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left Section - Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              ⚙️
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 0.25rem',
                letterSpacing: '-0.5px'
              }}>
                SecureExam
              </h2>
              <p style={{
                fontSize: '1.05rem',
                color: '#9333ea',
                fontWeight: '700',
                margin: 0,
                letterSpacing: '0.3px'
              }}>
                Admin Dashboard
              </p>
            </div>
          </div>

          {/* Center Section - Admin Info */}
          <div style={{ textAlign: 'center', flex: 1, px: '2rem' }}>
            <p style={{
              fontSize: '1.3rem',
              color: '#64748b',
              margin: 0,
              fontWeight: '600',
              letterSpacing: '0.2px'
            }}>
              Welcome, <span style={{ 
                fontWeight: '900', 
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>{user?.name || user?.email}</span>
            </p>
          </div>

          {/* Right Section - Logout Button */}
          <button
            onClick={() => logout()}
            style={{
              padding: '0.875rem 1.75rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '0.3px',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)';
            }}
          >
            🚪 Logout
          </button>
        </nav>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* View Database Contents */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1.5rem' }}>
              📊 View Database Contents
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {[
                { label: 'Database Statistics', icon: '📈', action: () => viewData('stats') },
                { label: 'All Users', icon: '👥', action: () => viewData('users') },
                { label: 'All Exams', icon: '📝', action: () => viewData('exams') },
                { label: 'Registrations', icon: '📋', action: () => viewData('registrations') },
                { label: 'Results', icon: '🎯', action: () => viewData('results') }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.625rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.6 : 1,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Approve Exams */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1.5rem' }}>
              ✅ Approve Exams
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={viewPendingExams}
                disabled={loading}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                📋 View Pending Exams
              </button>
              <button
                onClick={approveAllPendingExams}
                disabled={loading}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                ✅ Approve All Eligible
              </button>
            </div>
          </div>

          {/* Database Cleanup */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1.5rem' }}>
              🧹 Database Cleanup
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={clearTestData}
                disabled={loading}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Clear Test Data
              </button>
              <button
                onClick={resetDatabase}
                disabled={loading}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                🚨 Reset Database
              </button>
            </div>
          </div>
        </div>

        {/* Blockchain Security Demo */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1.5rem' }}>
            🔍 Blockchain Security Demo
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Exam ID for Tampering Demo:
            </label>
            <input
              type="text"
              placeholder="Enter exam ID (get from 'All Exams')"
              value={examIdInput}
              onChange={(e) => setExamIdInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.625rem',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={validateBlockchain}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              🔍 Validate Integrity
            </button>
            <button
              onClick={tamperWithExam}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              🚨 Simulate Attack
            </button>
          </div>

          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '0.75rem',
            padding: '1rem',
            color: '#92400e',
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            <strong>🎯 Demo Instructions:</strong><br />
            1. Create and finalize an exam as teacher<br />
            2. Get the exam ID from "All Exams" button<br />
            3. Validate blockchain - should show "VALID"<br />
            4. Simulate tampering - corrupts the blockchain<br />
            5. Validate again - should show "COMPROMISED"
          </div>
        </div>

        {/* Output Box */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1rem' }}>
            📤 Output
          </h3>
          <pre style={{
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '0.625rem',
            padding: '1.5rem',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            color: '#374151',
            overflow: 'auto',
            maxHeight: '400px',
            fontFamily: 'monospace'
          }}>
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
