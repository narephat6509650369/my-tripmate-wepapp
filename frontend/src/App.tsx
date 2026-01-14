// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './guards/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import VotePage from './pages/VotePage';
import SummaryPage from './pages/SummaryPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/homepage" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/votepage/:tripCode" element={
            <ProtectedRoute>
              <VotePage />
            </ProtectedRoute>
          } />
          
          <Route path="/summary/:tripCode" element={
            <ProtectedRoute>
              <SummaryPage />
            </ProtectedRoute>
          } />

          {/* Catch All - Redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;