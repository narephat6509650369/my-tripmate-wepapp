import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import bgImage from '../assets/login-bg.jpg';
import '../styles/login.css';

interface GoogleLoginResult {
  token: string;
  user: {
    user_id: string;
    email: string;
  };
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
        const res = await axios.post<GoogleLoginResult>(`${API_BASE_URL}/auth/google`, { access_token: tokenResponse.access_token });   
        const { token, user } = res.data;
        
        // ตรวจสอบว่ามีข้อมูลครบหรือไม่
        if (!token || !user?.user_id || !user?.email) {
          throw new Error('Invalid response from server');
        }
        
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userId', user.user_id);
        localStorage.setItem('userEmail', user.email);
        
        navigate('/homepage');
      } catch (err) {
        console.error('Login failed:', err);
        setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('การเข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง');
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