// frontend/src/guards/ProtectedRoute.tsx
// ✅ Protected Route Guard สำหรับ routes ที่ต้อง login

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOwner?: boolean;
  ownerId?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOwner = false,
  ownerId 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ✅ แสดง Loading ขณะตรวจสอบ auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // ✅ ถ้ายังไม่ได้ login → redirect ไป login page
  if (!isAuthenticated) {
    console.warn('⚠️ Not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ ถ้าต้องการ owner permission
  if (requireOwner && ownerId && user) {
    if (user.user_id !== ownerId) {
      console.warn('⚠️ Not owner, access denied');
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ไม่มีสิทธิ์เข้าถึง
            </h2>
            <p className="text-gray-600 mb-6">
              เฉพาะเจ้าของทริปเท่านั้นที่สามารถเข้าถึงหน้านี้ได้
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      );
    }
  }

  // ✅ ผ่านการตรวจสอบ → แสดง children
  return <>{children}</>;
};

export default ProtectedRoute;