import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [output, setOutput] = useState('Click a button above to view database contents or perform actions...');
  const [examIdInput, setExamIdInput] = useState('');

  const viewData = async (endpoint) => {
    setOutput('Loading...');
    try {
      const { data } = await api.get(`/debug/${endpoint}`);
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const viewPendingExams = async () => {
    setOutput('Loading pending exams...');
    try {
      const { data } = await api.get('/debug/pending-exams');

      if (data.length === 0) {
        setOutput('✅ No pending exams to approve.');
        return;
      }

      let outputText = `📋 PENDING EXAMS (${data.length} total)\n\n`;

      data.forEach((exam, index) => {
        const status = exam.isExpired ? '❌ EXPIRED' : '⏳ PENDING';
        outputText += `${index + 1}. ${exam.title}\n`;
        outputText += `   Status: ${status}\n`;
        outputText += `   Teacher: ${exam.createdBy.name} (${exam.createdBy.email})\n`;
        
        // Helper function to format UTC date to IST (24-hour format)
        const formatUTCToIST = (utcDate) => {
          if (!utcDate) return 'N/A';
          const date = new Date(utcDate);
          const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
          // Use getUTC* methods because istDate is still in UTC, we just adjusted the timestamp
          const day = String(istDate.getUTCDate()).padStart(2, '0');
          const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
          const year = istDate.getUTCFullYear();
          const hours = String(istDate.getUTCHours()).padStart(2, '0');
          const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
          const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
          return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
        };
        
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
  };

  const approveAllPendingExams = async () => {
    if (!window.confirm('Approve ALL eligible pending exams? Expired exams will be marked as expired.')) {
      return;
    }

    setOutput('Processing all pending exams...');

    try {
      const { data: exams } = await api.get('/debug/pending-exams');

      if (exams.length === 0) {
        setOutput('✅ No pending exams to process.');
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
  };

  const validateBlockchain = async () => {
    if (!examIdInput.trim()) {
      alert('Please enter an Exam ID first! Get it from "All Exams" button.');
      return;
    }

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
  };

  const clearTestData = async () => {
    if (!window.confirm('Clear all test data? This will remove users with "test" or "debug" in their email.')) {
      return;
    }

    setOutput('Clearing test data...');

    try {
      const { data } = await api.delete('/debug/clear-test-data');
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const resetDatabase = async () => {
    const confirmed = window.confirm(
      '🚨 DANGER: This will delete ALL data from the database!\n\nThis includes:\n- All users\n- All exams\n- All registrations\n- All results\n\nAre you absolutely sure?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm('This action cannot be undone. Click OK if you want to proceed.');
    if (!doubleConfirm) return;

    setOutput('Resetting database... This may take a moment.');

    try {
      const { data } = await api.delete('/debug/reset-database');
      setOutput(`✅ Database Reset Complete!\n\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <h1>🗄️ Secure Exam Admin Dashboard</h1>

        <div className="admin-header">
          <span>Welcome, {user?.name || user?.email} ({user?.role?.toUpperCase()})</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>

        <div className="admin-section">
          <h3>📊 View Database Contents</h3>
          <button className="view-btn" onClick={() => viewData('stats')}>
            Database Statistics
          </button>
          <button className="view-btn" onClick={() => viewData('users')}>
            All Users
          </button>
          <button className="view-btn" onClick={() => viewData('exams')}>
            All Exams
          </button>
          <button className="view-btn" onClick={() => viewData('registrations')}>
            Registrations
          </button>
          <button className="view-btn" onClick={() => viewData('results')}>
            Results
          </button>
        </div>

        <div className="admin-section">
          <h3>✅ Approve Exams</h3>
          <button className="view-btn" onClick={viewPendingExams}>
            📋 View Pending Exams
          </button>
          <button className="view-btn" onClick={approveAllPendingExams}>
            ✅ Approve All Eligible
          </button>
        </div>

        <div className="admin-section">
          <h3>🔍 Blockchain Security Demo</h3>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="examIdInput" style={{ display: 'block', marginBottom: '5px' }}>
              Exam ID for Tampering Demo:
            </label>
            <input
              type="text"
              id="examIdInput"
              placeholder="Enter exam ID (get from 'All Exams')"
              value={examIdInput}
              onChange={(e) => setExamIdInput(e.target.value)}
              className="exam-id-input"
            />
          </div>
          <button className="view-btn" onClick={validateBlockchain}>
            🔍 Validate Blockchain Integrity
          </button>
          <button className="tamper-btn" onClick={tamperWithExam}>
            🚨 Simulate Hacker Attack (Tamper)
          </button>
          <div className="warning-box">
            <strong>🎯 Demo Instructions:</strong><br />
            1. First create and finalize an exam as teacher<br />
            2. Get the exam ID from "All Exams" button above<br />
            3. Validate blockchain - should show "VALID"<br />
            4. Simulate tampering - corrupts the blockchain<br />
            5. Validate again - should show "COMPROMISED"
          </div>
        </div>

        <div className="admin-section">
          <h3>🧹 Database Cleanup</h3>
          <div className="warning-box">
            <strong>⚠️ Warning:</strong> These actions will permanently delete data. Make sure this is what you want!
          </div>
          <button className="danger-btn" onClick={clearTestData}>
            Clear Test Data
          </button>
          <button className="reset-btn" onClick={resetDatabase}>
            🚨 RESET ENTIRE DATABASE
          </button>
        </div>

        <div className="output-box">
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
}
