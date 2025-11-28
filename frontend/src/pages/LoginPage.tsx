// ==========================================
// 📁 src/pages/LoginPage.tsx
// ==========================================

import React, { useEffect, useState } from 'react';
import bgImage from '../assets/login-bg.jpg';
import '../styles/Login.css';

export const LoginPage: React.FC = () => {
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  

  const handleGoogleLogin = () => {
    console.log("User clicked Google Login");
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="wrap-login100">
      <div 
        className="login100-more" 
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <div className="login100-form-container">
        <form className="login100-form validate-form">
          <div className="form-header">
            <h2 className="login100-form-title">Welcome Back 👋</h2>
            <p className="login100-form-subtitle">
              Wherever you're going next, it starts here. <br />
              Log in to explore, plan, and create memories.
            </p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          <div className="login100-form-social">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login100-form-social-item bg-google"
              disabled={loading}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
              Sign in with Google
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
export default LoginPage;