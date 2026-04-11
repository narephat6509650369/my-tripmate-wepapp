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

    if (!token) {
      navigate('/login?error=no_token');
      return;
    }

    // เรียก backend โดยตรง (same-site) → Safari ยอมรับ cookie
    fetch(`${CONFIG.API_BASE_URL}/api/auth/exchange-token?token=${token}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            window.location.href = redirect; 
        } else {
            navigate('/login?error=exchange_failed', { replace: true });
        }
      })
      .catch(() => navigate('/login?error=network'));
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}

export default AuthCallbackPage;