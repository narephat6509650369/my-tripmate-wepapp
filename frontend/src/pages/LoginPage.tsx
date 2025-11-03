// // ==========================================
// // 📁 src/pages/LoginPage.tsx
// // ==========================================

// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { Input } from '../components/common/Input';
// import { Button } from '../components/common/Button';
// import { MapPin, Mail, Lock } from 'lucide-react';

// export const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       await login(email, password);
//       navigate('/');
//     } catch (err: any) {
//       setError(err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
//         <div className="flex flex-col items-center mb-8">
//           <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
//             <MapPin className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">ยินดีต้อนรับกลับ</h1>
//           <p className="text-gray-600">เข้าสู่ระบบ TripPal</p>
//         </div>

//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input
//             type="email"
//             label="อีเมล"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             icon={<Mail className="w-5 h-5" />}
//             placeholder="your@email.com"
//             required
//           />

//           <Input
//             type="password"
//             label="รหัสผ่าน"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             icon={<Lock className="w-5 h-5" />}
//             placeholder="••••••••"
//             required
//           />

//           <Button type="submit" loading={loading} className="w-full">
//             เข้าสู่ระบบ
//           </Button>
//         </form>

//         <div className="mt-6 text-center">
//           <p className="text-gray-600 text-sm">
//             ยังไม่มีบัญชี?{' '}
//             <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
//               สมัครสมาชิก
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// ==========================================
// 📁 src/pages/LoginPage.tsx
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
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

          <div className="wrap-input100">
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
          </div>

          <div className="wrap-input100">
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
          </div>

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

          <div className="text-center">
            <span className="txt2">Don't you have an account? </span>
            <a href="/signup">Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;