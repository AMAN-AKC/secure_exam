import React, { useState } from 'react';
import api from '../api.js';

const AuthDebugger = () => {
  const [testEmail, setTestEmail] = useState('debug@example.com');
  const [testPassword, setTestPassword] = useState('test123');
  const [results, setResults] = useState([]);

  const addResult = (action, success, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { timestamp, action, success, data }]);
  };

  const testRegister = async () => {
    try {
      console.log('Testing registration...');
      const response = await api.post('/auth/register', {
        name: 'Debug User',
        email: testEmail,
        password: testPassword,
        role: 'student'
      });
      addResult('Register', true, response.data);
    } catch (error) {
      console.error('Register error:', error);
      addResult('Register', false, error.response?.data || error.message);
    }
  };

  const testLogin = async () => {
    try {
      console.log('Testing login...');
      const response = await api.post('/auth/login', {
        email: testEmail,
        password: testPassword
      });
      addResult('Login', true, response.data);
    } catch (error) {
      console.error('Login error:', error);
      addResult('Login', false, error.response?.data || error.message);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'var(--panel)', 
      border: '1px solid var(--border)', 
      borderRadius: '8px', 
      padding: '16px', 
      maxWidth: '400px', 
      zIndex: 9999,
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>Auth Debugger</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <input 
          value={testEmail} 
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Test email"
          style={{ 
            width: '100%', 
            marginBottom: '8px', 
            padding: '8px', 
            border: '1px solid var(--border)', 
            borderRadius: '4px',
            background: 'var(--bg)',
            color: 'var(--text)'
          }}
        />
        <input 
          value={testPassword} 
          onChange={(e) => setTestPassword(e.target.value)}
          placeholder="Test password"
          type="password"
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid var(--border)', 
            borderRadius: '4px',
            background: 'var(--bg)',
            color: 'var(--text)'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={testRegister} style={{ 
          padding: '8px 12px', 
          background: 'var(--success)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Test Register
        </button>
        <button onClick={testLogin} style={{ 
          padding: '8px 12px', 
          background: 'var(--brand)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Test Login
        </button>
        <button onClick={clearResults} style={{ 
          padding: '8px 12px', 
          background: 'var(--danger)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Clear
        </button>
      </div>

      <div style={{ fontSize: '12px' }}>
        {results.map((result, index) => (
          <div key={index} style={{ 
            marginBottom: '8px', 
            padding: '8px', 
            background: result.success ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1px solid ${result.success ? 'var(--success)' : 'var(--danger)'}`,
            borderRadius: '4px',
            color: result.success ? 'var(--success)' : 'var(--danger)'
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {result.timestamp} - {result.action}: {result.success ? '✅' : '❌'}
            </div>
            <pre style={{ margin: '4px 0 0 0', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugger;