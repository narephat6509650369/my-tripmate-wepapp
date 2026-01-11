// ⭐ สร้างไฟล์ใหม่ src/utils/safeStorage.ts

export const safeLocalStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('localStorage.setItem failed:', error);
      
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('พื้นที่เก็บข้อมูลเต็ม กรุณาลบข้อมูลเก่า');
      }
      
      return false;
    }
  },
  
  getItem: (key: string): string | null => {
    try { 
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem failed:', error);
      return null;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('localStorage.removeItem failed:', error);
      return false;
    }
  }
};