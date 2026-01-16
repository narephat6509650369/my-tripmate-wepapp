// ============================================================================
// frontend/src/components/Toast.tsx
// ✅ ฉบับสมบูรณ์ - พร้อม Fade Out Animation
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info',
  onClose, 
  duration = 3000 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // ⏱️ Start fade out animation ก่อนปิด
    const fadeOutTimer = setTimeout(() => {
      setIsClosing(true);
    }, duration - 300); // เริ่ม fade ก่อน 300ms

    // 🚪 ปิดจริงหลัง animation เสร็จ
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // รอ animation เสร็จ
  };

  // 🎨 Icons
  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  // 🎨 Colors
  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800'
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600'
  };

  return (
    <div 
      className={`fixed top-20 right-4 z-[9999] transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div 
        className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border-2 ${colors[type]} min-w-[300px] max-w-[500px]`}
        role="alert"
        aria-live="polite"
      >
        <div className={iconColors[type]}>
          {icons[type]}
        </div>
        
        <span className="font-semibold flex-1 text-sm sm:text-base">
          {message}
        </span>
        
        <button 
          onClick={handleClose} 
          className="ml-2 hover:opacity-70 transition-opacity p-1 rounded hover:bg-black/5"
          aria-label="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

// ✅ Named export ด้วย (รองรับทั้ง 2 แบบ)
export { Toast };