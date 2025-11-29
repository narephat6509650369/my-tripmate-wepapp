import React from 'react'
import '../styles/VotePage.css';
import { useNavigate } from 'react-router-dom';

function VotePage() {
    const navigate = useNavigate();
    
    const handleGoToSummary = () => {
    // Logic to navigate to Summary page
    console.log("Navigate to Summary page");
    navigate('/SummaryPage');
  }
  return (
    <div>
    <div>VotePage</div>
    <button onClick={handleGoToSummary} className="blue-button"> 
        Summary
    </button>
    </div>
  )
}
export default VotePage