// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaPlus, FaFileUpload, FaReceipt, FaUser, FaSignOutAlt } from 'react-icons/fa';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <div style={{display:'flex',alignItems:'center',gap:12, marginBottom:20}}>
        <img src="/logo192.png" alt="logo" style={{width:48,height:48,borderRadius:8}} />
        <div>
          <div style={{fontWeight:700}}>FinanceAssistant</div>
          <div style={{fontSize:12,color:'#9aa3b2'}}>Track your money</div>
        </div>
      </div>

      <button className="side-btn" onClick={() => handleNav('/')}>
        <FaHome/> Home
      </button>

      <button className="side-btn" onClick={() => handleNav('/create')}>
        <FaPlus/> Create Transaction
      </button>

      <button className="side-btn" onClick={() => handleNav('/upload-statement')}>
        <FaFileUpload/> Upload Statement
      </button>

      <button className="side-btn" onClick={() => handleNav('/upload-receipt')}>
        <FaReceipt/> Upload Receipt
      </button>

      <button className="side-btn" onClick={() => handleNav('/profile')}>
        <FaUser/> Profile
      </button>

      <div style={{marginTop:20}}>
        <button className="side-btn" onClick={()=>{
          localStorage.clear();
          window.location.href = '/login';
        }}>
          <FaSignOutAlt/> Logout
        </button>
      </div>
    </div>
  );
}
