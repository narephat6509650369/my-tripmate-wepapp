// ==========================================
// 📁 src/App.tsx (อัพเดท Routes)
// ==========================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { TripsPage } from './pages/TripsPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { Loading } from './components/common/Loading';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading..." />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <TripsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trips/:id"
            element={
              <PrivateRoute>
                <TripDetailPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;


// App.tsx


// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import LoginPage from './pages/LoginPage';
// import TripsPage from './pages/TripsPage';
// // import HomePage from './pages/HomePage';

// const App = () => {
//   const isLoggedIn = !!localStorage.getItem('token');

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* หน้า public */}
//         <Route path="/login" element={<LoginPage />} />
//         {/* <Route path="/" element={<HomePage />} /> */}

//         {/* หน้า protected */}
//         <Route
//           path="/trips"
//           element={isLoggedIn ? <TripsPage /> : <Navigate to="/login" replace />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// };

// export default App;
