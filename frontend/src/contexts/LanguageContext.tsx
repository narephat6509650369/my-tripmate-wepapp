import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'th' | 'en';

interface Translations {
  [key: string]: {
    th: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { th: 'หน้าแรก', en: 'Home' },
  'nav.trips': { th: 'ทริปของฉัน', en: 'My Trips' },
  'nav.dashboard': { th: 'แดชบอร์ด', en: 'Dashboard' },
  'nav.logout': { th: 'ออกจากระบบ', en: 'Logout' },
  
  // Auth
  'auth.welcomeBack': { th: 'ยินดีต้อนรับกลับ', en: 'Welcome Back' },
  'auth.signIn': { th: 'เข้าสู่ระบบ', en: 'Sign in' },
  'auth.email': { th: 'อีเมล', en: 'Email' },
  'auth.password': { th: 'รหัสผ่าน', en: 'Password' },
  'auth.signInGoogle': { th: 'เข้าสู่ระบบด้วย Google', en: 'Sign in with Google' },
  
  // Home
  'home.createTrip': { th: 'สร้างทริปใหม่', en: 'Create New Trip' },
  'home.joinTrip': { th: 'เข้าร่วมทริป', en: 'Join Trip' },
  'home.enterCode': { th: 'ใส่รหัสห้อง', en: 'Enter Room Code' },
  'home.myTrips': { th: 'ทริปที่ฉันสร้าง', en: 'Trips I Created' },
  'home.joinedTrips': { th: 'ทริปที่เข้าร่วม', en: 'Joined Trips' },
  'home.travelers': { th: 'คนเดินทาง', en: 'Travelers' },
  
  // Dashboard
  'dashboard.title': { th: 'แดชบอร์ดของคุณ', en: 'Your Dashboard' },
  'dashboard.welcome': { th: 'สวัสดี', en: 'Hello' },
  'dashboard.ready': { th: 'พร้อมออกเดินทางครั้งต่อไปหรือยัง?', en: 'Ready for your next journey?' },
  'dashboard.manage': { th: 'จัดการทริปของคุณได้ที่นี่', en: 'Manage Your Trips Here' },
  'dashboard.subtitle': { th: 'สร้างทริปใหม่ ตรวจสอบสถานะ และติดตามความคืบหน้าแบบง่าย ๆ', en: 'Create new trips, check status, and track progress easily' },
  'dashboard.viewAll': { th: 'ดูทริปทั้งหมด', en: 'View All Trips' },
  'dashboard.totalTrips': { th: 'ทริปทั้งหมด', en: 'Total Trips' },
  'dashboard.confirmed': { th: 'ทริปที่ยืนยันแล้ว', en: 'Confirmed Trips' },
  'dashboard.planning': { th: 'กำลังวางแผน', en: 'Planning' },
  
  // Trip Status
  'status.planning': { th: 'กำลังดำเนินการวางแพลน', en: 'Planning' },
  'status.confirmed': { th: 'ทริปถูกยืนยันแล้ว', en: 'Confirmed' },
  'status.completed': { th: 'เสร็จสิ้น', en: 'Completed' },
  
  // Common
  'common.loading': { th: 'กำลังโหลด...', en: 'Loading...' },
  'common.join': { th: 'เข้าร่วม', en: 'Join' },
  'common.cancel': { th: 'ยกเลิก', en: 'Cancel' },
  'common.save': { th: 'บันทึก', en: 'Save' },

  //Modal
  'modal.createTrip': { th: 'สร้างทริปใหม่', en: 'Create New Trip' },
  'modal.tripName': { th: 'ชื่อทริป', en: 'Trip Name' },
  'modal.tripDays': { th: 'จำนวนวัน', en: 'Number of Days' },
  'modal.tripDetails': { th: 'รายละเอียดทริป', en: 'Trip Details' },
  
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ ใช้ state เพียงอย่างเดียว ไม่ใช้ localStorage
  const [language, setLanguage] = useState<Language>('th');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};