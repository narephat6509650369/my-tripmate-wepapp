// ============================================================================
// frontend/src/config/app.config.ts
// ✅ Configuration สำหรับ Development / Production
// ============================================================================

/**
 * ✅ ตั้งค่าโหมดการทำงาน
 */
<<<<<<< HEAD
export const CONFIG = {
  USE_MOCK_DATA: false,              // เปลี่ยนเป็น false เมื่อต่อ API จริง
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
=======
export const APP_CONFIG = {
  // 🔧 Development Settings
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true' || false,
  
  // 🌐 API Settings
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // 🔑 Auth Settings
  SKIP_AUTH_IN_DEV: import.meta.env.VITE_SKIP_AUTH === 'true' || false,
  
  // 🎨 UI Settings
  ENABLE_DEV_TOOLS: import.meta.env.DEV || false,
  
  // ⏱️ Timeouts
>>>>>>> 59dcfd2d1d16c01491237a32cdfa0ce1fc61ca1d
  API_TIMEOUT: 10000,
  MOCK_DELAY: 500,
} as const;

/**
 * ✅ Development Mode Status
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * ✅ Feature Flags
 */
export const FEATURES = {
  ENABLE_MOCK_DATA: APP_CONFIG.USE_MOCK_DATA,
  ENABLE_AUTH_BYPASS: APP_CONFIG.SKIP_AUTH_IN_DEV,
  ENABLE_CONSOLE_LOGS: isDevelopment,
} as const;

/**
 * ✅ Mock User สำหรับ Development
 */
export const MOCK_USER = {
  user_id: 'mock-user-123',
  email: 'dev@tripmate.com',
  full_name: 'Developer',
  avatar_url: null,
};

/**
 * ✅ Mock Token สำหรับ Development
 */
export const MOCK_TOKEN = 'mock-jwt-token-for-development';

/**
 * ✅ Helper: Log Configuration
 */
export const logConfig = () => {
  if (isDevelopment) {
    console.log('🔧 App Configuration:', {
      mode: import.meta.env.MODE,
      useMockData: APP_CONFIG.USE_MOCK_DATA,
      skipAuth: APP_CONFIG.SKIP_AUTH_IN_DEV,
      apiUrl: APP_CONFIG.API_BASE_URL,
    });
  }
};

// ✅ Export แบบเก่าด้วย (backward compatibility)
export const CONFIG = APP_CONFIG;

export default APP_CONFIG;