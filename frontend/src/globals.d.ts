// frontend/src/globals.d.ts
export {}; // ทำให้ไฟล์นี้เป็น module

declare global {
  interface Window {
    user_id?: string; // ประกาศ user_id บน window
  }

  var user_id: string; // หรือใช้ globalThis.user_id
}
