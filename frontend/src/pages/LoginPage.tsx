// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import bgImage from '../assets/login-bg.jpg';
import { useLocation } from 'react-router-dom';
import { CONFIG } from '../config/app.config';

function LoginPage() {
  const location = useLocation();
  const [error, setError] = useState('');
  const [isInApp, setIsInApp] = useState(false);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "/homepage";

  console.log("Redirect param:", redirectPath);

  const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || '';
  
  return (
    // Facebook / Instagram
    /FBAN|FBAV|Instagram/i.test(ua) ||
    // Line
    /Line\//i.test(ua) ||
    // Twitter / X
    /Twitter/i.test(ua) ||
    // WeChat
    /MicroMessenger/i.test(ua) ||
    // TikTok
    /musical_ly|TikTok/i.test(ua) ||
    // Android WebView (สำคัญมาก)
    (/Android/i.test(ua) && /wv/i.test(ua)) ||
    // iOS WebView — ไม่มี Safari ใน UA แต่มี AppleWebKit
    (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua))
  );
};

  //  เปลี่ยนเป็น redirect ไป backend
  const handleGoogleLogin = () => {
  if (loading) return;

  // ตรวจสอบ user agent ว่าเป็น in-app browser หรือไม่
  if (isInAppBrowser()) {
    setIsInApp(true);
    setError('');
    return;
  }

  setLoading(true);
  setError('');

  try {
    console.log('🔐 Redirecting to Google OAuth...');

    const rawRedirect = new URLSearchParams(location.search).get("redirect");

    const redirectPath =
      rawRedirect && rawRedirect !== "/login"
        ? rawRedirect
        : "/homepage";

    const url = `${CONFIG.API_BASE_URL}/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;

    window.location.href = url;
  } catch (err: any) {
    console.error('❌ Redirect failed:', err);
    setError('ไม่สามารถเริ่มการเข้าสู่ระบบได้');
    setLoading(false);
  }
  };

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

          {/* ✅ In-App Browser Warning — แยกจาก error */}
          {isInApp && (
            <div style={{
              backgroundColor: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              color: '#5d4037'
            }}>
              <p>⚠️ ไม่รองรับ Browser นี้</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                กรุณาเปิดลิงก์นี้ใน Chrome หรือ Safari
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('คัดลอกลิงก์แล้ว! 🎉 เปิดใน Chrome หรือ Safari ได้เลย');
                }}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                📋 คัดลอกลิงก์
              </button>
            </div>
          )}

          {/* Google Login Button */}
          <div className="login100-form-social">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login100-form-social-item bg-google"
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }} />
              {loading ? 'Redirecting...' : 'Sign in with Google'}
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