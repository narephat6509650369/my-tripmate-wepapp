// ============================================================================
// config/app.config.ts
// Application Configuration & Logging
// ============================================================================

/**
 * ตั้งค่าแอปพลิเคชัน
 */
export const CONFIG = {
  USE_MOCK_DATA: true, // 🔥 สำหรับ development: เปิดใช้งาน mock data
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  API_TIMEOUT: 10000,
  DEBUG_MODE: import.meta.env.DEV,
  ENABLE_CONSOLE_LOGS: true,
} as const;

/**
 * ฟังก์ชันสำหรับ log ข้อมูล
 */
export const log = {
  info: (message: string, data?: any) => { 
    if (!CONFIG.ENABLE_CONSOLE_LOGS) return;
    console.log(`ℹ️ [INFO] ${message}`, data || ''); 
  },
  warn: (...args: any[]) => {
    if (!CONFIG.ENABLE_CONSOLE_LOGS) return;
    console.warn('⚠️', ...args);
  },
  success: (message: string, data?: any) => { 
    if (!CONFIG.ENABLE_CONSOLE_LOGS) return;
    console.log(`✅ [SUCCESS] ${message}`, data || ''); 
  },
  error: (message: string, data?: any) => { 
    console.error(`❌ [ERROR] ${message}`, data || ''); 
  },
  mock: (message: string, data?: any) => { 
    if (!CONFIG.ENABLE_CONSOLE_LOGS || !CONFIG.USE_MOCK_DATA) return;
    console.log(`🎭 [MOCK] ${message}`, data || ''); 
  },
  api: (message: string, data?: any) => { 
    if (!CONFIG.ENABLE_CONSOLE_LOGS) return;
    console.log(`🌐 [API] ${message}`, data || ''); 
  },
  debug: (...args: any[]) => {
    if (!CONFIG.DEBUG_MODE) return;
    console.debug('🔍', ...args);
  }
};