// ============================================================================
// utils/helpers.ts
// Utility Functions - Validation, Formatting, Calculations, Storage
// ============================================================================

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * ตรวจสอบรหัสทริป (XXXX-XXXX-XXXX-XXXX)
 */
export const validateInviteCode = (code: string): boolean => {
  const pattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
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

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * จัดรูปแบบรหัสทริป
 */
export const formatInviteCode = (input: string): string => {
  let cleaned = input.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
  if (cleaned.length > 0) {
    cleaned = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
  }
  return cleaned.slice(0, 19);
};

/**
 * จัดรูปแบบตัวเลขเงิน (1,000,000)
 */
export const formatCurrency = (amount: number): string => {
  // Validate input
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
 * จัดรูปแบบวันที่เป็นภาษาไทย
 */
export const formatThaiDate = (date: Date | string | number): string => {
  // Validate input
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
  // Validate input
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp < 0) {
    console.warn('formatRelativeTime: Invalid timestamp', timestamp);
    return 'เวลาไม่ถูกต้อง';
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // Check for future dates
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

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * คำนวณงบประมาณเฉลี่ย
 */
export const calculateAverageBudget = (
  members: Array<{
    budget: {
      accommodation: number;
      transport: number;
      food: number;
      other: number;
    };
  }>
) => {
  if (members.length === 0) {
    return { accommodation: 0, transport: 0, food: 0, other: 0, total: 0 };
  }
  
  const sum = members.reduce(
    (acc, member) => ({
      accommodation: acc.accommodation + member.budget.accommodation,
      transport: acc.transport + member.budget.transport,
      food: acc.food + member.budget.food,
      other: acc.other + member.budget.other
    }),
    { accommodation: 0, transport: 0, food: 0, other: 0 }
  );
  
  const count = members.length;
  
  // Validate calculations
  const accommodation = Number.isFinite(sum.accommodation / count) 
    ? Math.round(sum.accommodation / count) 
    : 0;
  const transport = Number.isFinite(sum.transport / count)
    ? Math.round(sum.transport / count)
    : 0;
  const food = Number.isFinite(sum.food / count)
    ? Math.round(sum.food / count)
    : 0;
  const other = Number.isFinite(sum.other / count)
    ? Math.round(sum.other / count)
    : 0;
  
  return {
    accommodation,
    transport,
    food,
    other,
    total: accommodation + transport + food + other
  };
};

/**
 * นับจำนวนคนที่กรอกงบแล้ว
 */
export const countFilledBudgets = (
  members: Array<{
    budget: {
      accommodation: number;
      transport: number;
      food: number;
      other: number;
    };
  }>
) => {
  const total = members.length;
  const filled = members.filter(
    m => m.budget.accommodation > 0 && 
         m.budget.transport > 0 && 
         m.budget.food > 0
  ).length;
  
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  return { filled, total, percentage };
};

/**
 * หาวันที่มีคนว่างมากสุด
 */
export const findBestDate = (
  members: Array<{ availability: boolean[] }>,
  dates: string[]
) => {
  if (members.length === 0 || dates.length === 0) return null;
  
  const counts = dates.map((date, index) => ({
    date,
    count: members.filter(m => m.availability[index]).length
  }));
  
  const best = counts.reduce((max, current) => 
    current.count > max.count ? current : max
  );
  
  return { date: best.date, availableCount: best.count };
};

// ============================================================================
// STORAGE
// ============================================================================

/**
 * บันทึกข้อมูลลง localStorage
 */
export const saveToStorage = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * ดึงข้อมูลจาก localStorage
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * ลบข้อมูลจาก localStorage
 */
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};