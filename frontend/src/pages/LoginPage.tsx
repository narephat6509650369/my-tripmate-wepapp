// ==========================================
// 📁 src/pages/LoginPage.tsx
// ==========================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../styles/Login.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="wrap-login100">
      <div className="login100-more" />

      <div className="login100-form-container">
        <form className="login100-form" onSubmit={handleGoogleLogin}>
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

          {/* <div className="wrap-input100">
            <label htmlFor="email" className="label-input100">
              Email
            </label>
            <input
              id="email"
              className="input100"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Example@email.com"
              required
              disabled={loading}
            />
            <span className="focus-input100"></span>
          </div> */}

          {/* <div className="wrap-input100">
            <label htmlFor="password" className="label-input100">
              Password
            </label>
            <input
              id="password"
              className="input100"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
            <span className="focus-input100"></span>
          </div>

          <div className="flex-sb-m">
            <a href="/forgot-password" className="txt1">
              Forgot Password?
            </a>
          </div>

          <div className="container-login100-form-btn">
            <button type="submit" className="login100-form-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="divider">
            <span>or</span>
          </div> */}

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

          {/* <div className="text-center">
            <span className="txt2">Don't you have an account? </span>
            <a href="/signup">Sign Up</a>
          </div> */}
        </form>
      </div>
    </div>
  );
};
export default LoginPage;