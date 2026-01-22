// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import bgImage from '../assets/login-bg.jpg';

function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const query = new URLSearchParams(location.search);
  const redirect = query.get("redirect") || undefined;

  // ✅ ใช้ useAuth hook แทนการ call API โดยตรง
  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      
      try {
        console.log('🔐 Attempting Google login...');
        
        // ✅ ใช้ login จาก AuthContext
        await login(tokenResponse.access_token, redirect);
        

        
        // AuthContext จะจัดการ navigate ให้เอง
        console.log('✅ Login successful');
        
      } catch (err: any) {
        console.error('❌ Login failed:', err);
        setError(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    
    onError: () => {
      console.error('❌ Google login error');
      setError('การเข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง');
    },
  });

  return (
    <div className="wrap-login100">
      {/* Background Image */}
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
        {/* Overlay */}
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

      {/* Login Form */}
      <div className="login100-form-container">
        <form className="login100-form validate-form">
          <div className="form-header">
            <h2 className="login100-form-title">Welcome Back 👋</h2>
            <p className="login100-form-subtitle">
              Wherever you're going next, it starts here. <br />
              Log in to explore, plan, and create memories.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#c33'
            }}>
              <i 
                className="fas fa-exclamation-circle" 
                style={{ marginRight: '8px' }}
              />
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <div className="login100-form-social">
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="login100-form-social-item bg-google"
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }} />
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '24px', 
            textAlign: 'center', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            <p>By signing in, you agree to our Terms & Privacy Policy</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;