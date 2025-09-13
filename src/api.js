import axios from 'axios';

const API = axios.create({
  baseURL: process.https://financial-assistant-backend-4833.onrender.com || 'http://localhost:5000/api'
});

// Attach token to every request if logged in
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
