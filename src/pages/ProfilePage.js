// src/pages/ProfilePage.js
import React, { useEffect, useState, useMemo } from 'react';
import BackToDashboard from '../components/BackToDashboard';
import API from '../api';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadProfile();
    // eslint-disable-next-line
  }, []);

  async function loadTransactions() {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/transactions', { params: { page: 1, limit: 1000 } });
      setTxs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
      setError(err?.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setUserLoading(true);
    let profile = null;

    // 1) Try several usual server endpoints
    const endpoints = ['/auth/me', '/users/me', '/profile', '/api/auth/me', '/api/users/me', '/me'];
    for (const ep of endpoints) {
      try {
        const r = await API.get(ep);
        if (r && r.data) {
          profile = r.data.user ? r.data.user : r.data;
          break;
        }
      } catch (e) {
        // ignore and try next
      }
    }

    // 2) Fallback to localStorage if no profile from server
    if (!profile) {
      try {
        profile = JSON.parse(localStorage.getItem('user') || '{}');
      } catch (err) {
        console.warn('LocalStorage fallback failed', err);
      }
    }

    setUser(profile || null);
    setUserLoading(false);
  }

  // summary calculations
  const summary = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    const byCategory = {};
    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      const cat = t.category || 'uncategorized';
      if (t.type === 'income') {
        totalIncome += amt;
        byCategory[cat] = (byCategory[cat] || 0) + amt;
      } else {
        totalExpense += amt;
        byCategory[cat] = (byCategory[cat] || 0) + amt;
      }
    });
    const balance = totalIncome - totalExpense;
    const categories = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => Math.abs(b.value) - Math.abs(a.value));
    return { totalIncome, totalExpense, balance, categories };
  }, [txs]);

  const recent = txs.slice(0, 12);

  function Avatar({ name }) {
    const initials = name ? name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : '?';
    return (
      <div style={{
        width:64, height:64, borderRadius:32,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'#0b1220', color:'#9ae6b4', fontWeight:700, fontSize:18, marginRight:12
      }}>
        {initials}
      </div>
    );
  }

  return (
    <div className="content" style={{ padding: 18 }}>
      <BackToDashboard />

      <div className="card" style={{ maxWidth:1000, margin: '0 auto', padding: 18 }}>
        <h3>Profile & Transactions Summary</h3>

        {userLoading ? (
          <div className="small-muted">Loading profile...</div>
        ) : user ? (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:12 }}>
            <Avatar name={user.name || user.fullName || user.username} />
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#e6eef6' }}>
                {user.name || user.fullName || user.username || 'User'}
              </div>
              <div style={{ color:'#9aa3b2' }}>{user.email || ''}</div>
            </div>
          </div>
        ) : (
          <div style={{ color:'#cbd5e1', marginTop:12 }}>Profile not found.</div>
        )}

        <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, padding:12, background:'#071124', borderRadius:8 }}>
            <div className="small-muted">Total Income</div>
            <div style={{ fontSize:20, fontWeight:700 }}>₹{Number(summary.totalIncome).toFixed(2)}</div>
          </div>

          <div style={{ flex:1, minWidth:200, padding:12, background:'#071124', borderRadius:8 }}>
            <div className="small-muted">Total Expense</div>
            <div style={{ fontSize:20, fontWeight:700 }}>₹{Number(summary.totalExpense).toFixed(2)}</div>
          </div>

          <div style={{ flex:1, minWidth:200, padding:12, background:'#071124', borderRadius:8 }}>
            <div className="small-muted">Balance</div>
            <div style={{ fontSize:20, fontWeight:700, color: summary.balance < 0 ? 'tomato' : 'lightgreen' }}>
              ₹{Number(summary.balance).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ marginTop:18 }}>
          <h4>Top Categories</h4>
          {summary.categories.length === 0 ? (
            <div className="small-muted">No categories yet.</div>
          ) : (
            <ul>
              {summary.categories.slice(0,10).map(c => (
                <li key={c.name}>{c.name} — ₹{Number(c.value).toFixed(2)}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop:18 }}>
          <h4>Recent Transactions</h4>
          {loading ? (
            <div className="small-muted">Loading transactions...</div>
          ) : error ? (
            <div style={{ color: 'tomato' }}>{error}</div>
          ) : recent.length === 0 ? (
            <div className="small-muted">No transactions found.</div>
          ) : (
            <table className="tx-table" style={{ width:'100%' }}>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Type</th><th style={{textAlign:'right'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(tx => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>{tx.category}</td>
                    <td><span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>{tx.type.toUpperCase()}</span></td>
                    <td style={{textAlign:'right'}}>₹{Number(tx.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


