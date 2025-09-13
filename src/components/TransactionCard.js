import React from 'react';
import API from '../api';

export default function TransactionCard({ tx, onDeleted }) {
  const handleDelete = async () => {
    const ok = window.confirm('Delete this transaction? This cannot be undone.');
    if (!ok) return;
    try {
      await API.delete(`/transactions/${tx._id}`);
      // inform parent to refresh (if provided)
      if (onDeleted) onDeleted(tx._id);
    } catch (err) {
      console.error('Delete error', err);
      const msg = err?.response?.data?.message || 'Failed to delete';
      alert(msg);
    }
  };

  return (
    <tr>
      <td>{new Date(tx.date).toLocaleDateString()}</td>
      <td>{tx.category}</td>
      <td><span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>{tx.type.toUpperCase()}</span></td>
      <td style={{textAlign:'right'}}>{tx.type === 'income' ? `₹${tx.amount.toFixed(2)}` : `₹${tx.amount.toFixed(2)}`}</td>
      <td style={{paddingLeft:12}}>
        <button
          onClick={handleDelete}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'tomato',
            padding: '6px 10px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
