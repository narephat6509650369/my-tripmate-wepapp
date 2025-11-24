import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';

import { Loading } from './components/common/Loading';
// import HomePage from "./pages/HomePage";
import { LanguageProvider } from './contexts/LanguageContext';
import { HomePage } from './pages/HomePage';
import { GoogleSuccessPage } from './pages/GoogleSuccessPage';
import { Dashboard } from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/HomePage" element={<HomePage />} />
          <Route path="/Dashboard" element={<Dashboard />} />      
          <Route path="/google-success" element={<GoogleSuccessPage />} />
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};


export default App;
