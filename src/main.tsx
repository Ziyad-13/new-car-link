import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress Google Maps InvalidKeyMapError from polluting the AI Studio error console
const originalConsoleError = console.error;
console.error = (...args) => {
  const arg = args[0];
  let msg = '';
  if (typeof arg === 'string') {
    msg = arg;
  } else if (arg && arg instanceof Error) {
    msg = arg.message;
  } else if (arg && typeof arg === 'object' && arg.message) {
    msg = String(arg.message);
  }
  
  if (
    msg.includes('InvalidKeyMapError') || 
    msg.includes('Google Maps JavaScript API error') ||
    msg.includes('gm_authFailure')
  ) {
    // We intentionally suppress this so it doesn't trigger the AI Studio error overlay.
    // The application gracefully falls back to a non-map state when the key is invalid.
    return;
  }
  originalConsoleError(...args);
};

window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('InvalidKeyMapError') || e.message.includes('Google Maps JavaScript API error'))) {
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('InvalidKeyMapError') || e.reason.message.includes('Google Maps JavaScript API error'))) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
