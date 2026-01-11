import React, { useState } from "react";
import { MapPin, Bell, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Users, Vote, CheckCircle } from "lucide-react";

// ✅ Import types และ utils
import type { Notification, NotificationType } from '../types/app.types';
import { formatRelativeTime } from '../utils/helpers';

interface HeaderProps {
  onLogout?: () => void;
}

interface UserInfo {
  name: string;
  email: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  
  // Mock Notifications with different types
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "trip_invite",
      text: "คุณถูกเชิญเข้าทริป 'สงขลา 3 วัน 2 คืน'",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      tripId: "trip123",
      tripName: "สงขลา 3 วัน 2 คืน"
    },
    {
      id: 2,
      type: "new_vote",
      text: "เปิดรอบโหวตใหม่ในทริป 'เชียงใหม่ 4 วัน 3 คืน'",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      tripId: "trip124",
      tripName: "เชียงใหม่ 4 วัน 3 คืน"
    },
    {
      id: 3,
      type: "vote_complete",
      text: "ผลโหวตเสร็จสิ้นแล้ว พร้อมยืนยันทริป 'ภูเก็ต 5 วัน 4 คืน'!",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      tripId: "trip125",
      tripName: "ภูเก็ต 5 วัน 4 คืน"
    },
    {
      id: 4,
      type: "trip_confirmed",
      text: "ทริป 'กรุงเทพ 2 วัน 1 คืน' ได้รับการยืนยันแล้ว!",
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      tripId: "trip126",
      tripName: "กรุงเทพ 2 วัน 1 คืน"
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "trip_invite":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "new_vote":
        return <Vote className="w-4 h-4 text-purple-500" />;
      case "vote_complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "trip_confirmed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user: UserInfo = {
    name: "User",
    email: "user@example.com"
  };
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const handleClickOutside = React.useCallback((event: MouseEvent) => {
    if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
      setNotiOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setProfileMenuOpen(false);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleNavigate = (path: string) => {
    navigate(path);
  }; 

  const handleLogout = () => {
    if (onLogout) onLogout();
    console.log("Logged out");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.tripId) {
      console.log(`Navigating to trip: ${notification.tripId}`);
    }
  };

  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addMockNotification = () => {
    const mockNotifications = [
      {
        type: "trip_invite" as NotificationType,
        text: "คุณถูกเชิญเข้าทริป 'พัทยา 2 วัน 1 คืน'",
        tripName: "พัทยา 2 วัน 1 คืน"
      },
      {
        type: "new_vote" as NotificationType,
        text: "เปิดรอบโหวตใหม่ในทริป 'อยุธยา 1 วัน'",
        tripName: "อยุธยา 1 วัน"
      },
      {
        type: "vote_complete" as NotificationType,
        text: "ผลโหวตเสร็จสิ้นแล้ว พร้อมยืนยันทริป 'ตราด 3 วัน 2 คืน'!",
        tripName: "ตราด 3 วัน 2 คืน"
      }
    ];

    const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    
    const newNotif: Notification = {
      id: Date.now(),
      type: randomNotif.type,
      text: randomNotif.text,
      read: false,
      timestamp: new Date(),
      tripId: `trip${Date.now()}`,
      tripName: randomNotif.tripName
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };
  
  const MAX_BADGE_COUNT = 9;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">

        {/* LOGO (Desktop - ตรงกลาง) */}
        <div
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleNavigate("/homepage")}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TripMate
          </h1>
        </div>

        {/* LOGO (Mobile - ซ้าย) */}
        <div 
          className="flex md:hidden items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleNavigate("/homepage")}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TripMate
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 ml-auto">

          {/* Notification Bell */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setNotiOpen(!notiOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-md animate-pulse">
                  {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
                </span>
              )}
            </button>

            {notiOpen && (
              <div className="fixed md:absolute right-2 md:right-0 left-20 md:left-auto mt-2 md:w-96 max-h-[70vh] overflow-hidden bg-white shadow-2xl rounded-lg border animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between sticky top-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    การแจ้งเตือน
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                    >
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">ไม่มีการแจ้งเตือน</p>
                      <p className="text-gray-400 text-sm mt-1">คุณอัพเดททุกอย่างแล้ว</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                          item.read
                            ? "bg-white hover:bg-gray-50"
                            : "bg-blue-50 hover:bg-blue-100"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(item.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`${item.read ? "text-gray-700" : "font-medium text-gray-900"} text-sm`}>
                              {item.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {/* ✅ ใช้ formatRelativeTime */}
                              {formatRelativeTime(item.timestamp.getTime())}
                            </p>
                          </div>

                          <button
                            onClick={(e) => deleteNotification(item.id, e)}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label="ลบการแจ้งเตือน"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Profile */}
          <div className="relative hidden md:block" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="เมนูโปรไฟล์"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b">
                  <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="เมนู"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Profile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;