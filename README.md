# You can acess the `Backend` of this `Project` : https://github.com/Siddu230/Financial-Assistant_backend
---
# To use the Apllication Default Login details  
 - Default mail : admin@gmail.com 
 - Default pass: admin
---

# Finance Assistant — Frontend

**Purpose:** React single-page app (SPA) UI for the Finance Assistant. Talks to the backend API to list, filter, create, delete transactions and to upload receipts / bank statements for automatic parsing.

This README shows how to:
- Install and run locally (dev)
- Build for production
- Configure environment variables
- Deploy to Netlify
- Troubleshoot common issues (CORS, build errors)

---

## Prerequisites

- Node.js (≥18 recommended) and npm installed
- A running backend API (see backend README). While developing you can run backend on `http://localhost:5000` or use your deployed backend URL.

---

## Project layout (important files)

frontend/

├─ package.json

├─ public/

├─ src/

│ ├─ index.js

│ ├─ api.js # axios instance (set baseURL here)

│ ├─ components/

│ │ └─ UploadCard.js

│ ├─ pages/

│ └─ index.css

└─ .env # optional: create to store REACT_APP_API_URL

---

## Environment variables

Create a `.env` file in the **frontend** root (next to package.json).

**Important**: React only exposes variables prefixed with `REACT_APP_`.

Example `.env`:

REACT_APP_API_URL=https://financial-assistant-backend-4833.onrender.com/api

- `REACT_APP_API_URL` — base URL for the backend API (include `/api` if your backend serves under that route).
- After creating or changing `.env`, restart dev server.

> Security: Do **not** store secrets (passwords, tokens) in front-end env. Those belong on the server.

---


## Configure `src/api.js`

Use the `REACT_APP_API_URL` variable. Example `src/api.js`:

```js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

```
---
## nstall & run (development)

->from frontend/ directory

-npm install.

-npm start.

---




