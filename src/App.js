// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProvidersWrapper from './contexts/ProvidersWrapper';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { useErrorLogger } from './utils/errorLogger';

function App() {
  // グローバルエラーキャッチ
  useErrorLogger();

  return (
    <ErrorBoundary>
      <Router>
        <ProvidersWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <PrivateRoute>
                  <AnalyticsDashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate replace to="/login" />} />
          </Routes>
        </ProvidersWrapper>
      </Router>
    </ErrorBoundary>
  );
}

export default App;