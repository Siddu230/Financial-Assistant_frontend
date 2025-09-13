import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import '../index.css';

export default function LoginPage(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  const nav=useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      nav('/');
    } catch (err) {
      setErr(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1 style={{fontSize:32, marginBottom:8}}>Finance-<span style={{color:'#ff3b3b'}}>Assistant</span></h1>
        <p className="small-muted">Login</p>
        <form onSubmit={submit} style={{marginTop:18}}>
          <input className="input" placeholder="xyz@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn" type="submit">Submit</button>
        </form>
        {err && <div style={{color:'tomato', marginTop:10}}>{err}</div>}
        <div style={{marginTop:14, textAlign:'center', color:'var(--muted)'}}>
          don't have account? <Link to="/register" style={{color:'#fff'}}> signup</Link>
        </div>
      </div>
    </div>
  );
}
