// src/pages/AuthCallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CONFIG } from '../config/app.config';

function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
  const token = params.get('token');
  const redirect = params.get('redirect') || '/homepage';

  console.log('🟡 AuthCallbackPage loaded');
  console.log('🔑 token:', token ? 'EXISTS' : 'NULL');
  console.log('📍 redirect:', redirect);

  if (!token) {
    console.error('❌ No token in URL');
    navigate('/login?error=no_token');
    return;
  }

  console.log('📡 Calling exchange-token...');

  fetch(`${CONFIG.API_BASE_URL}/api/auth/exchange-token?token=${token}`, {
    credentials: 'include',
  })
    .then(res => {
      console.log('📡 exchange-token status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('📡 exchange-token data:', data);
      if (data.success) {
        console.log('✅ Success! redirecting to:', redirect);
        window.location.href = redirect;
      } else {
        console.error('❌ exchange failed:', data.message);
        navigate('/login?error=exchange_failed', { replace: true });
      }
    })
    .catch(err => {
      console.error('❌ Network error:', err);
      navigate('/login?error=network');
    });
}, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}

export default AuthCallbackPage;