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
  
  // Auth
  'auth.welcomeBack': { th: 'ยินดีต้อนรับกลับ', en: 'Welcome Back' },
  'auth.signIn': { th: 'เข้าสู่ระบบ', en: 'Sign in' },
  'auth.email': { th: 'อีเมล', en: 'Email' },
  'auth.password': { th: 'รหัสผ่าน', en: 'Password' },
  'auth.signInGoogle': { th: 'เข้าสู่ระบบด้วย Google', en: 'Sign in with Google' },
  'auth.demo': { th: 'Demo: ใส่อีเมลและรหัสผ่านอะไรก็ได้', en: 'Demo: Enter any email and password' },
  'auth.signingIn': { th: 'กำลังเข้าสู่ระบบ...', en: 'Signing in...' },
  
  // Home
  'home.welcomeBack': { th: 'ยินดีต้อนรับกลับ', en: 'Welcome back' },
  'home.readyToPlan': { th: 'พร้อมวางแผนการผจญภัยครั้งต่อไปของคุณแล้วหรือยัง?', en: 'Ready to plan your next adventure?' },
  'home.planPerfectTrip': { th: 'วางแผนทริปในฝันของคุณ', en: 'Plan Your Perfect Trip' },
  'home.collaborate': { th: 'ร่วมมือกับเพื่อนและสร้างความทรงจำที่น่าประทับใจ', en: 'Collaborate with friends and make amazing memories together' },
  'home.viewAllTrips': { th: 'ดูทริปทั้งหมด', en: 'View All Trips' },
  'home.totalTrips': { th: 'ทริปทั้งหมด', en: 'Total Trips' },
  'home.confirmed': { th: 'ยืนยันแล้ว', en: 'Confirmed' },
  'home.planning': { th: 'กำลังวางแผน', en: 'Planning' },
  
  // Trips
  'trips.myTrips': { th: 'ทริปของฉัน', en: 'My Trips' },
  'trips.createTrip': { th: 'สร้างทริป', en: 'Create Trip' },
  'trips.members': { th: 'สมาชิก', en: 'Members' },
  'trips.confirmed': { th: 'ยืนยันแล้ว', en: 'Confirmed' },
  'trips.planning': { th: 'กำลังวางแผน', en: 'Planning' },
  'trips.completed': { th: 'เสร็จสิ้น', en: 'Completed' },
  
  // Trip Detail
  'detail.backToTrips': { th: 'กลับไปหน้าทริป', en: 'Back to Trips' },
  'detail.voting': { th: 'การโหวต', en: 'Voting' },
  'detail.travelDate': { th: 'วันเดินทาง', en: 'Travel Date' },
  'detail.places': { th: 'สถานที่ท่องเที่ยว', en: 'Places' },
  'detail.budget': { th: 'งบประมาณ', en: 'Budget' },
  'detail.vote': { th: 'โหวต', en: 'Vote' },
  'detail.cancel': { th: 'ยกเลิก', en: 'Cancel' },
  'detail.votes': { th: 'โหวต', en: 'votes' },
  
  // Create Trip
  'create.createNewTrip': { th: 'สร้างทริปใหม่', en: 'Create New Trip' },
  'create.tripName': { th: 'ชื่อทริป', en: 'Trip Name' },
  'create.description': { th: 'รายละเอียด', en: 'Description' },
  'create.optional': { th: '(ไม่บังคับ)', en: '(Optional)' },
  'create.cancel': { th: 'ยกเลิก', en: 'Cancel' },
  'create.create': { th: 'สร้างทริป', en: 'Create' },
  'create.placeholder': { th: 'เช่น ทริปเชียงใหม่', en: 'e.g. Chiang Mai Trip' },
  'create.descPlaceholder': { th: 'เพิ่มรายละเอียดเกี่ยวกับทริป...', en: 'Add details about the trip...' },
  
  // Notifications
  'notif.notifications': { th: 'การแจ้งเตือน', en: 'Notifications' },
  'notif.markAllRead': { th: 'ทำเครื่องหมายว่าอ่านทั้งหมด', en: 'Mark all as read' },
  'notif.noNew': { th: 'ไม่มีการแจ้งเตือนใหม่', en: 'No new notifications' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'th';
  });

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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