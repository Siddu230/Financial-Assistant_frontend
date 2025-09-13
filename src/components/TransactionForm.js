// src/components/TransactionForm.js
import React, { useState } from 'react';
import API from '../api';

export default function TransactionForm({ onSaved }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // default lowercase
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(''); // store YYYY-MM-DD from input[type=date]
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // helper: convert date input (YYYY-MM-DD) to ISO string (with time)
  function toIsoDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    // create Date at local midnight, then convert to ISO
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date().toISOString();
    const [y, m, d] = parts.map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toISOString();
  }

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    // basic client-side validation
    if (!amount || isNaN(Number(amount))) {
      setMsg('Enter a valid numeric amount.');
      return;
    }
    if (!['income', 'expense'].includes(type)) {
      setMsg('Select a valid transaction type.');
      return;
    }

    const payload = {
      amount: Number(amount),
      type: type, // must be exactly 'income' or 'expense'
      category: category || 'uncategorized',
      date: toIsoDate(date),
      description: desc || ''
    };

    setLoading(true);
    try {
      const res = await API.post('/transactions', payload);
      setMsg('Saved');
      setAmount('');
      setCategory('');
      setDate('');
      setDesc('');
      onSaved && onSaved(res.data);
    } catch (err) {
      // show a better error message from server if available
      const serverMsg = err?.response?.data?.message || err.message || 'Error saving';
      setMsg(`Error saving: ${serverMsg}`);
      console.error('Transaction save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding:10}}>
      <h3 style={{marginBottom:12}}>Create a New Transaction</h3>
      <form onSubmit={submit}>
        <input
          className="input"
          placeholder="Amount (e.g., 500.00)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />

        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ color: 'white' }}
        >
          <option style={{ color: 'black' }} value="expense">Expense</option>
          <option style={{ color: 'black' }} value="income">Income</option>
        </select>

        <input
          className="input"
          placeholder="Category (e.g., food, shopping)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* native date picker */}
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={(e) => e.preventDefault()} // Prevent keyboard input
          min="2020-01-01"
          max={new Date().toISOString().split('T')[0]}
          required
        />

        <input
          className="input"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Submit Transaction'}
        </button>
      </form>

      {msg && <div style={{marginTop:12, color: msg.startsWith('Error') ? 'tomato' : 'lightgreen'}}>{msg}</div>}
    </div>
  );
}
