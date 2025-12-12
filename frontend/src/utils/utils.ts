// ============== VALIDATION UTILITIES ==============

/**
 * ตรวจสอบรูปแบบ Invite Code
 * Format: XXXX-XXXX-XXXX-XXXX (16 ตัวอักษร + 3 เครื่องหมาย -)
 * ใช้อักษร A-H, J-N, P-Z และตัวเลข 2-9 (ตัดอักษรที่สับสนออก: I, O, 0, 1)
 */
export const validateInviteCode = (code: string): boolean => {
  const pattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(code);
};

/**
 * ตรวจสอบความถูกต้องของงบประมาณ
 * - ต้องเป็นตัวเลขบวก
 * - ไม่เกินจำนวนสูงสุดที่กำหนด
 */
export const validateBudget = (
  value: number, 
  max: number = 1000000
): { valid: boolean; error?: string } => {
  if (isNaN(value) || value < 0) {
    return { 
      valid: false, 
      error: "กรุณากรอกตัวเลขที่ถูกต้องและไม่ติดลบ" 
    };
  }
  
  if (value > max) {
    return { 
      valid: false, 
      error: `จำนวนเงินต้องไม่เกิน ${max.toLocaleString()} บาท` 
    };
  }
  
  return { valid: true };
};

/**
 * ตรวจสอบความถูกต้องของชื่อทริป
 * - ต้องมีความยาวอย่างน้อย 3 ตัวอักษร
 * - ไม่เกิน 100 ตัวอักษร
 */
export const validateTripName = (name: string): { valid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return { 
      valid: false, 
      error: "ชื่อทริปต้องมีอย่างน้อย 3 ตัวอักษร" 
    };
  }
  
  if (trimmedName.length > 100) {
    return { 
      valid: false, 
      error: "ชื่อทริปต้องไม่เกิน 100 ตัวอักษร" 
    };
  }
  
  return { valid: true };
};

/**
 * ตรวจสอบจำนวนวัน
 * - ต้องเป็นตัวเลขบวก
 * - อยู่ระหว่าง 1-30 วัน
 */
export const validateDays = (days: number): { valid: boolean; error?: string } => {
  if (isNaN(days) || days < 1) {
    return { 
      valid: false, 
      error: "จำนวนวันต้องมากกว่า 0" 
    };
  }
  
  if (days > 30) {
    return { 
      valid: false, 
      error: "จำนวนวันต้องไม่เกิน 30 วัน" 
    };
  }
  
  return { valid: true };
};

// ============== FORMATTING UTILITIES ==============

/**
 * Format Invite Code ให้เป็นรูปแบบ XXXX-XXXX-XXXX-XXXX
 */
export const formatInviteCode = (input: string): string => {
  // ลบทุกอักขระที่ไม่ใช่ตัวอักษร/ตัวเลข
  let cleaned = input.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
  
  // เพิ่ม - ทุก 4 ตัวอักษร
  if (cleaned.length > 0) {
    cleaned = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
  }
  
  // จำกัดความยาวไม่เกิน 19 ตัว (16 ตัวอักษร + 3 เครื่องหมาย -)
  return cleaned.slice(0, 19);
};

/**
 * Format จำนวนเงินให้มีคอมม่า
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format วันที่ให้เป็นภาษาไทย
 */
export const formatThaiDate = (date: Date | string | number): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'วันที่ไม่ถูกต้อง';
  }
  
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format เวลาเป็นแบบสั้น (เมื่อกี้นี้, 5 นาทีที่แล้ว, 2 ชั่วโมงที่แล้ว)
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
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

// ============== DATA UTILITIES ==============

/**
 * คำนวณงบประมาณเฉลี่ยของสมาชิกทั้งหมด
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
): {
  accommodation: number;
  transport: number;
  food: number;
  other: number;
  total: number;
} => {
  if (members.length === 0) {
    return {
      accommodation: 0,
      transport: 0,
      food: 0,
      other: 0,
      total: 0
    };
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
 * คำนวณจำนวนสมาชิกที่กรอกงบประมาณแล้ว
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
): { filled: number; total: number; percentage: number } => {
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
 * หาวันที่มีคนว่างมากที่สุด
 */
export const findBestDate = (
  members: Array<{ availability: boolean[] }>,
  dates: string[]
): { date: string; availableCount: number } | null => {
  if (members.length === 0 || dates.length === 0) {
    return null;
  }
  
  const availabilityCounts = dates.map((date, index) => ({
    date,
    count: members.filter(m => m.availability[index]).length
  }));
  
  const best = availabilityCounts.reduce((max, current) => 
    current.count > max.count ? current : max
  );
  
  return {
    date: best.date,
    availableCount: best.count
  };
};

// ============== STORAGE UTILITIES ==============

/**
 * บันทึกข้อมูลลง localStorage พร้อม error handling
 */
export const safeLocalStorageSet = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * ดึงข้อมูลจาก localStorage พร้อม error handling
 */
export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
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
export const safeLocalStorageRemove = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

// ============== EXPORT ALL ==============
export default {
  validateInviteCode,
  validateBudget,
  validateTripName,
  validateDays,
  formatInviteCode,
  formatCurrency,
  formatThaiDate,
  formatRelativeTime,
  calculateAverageBudget,
  countFilledBudgets,
  findBestDate,
  safeLocalStorageSet,
  safeLocalStorageGet,
  safeLocalStorageRemove
};