import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import DOMPurify from 'dompurify';
import bgImage from '../assets/login-bg.jpg';
import { CONFIG, log } from '../config/app.config';
import { safeLocalStorage } from '../utils/safeStorage';

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

  const API_BASE_URL = CONFIG.API_BASE_URL;

  // ✅ Debug: ดู path ของรูป
  console.log('Background image path:', bgImage);

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
        
        if (!token || !user?.user_id || !user?.email) {
          throw new Error('Invalid response from server');
        }
        
        // Sanitize email before storing
        const sanitizedEmail = DOMPurify.sanitize(user.email.trim());
        
        const tokenSaved = safeLocalStorage.setItem('jwtToken', token);
        const userIdSaved = safeLocalStorage.setItem('userId', user.user_id);
        const emailSaved = safeLocalStorage.setItem('userEmail', sanitizedEmail);

        if (!tokenSaved || !userIdSaved || !emailSaved) {
          alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาล้างข้อมูลในเบราว์เซอร์');
          return;
        }
        
        log.success('Login successful', { email: sanitizedEmail });
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
      {/* ✅ Background Image Section - แก้ไขให้แสดงรูปชัดเจน */}
      <div 
        className="login100-more" 
        style={{ 
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          minHeight: '100vh'
        }}
      >
        {/* ✅ Overlay แบบเบาๆ - ปรับ opacity ได้ตามใจชอบ */}
        {/* ค่า 0.15 = เบามาก, 0.3 = ปานกลาง, 0 = ไม่มี overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(102, 126, 234, 0.15)',
          zIndex: 1
        }} />
      </div>

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