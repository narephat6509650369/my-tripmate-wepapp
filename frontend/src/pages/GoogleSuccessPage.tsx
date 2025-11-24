import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const GoogleSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // เก็บ token
      localStorage.setItem('token', token);

      // fetch ข้อมูล user จริง
      authService.getMe().then(user => {
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/HomePage'); // ✅ ไปหน้า HomePage
      }).catch(() => {
        navigate('/login'); 
      });
    } else {
      navigate('/login'); 
    }
  }, [navigate]);

  return <div>Logging in...</div>;
};
