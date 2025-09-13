// src/pages/UploadReceiptPage.js
import React from 'react';
import BackToDashboard from '../components/BackToDashboard';
import UploadCard from '../components/UploadCard';
import '../index.css';

export default function UploadReceiptPage() {
  return (
    <div style={{ padding: 24 }}>
      {/* Back button */}
      <BackToDashboard />

      <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h3>Upload Receipt</h3>
        <UploadCard onSaved={() => window.location.href = '/'} />
      </div>
    </div>
  );
}
