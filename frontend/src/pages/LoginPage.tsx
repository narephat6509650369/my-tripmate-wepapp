import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import bgImage from '../assets/login-bg.jpg';
import { CONFIG, log } from '../config/app.config';

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

  // ✅ ใช้ CONFIG แทนการ hardcode
  const API_BASE_URL = CONFIG.API_BASE_URL;

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      
      try {
        log.info('Attempting Google login');
        
        const res = await axios.post<GoogleLoginResult>(
          `${API_BASE_URL}/auth/google`, 
          { access_token: tokenResponse.access_token }
        );   
        
        const { token, user } = res.data;
        
        // ตรวจสอบว่ามีข้อมูลครบหรือไม่
        if (!token || !user?.user_id || !user?.email) {
          throw new Error('Invalid response from server');
        }
        
        // บันทึกข้อมูลลง localStorage
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userId', user.user_id);
        localStorage.setItem('userEmail', user.email);
        
        log.success('Login successful', { email: user.email });
        navigate('/homepage');
        
      } catch (err) {
        log.error('Login failed', err);
        
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        
        setError(`เข้าสู่ระบบไม่สำเร็จ: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    
    onError: () => {
      log.error('Google login error');
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
  );
}

export default LoginPage;