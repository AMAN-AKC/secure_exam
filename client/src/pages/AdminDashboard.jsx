import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard(){
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const load = async () => { const { data } = await api.get('/admin/exams'); setExams(data); };
  useEffect(()=>{ load(); }, []);
  const setStatus = async (examId, status) => { await api.patch(`/admin/exams/${examId}/status`, { status }); await load(); };
  return (
    <div className="container stack">
      <div className="card">
        <h2 className="section-title">Admin Dashboard</h2>
        <div className="muted">Welcome back, {user?.name || user?.email} ({user?.role?.toUpperCase()}) <button className="btn secondary" onClick={logout} style={{ marginLeft:8 }}>Logout</button></div>
      </div>
      <div className="card">
        <ul className="list">
          {exams.map(e=> (
            <li key={e._id}>
              <span><b>{e.title}</b> � <span className="tag">{e.status}</span> � by {e.createdBy?.email}</span>
              <span className="actions">
                <button className="btn success" onClick={()=>setStatus(e._id,'approved')}>Approve</button>
                <button className="btn danger" onClick={()=>setStatus(e._id,'rejected')}>Reject</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
