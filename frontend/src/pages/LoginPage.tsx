import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import bgImage from '../assets/login-bg.jpg';
import '../styles/login.css';

interface GoogleAuthResponse {
  token: string;
  user?: { id: string; email: string };
}

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleGoogleLogin = useGoogleLogin({
  flow: 'implicit',
  onSuccess: async (tokenResponse) => {
    setLoading(true);
    setError('');
    try {
      // ส่ง token ไปที่ backend เพื่อรับ JWT
      const res = await axios.post<GoogleAuthResponse>(
        `${API_BASE_URL}/auth/google`,
        { access_token: tokenResponse.access_token }
      );
      const { token } = res.data;
      localStorage.setItem('jwtToken', token);
      navigate('/HomePage');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  },
  onError: () => {
    setError('Google login was unsuccessful. Please try again.');
  },
});


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
              <i 
                className="fas fa-exclamation-circle" 
                style={{ marginRight: '8px' }}
              />
              {error}
            </div>
          )}

          <div className="login100-form-social">
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="login100-form-social-item bg-google"
              disabled={loading}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }} />
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage