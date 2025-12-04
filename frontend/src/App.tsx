import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import VotePage from './pages/VotePage';
import SummaryPage from './pages/SummaryPage';


const App: React.FC = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/homePage" element={<HomePage />} /> 
          <Route path="/dashboard" element={<Dashboard />} />  
          <Route path="/votePage/:tripCode" element={<VotePage />} />
          <Route path="/summaryPage/:tripCode" element={<SummaryPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
  );
};


export default App;
