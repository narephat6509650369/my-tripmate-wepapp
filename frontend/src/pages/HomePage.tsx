import React from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/Homepage.css';


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
  
  return (
    <div>
    <div>HomePage</div>
    <button onClick={handleGoToDashboard} className="blue-button">
      Go to Dashboard
    </button>
    <button onClick={handleGoToVote} className="blue-button">
      Go to Vote
    </button>
    </div>
  )
}

export default HomePage

