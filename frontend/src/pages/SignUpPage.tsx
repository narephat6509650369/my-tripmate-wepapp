// // ==========================================
// // 📁 src/pages/SignUpPage.tsx
// // ==========================================

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import '../styles/Login.css';

// export const SignUpPage: React.FC = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     if (password.length < 8) {
//       setError('Password must be at least 8 characters');
//       return;
//     }

//     setLoading(true);
//     try {
//       await register(name, email, password);
//       navigate('/');
//     } catch (err: any) {
//       setError(err.response?.data?.error || 'Sign up failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleSignUp = () => {
//     window.location.href = 'http://localhost:5000/api/auth/google';
//   };

//   return (
//     <div className="wrap-login100">
//       <div className="login100-more" />

//       <div className="login100-form-container">
//         <form className="login100-form" onSubmit={handleSignUp}>
//           <div className="form-header">
//             <h2 className="login100-form-title">Create Account 🎉</h2>
//             <p className="login100-form-subtitle">
//               Join us today and start planning your next adventure!
//             </p>
//           </div>

//           {error && (
//             <div className="error-message">
//               <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
//               {error}
//             </div>
//           )}

//           <div className="wrap-input100">
//             <label htmlFor="name" className="label-input100">
//               Full Name
//             </label>
//             <input
//               id="name"
//               className="input100"
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="John Doe"
//               required
//               disabled={loading}
//             />
//             <span className="focus-input100"></span>
//           </div>

//           <div className="wrap-input100">
//             <label htmlFor="email" className="label-input100">
//               Email
//             </label>
//             <input
//               id="email"
//               className="input100"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Example@email.com"
//               required
//               disabled={loading}
//             />
//             <span className="focus-input100"></span>
//           </div>

//           <div className="wrap-input100">
//             <label htmlFor="password" className="label-input100">
//               Password
//             </label>
//             <input
//               id="password"
//               className="input100"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="At least 8 characters"
//               required
//               disabled={loading}
//             />
//             <span className="focus-input100"></span>
//           </div>

//           <div className="wrap-input100">
//             <label htmlFor="confirmPassword" className="label-input100">
//               Confirm Password
//             </label>
//             <input
//               id="confirmPassword"
//               className="input100"
//               type="password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               placeholder="Re-enter password"
//               required
//               disabled={loading}
//             />
//             <span className="focus-input100"></span>
//           </div>

//           <div className="container-login100-form-btn">
//             <button type="submit" className="login100-form-btn" disabled={loading}>
//               {loading ? (
//                 <>
//                   <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
//                   Creating account...
//                 </>
//               ) : (
//                 'Sign Up'
//               )}
//             </button>
//           </div>

//           <div className="divider">
//             <span>or</span>
//           </div>

//           <div className="login100-form-social">
//             <button
//               type="button"
//               onClick={handleGoogleSignUp}
//               className="login100-form-social-item bg-google"
//               disabled={loading}
//             >
//               <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
//               Sign up with Google
//             </button>
//           </div>

//           <div className="text-center">
//             <span className="txt2">Already have an account? </span>
//             <a href="/login">Sign In</a>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SignUpPage;