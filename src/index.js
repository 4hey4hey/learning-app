import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { logError } from './utils/errorLogger';
import reportWebVitals from './reportWebVitals';

// グローバルエラーハンドラーを設定
window.addEventListener('error', (event) => {
  const error = event.error || new Error(event.message);
  logError(error, {
    source: 'global-error-handler',
    eventType: 'error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason || new Error('未知のリジェクション');
  logError(error, {
    source: 'unhandled-rejection',
    eventType: 'unhandledrejection'
  });
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// パフォーマンス計測
reportWebVitals();
