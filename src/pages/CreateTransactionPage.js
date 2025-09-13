// src/pages/CreateTransactionPage.js
import React from 'react';
import TransactionForm from '../components/TransactionForm'; // ensure this exists
import '../index.css';
import BackToDashboard from '../components/BackToDashboard';

export default function CreateTransactionPage(){
  return (
    <div style={{padding:24}}>
      {/* 👇 Back button goes here */}
      <BackToDashboard />

      <div className="card" style={{maxWidth:700, margin:'0 auto'}}>
        <h3>Create a New Transaction</h3>
        <TransactionForm onSaved={() => window.location.href = '/'} />
      </div>
    </div>
  );
}
