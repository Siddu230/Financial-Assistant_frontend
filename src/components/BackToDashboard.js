// src/components/BackToDashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackToDashboard({ style }) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: 16, textAlign: 'left', ...style }}>
      <button
        className="side-btn" // smaller button style (like your sidebar buttons)
        style={{ padding: '6px 12px', fontSize: '14px' }}
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
