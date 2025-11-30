import React from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/Homepage.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


function HomePage() {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    // Logic to navigate to Dashboard page
    navigate('/Dashboard');
  }
  const handleGoToVote = () => {
    // Logic to navigate to Vote page
    navigate('/VotePage');
  }

  const handleGoogleLogout = async () => {
    // ลบ JWT token จาก localStorage
    localStorage.removeItem('jwtToken');
    console.log("Logged out successfully");
    navigate('/');
  }

  return (
    <div>
    <div>HomePage</div>
    <button onClick={handleGoToDashboard} className="blue-button">
      Go to Dashboard
    </button>
    <button onClick={handleGoToVote} className="blue-button">
      Go to Vote
    </button>
    <button onClick={handleGoogleLogout} className="blue-button">
      Logout
    </button>
    </div>
  )
}

export default HomePage

