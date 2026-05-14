import React, { useEffect, useState } from 'react';
import { MapPin, Bell, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Users, Vote, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatRelativeTime } from "../utils";
import { notiApi } from "../services/tripService";
import { getSocket } from "../socket";

interface HeaderProps {
  onLogout?: () => void;
}

type NotificationType = 
  | 'trip_invitation' 
  | 'new_voting_session'
  | 'voting_closed'
  | 'trip_confirmed'
  | 'trip_archived'
  | 'member_joined'
  | 'member_removed'
  | 'trip_deleted';  

interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  read: boolean;
  timestamp: Date;
  tripId?: string;
  tripName?: string;
  subText?: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const getDisplayName = () =>
    user?.full_name || user?.email?.split("@")[0] || "User";
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [, forceUpdate] = useState(0);
  const [toast, setToast] = useState<{ text: string; type: string } | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchNoti = async () => {
      try {
        const res = await notiApi.getNoti();
        if (res?.success && Array.isArray(res.data?.notifications)) {
          setNotifications(res.data.notifications.map((n: any) => ({
            id: n.notification_id,
            type: n.notification_type,
            text: n.message || n.title,
            subText: n.email,
            read: Boolean(n.is_read),
            timestamp: new Date(new Date(n.created_at).getTime() + 7 * 60 * 60 * 1000),
            tripId: n.trip_id,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNoti();
  }, []);

  useEffect(() => {

  if (!user?.user_id) return;

  const socket = getSocket();
  if (!socket) return;

  const handleNewNotification = async () => {
    try {
      const res = await notiApi.getNoti();
      if (res?.success && Array.isArray(res.data?.notifications)) {
        const mapped = res.data.notifications.map((n: any) => ({
          id: n.notification_id,
          type: n.notification_type,
          text: n.message || n.title,
          subText: n.email,
          read: Boolean(n.is_read),
          timestamp: new Date(new Date(n.created_at).getTime() + 7 * 60 * 60 * 1000),
          tripId: n.trip_id,
        }));
        setNotifications(mapped);

        const latest = mapped.find((n: any) => !n.read);
        if (latest) {
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setToast({ text: latest.text, type: latest.type });
          toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
        }

        const closedNoti = mapped.find((n: any) =>
          ["trip_confirmed", "voting_closed", "trip_archived"].includes(n.type) &&
          n.tripId &&
          window.location.pathname.includes(n.tripId)
        );
        if (closedNoti) {
          navigate(`/votepage/${closedNoti.tripId}`);
        }
      }
    } catch (err) {
      console.error("Failed to reload notifications:", err);
    }
  };

  const handleConnect = () => {
    socket.emit("join_user", user.user_id);
  };

  socket.on("connect", handleConnect);
  socket.on("new_notification", handleNewNotification);

  return () => {
    socket.off("new_notification", handleNewNotification);
    socket.off("connect", handleConnect);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  };

}, [user?.user_id]);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "trip_invitation":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "new_voting_session":
        return <Vote className="w-4 h-4 text-purple-500" />;
      case "voting_closed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "trip_confirmed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "trip_archived":
        return <X className="w-4 h-4 text-gray-500" />;
      case "member_joined":
        return <Users className="w-4 h-4 text-blue-400" />;
      case "member_removed":
        return <X className="w-4 h-4 text-red-400" />;
      case "trip_deleted":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    logout();
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notiApi.markAllAsRead();
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await notiApi.markAsRead(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setNotiOpen(false);
    if (notification.tripId) {
      navigate(`/votepage/${notification.tripId}`);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notiApi.deleteNoti(id);
  };

  const addMockNotification = () => {
    const mockNotifications = [
      {
        type: "trip_invitation" as NotificationType,
        text: "คุณถูกเชิญเข้าทริป 'พัทยา 2 วัน 1 คืน'",
        tripName: "พัทยา 2 วัน 1 คืน"
      },
      {
        type: "new_voting_session" as NotificationType,
        text: "เปิดรอบโหวตใหม่ในทริป 'อยุธยา 1 วัน'",
        tripName: "อยุธยา 1 วัน"
      },
      {
        type: "voting_closed" as NotificationType,
        text: "ผลโหวตเสร็จสิ้นแล้ว พร้อมยืนยันทริป 'ตราด 3 วัน 2 คืน'!",
        tripName: "ตราด 3 วัน 2 คืน"
      },
      {
        type: "trip_deleted" as NotificationType,
        text: "ทริป 'เชียงใหม่ 3 วัน 2 คืน' ถูกลบโดยผู้จัดการทริป",
        tripName: "เชียงใหม่ 3 วัน 2 คืน"
      }
    ];

    const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    
    const newNotif: Notification = {
      id: `mock-${Date.now()}`,
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

  const AvatarDisplay = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClass = {
      sm: "w-9 h-9 text-sm",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-lg",
    }[size];

    if (user?.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={getDisplayName()}
          className={`${sizeClass} rounded-full border-2 border-white shadow-md object-cover`}
        />
      );
    }
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md`}>
        {getInitial()}
      </div>
    );
  };

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
                            {item.subText && (
                              <p className="text-xs text-blue-500 mt-0.5">{item.subText}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
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
              className="flex items-center gap-3 hover:bg-gray-100 rounded-full p-1 pr-3 transition-all duration-200"
              aria-label="เมนูโปรไฟล์"
            >
              {/* Avatar with initial */}
              <div className="relative">
                <AvatarDisplay size="md" />
                {/* <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" /> */}
              </div>

              {/* User Info */}
              {/* <div className="text-left">
                <p className="font-medium text-sm text-gray-900 leading-tight max-w-[150px] truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 max-w-[150px] truncate">
                  {user?.email}
                </p>
              </div> */}

              {/* Chevron */}
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info in Dropdown */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <AvatarDisplay size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
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
              <AvatarDisplay size="md" />
              <div>
                <p className="font-medium text-gray-900">{getDisplayName()}</p>
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-in slide-in-from-right duration-300">
          <span className="text-xl flex-shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{toast.text}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
