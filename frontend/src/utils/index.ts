// ============================================================================
// frontend/src/utils/index.ts
// ✅ รวม utils ทั้งหมด - ตรงกับ Backend APIs
// ============================================================================

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * ตรวจสอบรหัสทริป (Hex Format: XXXX-XXXX-XXXX-XXXX)
 * ตรงกับ Backend: crypto.randomBytes(8).toString('hex')
 */
export const validateInviteCode = (code: string): boolean => {
  // Backend ใช้ Hex (0-9, A-F)
  const pattern = /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/i;
  return pattern.test(code);
};

/**
 * ตรวจสอบงบประมาณ
 */
export const validateBudget = (
  value: number, 
  max: number = 1000000
): { valid: boolean; error?: string } => {
  if (isNaN(value) || value < 0) {
    return { valid: false, error: "กรุณากรอกตัวเลขที่ถูกต้อง" };
  }
  if (value > max) {
    return { valid: false, error: `ต้องไม่เกิน ${max.toLocaleString()} บาท` };
  }
  return { valid: true };
};

/**
 * ตรวจสอบชื่อทริป
 */
export const validateTripName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "ชื่อทริปต้องมีอย่างน้อย 3 ตัวอักษร" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "ชื่อทริปต้องไม่เกิน 100 ตัวอักษร" };
  }
  return { valid: true };
};

/**
 * ตรวจสอบจำนวนวัน (1-30 วัน)
 */
export const validateDays = (days: number): { valid: boolean; error?: string } => {
  if (isNaN(days) || days < 1) {
    return { valid: false, error: "จำนวนวันต้องมากกว่า 0" };
  }
  if (days > 30) {
    return { valid: false, error: "จำนวนวันต้องไม่เกิน 30 วัน" };
  }
  return { valid: true };
};

/**
 * ✅ ตรวจสอบ category (ตรงกับ Backend)
 */
export const validateBudgetCategory = (category: string): boolean => {
  const validCategories = ['accommodation', 'transport', 'food', 'other'];
  return validCategories.includes(category);
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format Invite Code (Hex: 0-9, A-F)
 */
export const formatInviteCode = (input: string): string => {
  let cleaned = input.toUpperCase().replace(/[^0-9A-F]/g, '');
  
  if (cleaned.length > 0) {
    cleaned = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
  }
  
  return cleaned.slice(0, 19); // 16 chars + 3 dashes
};

/**
 * Format จำนวนเงิน (1,000,000)
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    console.warn('formatCurrency: Invalid input', amount);
    return '0';
  }
  
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format วันที่เป็นภาษาไทย
 */
export const formatThaiDate = (date: Date | string | number): string => {
  if (date === null || date === undefined) {
    console.warn('formatThaiDate: null or undefined input');
    return 'วันที่ไม่ถูกต้อง';
  }
  
  const d = new Date(date);
  
  if (isNaN(d.getTime()) || !isFinite(d.getTime())) {
    console.warn('formatThaiDate: Invalid date', date);
    return 'วันที่ไม่ถูกต้อง';
  }
  
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * แสดงเวลาแบบสั้น (5 นาทีที่แล้ว)
 */
export const formatRelativeTime = (timestamp: number): string => {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp < 0) {
    console.warn('formatRelativeTime: Invalid timestamp', timestamp);
    return 'เวลาไม่ถูกต้อง';
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 0) {
    return 'ในอนาคต';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  
  return formatThaiDate(timestamp);
};

/**
 * ✅ Format Date Range สำหรับ API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ============================================================================
// SAFE LOCALSTORAGE (ป้องกัน QuotaExceededError)
// ============================================================================

/**
 * บันทึกข้อมูลลง localStorage แบบปลอดภัย
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage.setItem failed:', error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('❌ พื้นที่เก็บข้อมูลเต็ม');
    }
    
    return false;
  }
};

/**
 * ดึงข้อมูลจาก localStorage แบบปลอดภัย
 */
export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('localStorage.getItem failed:', error);
    return null;
  }
};

/**
 * ลบข้อมูลจาก localStorage แบบปลอดภัย
 */
export const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('localStorage.removeItem failed:', error);
    return false;
  }
};

/**
 * บันทึก Object ลง localStorage (JSON.stringify)
 */
export const saveToStorage = <T>(key: string, value: T): boolean => {
  try {
    const jsonString = JSON.stringify(value);
    return safeSetItem(key, jsonString);
  } catch (error) {
    console.error('saveToStorage failed:', error);
    return false;
  }
};

/**
 * ดึง Object จาก localStorage (JSON.parse)
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = safeGetItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('getFromStorage failed:', error);
    return defaultValue;
  }
};

// ============================================================================
// HELPER FUNCTIONS (ลบฟังก์ชันที่ไม่มี Backend API รองรับ)
// ============================================================================

/**
 * ✅ คำนวณงบประมาณเฉลี่ย (ใช้ฝั่ง Frontend เท่านั้น)
 */
export const calculateAverageBudget = (
  budgets: Array<{
    accommodation: number;
    transport: number;
    food: number;
    other: number;
  }>
) => {
  if (budgets.length === 0) {
    return { accommodation: 0, transport: 0, food: 0, other: 0, total: 0 };
  }
  
  const sum = budgets.reduce(
    (acc, b) => ({
      accommodation: acc.accommodation + b.accommodation,
      transport: acc.transport + b.transport,
      food: acc.food + b.food,
      other: acc.other + b.other
    }),
    { accommodation: 0, transport: 0, food: 0, other: 0 }
  );
  
  const count = budgets.length;
  const accommodation = Math.round(sum.accommodation / count);
  const transport = Math.round(sum.transport / count);
  const food = Math.round(sum.food / count);
  const other = Math.round(sum.other / count);
  
  return {
    accommodation,
    transport,
    food,
    other,
    total: accommodation + transport + food + other
  };
};

/**
 * ✅ นับจำนวนคนที่กรอกงบแล้ว
 */
export const countFilledBudgets = (
  budgets: Array<{
    accommodation: number;
    transport: number;
    food: number;
    other: number;
  }>
) => {
  const total = budgets.length;
  const filled = budgets.filter(
    b => b.accommodation > 0 && b.transport > 0 && b.food > 0
  ).length;
  
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  return { filled, total, percentage };
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * ตรวจสอบว่าเป็น Error object หรือไม่
 */
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

/**
 * ตรวจสอบว่า API response สำเร็จหรือไม่
 */
export const isSuccessResponse = <T>(
  response: any
): response is { success: true; data: T } => {
  return response && response.success === true && response.data !== undefined;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Validation
  validateInviteCode,
  validateBudget,
  validateTripName,
  validateDays,
  validateBudgetCategory,
  
  // Formatting
  formatInviteCode,
  formatCurrency,
  formatThaiDate,
  formatRelativeTime,
  formatDateForAPI,
  
  // Storage
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  saveToStorage,
  getFromStorage,
  
  // Helpers
  calculateAverageBudget,
  countFilledBudgets,
  
  // Type Guards
  isError,
  isSuccessResponse
};