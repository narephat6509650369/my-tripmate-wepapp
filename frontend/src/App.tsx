import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashborad';
import VotePage from './pages/VotePage';
import SummaryPage from './pages/SummaryPage';


const App: React.FC = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/HomePage" element={<HomePage />} /> 
          <Route path="/Dashboard" element={<Dashboard />} />  
          <Route path="/VotePage" element={<VotePage />} />
          <Route path="/SummaryPage" element={<SummaryPage />} />
          <Route path="/" element={<LoginPage />} />
        </Routes>
    </BrowserRouter>
  );
};


export default App;
