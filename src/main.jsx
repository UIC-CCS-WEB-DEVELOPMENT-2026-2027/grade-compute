// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 1. Import your custom global design tokens and typography
import './assets/index.css';

// 2. Import and trigger the mock database initialization
import { initializeDatabase } from './utils/db.js';

initializeDatabase();

// 3. Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);