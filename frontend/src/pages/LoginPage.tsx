// ==========================================
// 📁 src/pages/LoginPage.tsx
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/Login.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="wrap-login100">
      <div className="login100-more" />

      <div className="login100-form-container">
        <form className="login100-form" onSubmit={handleLogin}>
          <div className="form-header">
            <h2 className="login100-form-title">{t('welcome_back')} 👋</h2>
            <p className="login100-form-subtitle">
              {t('sign_in_to_continue')}
            </p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          <div className="wrap-input100">
            <label htmlFor="email" className="label-input100">
              {t('email')}
            </label>
            <input
              id="email"
              className="input100"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email_placeholder')}
              required
              disabled={loading}
            />
            <span className="focus-input100"></span>
          </div>

          <div className="wrap-input100">
            <label htmlFor="password" className="label-input100">
              {t('password')}
            </label>
            <input
              id="password"
              className="input100"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              required
              disabled={loading}
            />
            <span className="focus-input100"></span>
          </div>

          <div className="flex-sb-m">
            <a href="/forgot-password" className="txt1">
              {t('forgot_password')}
            </a>
          </div>

          <div className="container-login100-form-btn">
            <button type="submit" className="login100-form-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  {t('signing_in')}
                </>
              ) : (
                t('sign_in')
              )}
            </button>
          </div>

          <div className="divider">
            <span>{t('or')}</span>
          </div>

          <div className="login100-form-social">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login100-form-social-item bg-google"
              disabled={loading}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
              {t('sign_in_with_google')}
            </button>
          </div>

          <div className="text-center">
            <span className="txt2">{t('no_account')} </span>
            <a href="/signup">{t('sign_up')}</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
