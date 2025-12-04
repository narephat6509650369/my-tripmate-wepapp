// utils/inviteCode.ts
// Utility Function สำหรับ Invite Code
// 3.2.1.6	การแชร์และเชิญเพื่อน
// 	FR6.1 ระบบต้องสร้างลิงก์เชิญที่ไม่ซ้ำกันสำหรับแต่ละทริปอัตโนมัติ
// 	FR6.2 ระบบต้องสร้างรหัสห้อง (Invite Code) ที่มีความยาว 16 ตัวอักษรและไม่ซ้ำกัน
// 	FR6.3 ระบบต้องตรวจสอบความถูกต้องของรหัสเชิญก่อนอนุญาตให้เข้าร่วม

export const generateInviteCode = (): string => {  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ตัดอักษรที่สับสนออก (I, O, 0, 1)
  let code = '';
  
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-'; // เพิ่ม - ทุก 4 ตัว เช่น ABCD-EFGH-IJKL-MNOP
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

export const validateInviteCode = (code: string): boolean => {
  // ต้องมีความยาว 19 ตัว (16 ตัวอักษร + 3 เครื่องหมาย -)
  const pattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(code);
};

export const isCodeExists = (code: string): boolean => {
  return localStorage.getItem(`trip_${code}`) !== null;
};

export const generateUniqueInviteCode = (): string => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateInviteCode();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('ไม่สามารถสร้างรหัสเชิญที่ไม่ซ้ำได้ กรุณาลองใหม่อีกครั้ง');
    }
  } while (isCodeExists(code));
  
  return code;
};