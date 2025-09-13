// src/App.js
import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import UploadReceiptPage from './pages/UploadReceiptPage';
import UploadStatementPage from './pages/UploadStatementPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/" element={<PrivateRoute><DashboardPage/></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><CreateTransactionPage/></PrivateRoute>} />
        <Route path="/upload-receipt" element={<PrivateRoute><UploadReceiptPage/></PrivateRoute>} />
        <Route path="/upload-statement" element={<PrivateRoute><UploadStatementPage/></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
