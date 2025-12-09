export const CONFIG = {
  USE_MOCK_DATA: true, // ✅ ใช้ Mock Data // ⬅️ เปลี่ยนเป็น false เมื่อต้องการใช้ API จริง
//   USE_MOCK_DATA: false  // ✅ ใช้ Real API
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  API_TIMEOUT: 10000,
  DEBUG_MODE: import.meta.env.DEV,
  ENABLE_CONSOLE_LOGS: true,
} as const;

export const log = {
  info: (message: string, data?: any) => { console.log(`ℹ️ [INFO] ${message}`, data || ''); },
  success: (message: string, data?: any) => { console.log(`✅ [SUCCESS] ${message}`, data || ''); },
  error: (message: string, data?: any) => { console.error(`❌ [ERROR] ${message}`, data || ''); },
  mock: (message: string, data?: any) => { console.log(`🎭 [MOCK] ${message}`, data || ''); },
  api: (message: string, data?: any) => { console.log(`🌐 [API] ${message}`, data || ''); }
};