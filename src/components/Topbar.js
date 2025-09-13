import React from 'react';

export default function Topbar({ onMenu }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return (
    <div className="topbar">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onMenu} style={{background:'transparent', border:'none', color:'#fff', cursor:'pointer'}}>☰</button>
        <div className="logo"><img src="/logo192.png" alt="logo" style={{width:34,height:34,borderRadius:8}}/> <span className="accent">Finance</span>Assistant</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{textAlign:'right',marginRight:8}}>
          <div style={{fontSize:12,color:'#9fb0c9'}}>Welcome</div>
          <div style={{fontWeight:700}}>{user.name || 'User'}</div>
        </div>
        <div style={{width:44,height:44,borderRadius:44,overflow:'hidden',border:'2px solid rgba(255,255,255,0.06)'}}>
          <img src="/image1.png" alt="avatar" style={{width:'100%'}} />
        </div>
      </div>
    </div>
  );
}
