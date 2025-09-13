import React, { useState, useEffect, useMemo } from 'react';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import API from '../api';
import TransactionCard from '../components/TransactionCard';
import UploadCard from '../components/UploadCard';
import '../index.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage(){
  const [showSidebar, setShowSidebar] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // chart mode: 'daily' | 'byCategoryExpense' | 'byCategoryIncome'
  const [chartMode, setChartMode] = useState('daily');

  useEffect(()=> {
    fetchTxs(); // initial load
    // eslint-disable-next-line
  },[]);

  // helpers to convert yyyy-mm-dd to ISO start/end of day
  function isoStartOfDay(dateStr) {
    if (!dateStr) return undefined;
    const [y,m,d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m-1, d, 0,0,0,0);
    return dt.toISOString();
  }
  function isoEndOfDay(dateStr) {
    if (!dateStr) return undefined;
    const [y,m,d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m-1, d, 23,59,59,999);
    return dt.toISOString();
  }

  // core fetch, accepts overrides
  const fetchTxs = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page || page || 1,
        limit: opts.limit || limit
      };
      const fromDate = (opts.from === undefined) ? from : opts.from;
      const toDate = (opts.to === undefined) ? to : opts.to;
      const categoryFilter = (opts.category === undefined) ? category : opts.category;

      if (fromDate) params.from = isoStartOfDay(fromDate);
      if (toDate) params.to = isoEndOfDay(toDate);
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;

      console.log('Fetching transactions with params:', params);
      const res = await API.get('/transactions', { params });
      setTransactions(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(Number(params.page));
    } catch (err) {
      console.error('Error fetching transactions', err);
      alert('Error fetching transactions. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Called by Filter button
  const applyFilter = () => {
    fetchTxs({ page: 1, from, to, category });
  };

  // Clear filters and reload all transactions
  const clearFilter = () => {
    setFrom('');
    setTo('');
    setCategory('all');
    fetchTxs({ page: 1, from: '', to: '', category: 'all' });
  };

  // pagination
  const prevPage = () => { if (page > 1) fetchTxs({ page: page - 1 }); };
  const nextPage = () => { if (page * limit < total) fetchTxs({ page: page + 1 }); };

  // Delete handler used when TransactionCard calls onDeleted
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      // refresh current page
      fetchTxs({ page, from, to, category });
    } catch (err) {
      console.error('Delete failed', err);
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  // transform transactions into data sets for different charts
  const chartDataDaily = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString();
      if (!map[day]) map[day] = { date: day, income: 0, expense: 0 };
      if (t.type === 'income') map[day].income += t.amount;
      else map[day].expense += t.amount;
    });
    return Object.values(map).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [transactions]);

  const chartDataByCategoryExpense = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const cat = t.category || 'uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map).map(([k,v]) => ({ name: k, value: v }));
  }, [transactions]);

  const chartDataByCategoryIncome = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type !== 'income') return;
      const cat = t.category || 'uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map).map(([k,v]) => ({ name: k, value: v }));
  }, [transactions]);

  // colors for pie chart
  const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#A28BD4','#F06292','#9aa3b2'];

  return (
    <div className="app-shell">
      <Topbar onMenu={() => setShowSidebar(s => !s)} />
      <div className="main">
        {showSidebar && <Sidebar />}
        <div className="content">
          <div style={{display:'flex', gap:20}}>
            <div style={{flex:1}}>
             <div className="card">
                <h3>Filter Transactions</h3>

                <div className="small-muted">Start Date</div>
                <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />

                <div className="small-muted">End Date</div>
                <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />

                <div className="small-muted">Category</div>
                <input className="input" placeholder="all" value={category} onChange={e => setCategory(e.target.value)} />

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={applyFilter} disabled={loading}>
                    {loading ? 'Loading...' : 'Filter'}
                  </button>
                  <button className="btn" onClick={clearFilter}>
                    Clear
                  </button>
                </div>
              </div>


              <div className="card" style={{marginTop:18}}>
                <h3>Recent Transactions</h3>
                {transactions.length === 0 ? (
                  <div className="small-muted">No transactions found.</div>
                ) : (
                  <>
                    <table className="tx-table" style={{width:'100%'}}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Type</th>
                          <th style={{textAlign:'right'}}>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <TransactionCard key={tx._id} tx={tx} onDeleted={handleDeleteTransaction} />
                        ))}
                      </tbody>
                    </table>

                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
                      <div className="small-muted">Page {page} — Total {total}</div>
                      <div>
                        <button className="side-btn" disabled={page<=1} onClick={prevPage}>Prev</button>
                        <button className="side-btn" disabled={(page*limit) >= total} onClick={nextPage} style={{marginLeft:8}}>Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{flex:2}}>
              <div className="card" style={{minHeight: 460}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h3>
                    {chartMode === 'daily' && 'Daily Income vs. Expense'}
                    {chartMode === 'byCategoryExpense' && 'Expenses by Category'}
                    {chartMode === 'byCategoryIncome' && 'Income by Category'}
                  </h3>

                  <div style={{display:'flex', gap:10}}>
                    <button className="side-btn" onClick={() => setChartMode('daily')} style={{padding:'8px 12px'}}>Daily</button>
                    <button className="side-btn" onClick={() => setChartMode('byCategoryExpense')} style={{padding:'8px 12px'}}>Expenses by Category</button>
                    <button className="side-btn" onClick={() => setChartMode('byCategoryIncome')} style={{padding:'8px 12px'}}>Income by Category</button>
                  </div>
                </div>

                <div style={{height:360, marginTop:12}}>
                  {chartMode === 'daily' && (
                    chartDataDaily.length === 0 ? (
                      <div className="small-muted" style={{padding:20}}>No daily data available to display.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataDaily}>
                          <XAxis dataKey="date" stroke="#9aa3b2"/>
                          <YAxis stroke="#9aa3b2"/>
                          <Tooltip />
                          <Bar dataKey="expense" stackId="a" fill="#ff4d4d" />
                          <Bar dataKey="income" stackId="a" fill="#00e676" />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  )}

                  {chartMode === 'byCategoryExpense' && (
                    chartDataByCategoryExpense.length === 0 ? (
                      <div className="small-muted" style={{padding:20}}>No expense category data to display.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                              data={chartDataByCategoryExpense}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={120}
                              label={({ name, value }) => `${name}: ₹${value}`}
                            >
                              {chartDataByCategoryExpense.map((entry, index) => (
                                <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>

                        </PieChart>
                      </ResponsiveContainer>
                    )
                  )}

                  {chartMode === 'byCategoryIncome' && (
                    chartDataByCategoryIncome.length === 0 ? (
                      <div className="small-muted" style={{padding:20}}>No income category data to display.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                              data={chartDataByCategoryIncome}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={120}
                              label={({ name, value }) => `${name}: ₹${value}`}
                            >
                              {chartDataByCategoryIncome.map((entry, index) => (
                                <Cell key={`c2-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>

                        </PieChart>
                      </ResponsiveContainer>
                    )
                  )}
                </div>
              </div>

              <div id="upload-card" style={{marginTop:18}}>
                <UploadCard onSaved={() => fetchTxs({ page: 1, from, to, category })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
