import React, { useState } from 'react';
import { MapPin, Bell, Menu, X, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationPanel } from '../common/NotificationPanel';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
    console.log("User logged out:", user);
    navigate('/');
    console.log("Navigated to /");
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    console.log("Language toggled");
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const handleTabClick = (tab: string, path: string) => {
    console.log("Sub-tab clicked:", tab);
    setActiveTab(tab);
    navigate(path);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <>
      {/* ---------- HEADER ---------- */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">
          {/* Center Logo */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">TripMate</h1>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">{language.toUpperCase()}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => { setNotificationOpen(true); console.log("Notification clicked"); }}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userInitial}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* ---------- Mobile Menu ---------- */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userInitial}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg"
              >
                Logout
              </button>

              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); console.log("Mobile Home clicked"); }}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Home
              </button>

              {/* ---------- Mobile Sub-tabs ---------- */}
              {['upcoming','past'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { handleTabClick(tab, `/trips/${tab}`); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {tab === 'upcoming' ? 'ทริปของฉัน' : 'แดชบอร์ด'}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ---------- Sub-tabs (Desktop) ---------- */}
      <nav className="bg-white shadow-sm sticky top-16 z-30 hidden md:flex">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-12">
          {['upcoming','past'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab, `/trips/${tab}`)}
              className={`px-3 py-1 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-800 hover:text-blue-600'
              }`}
            >
              {tab === 'upcoming' ? 'ทริปของฉัน' : 'แดชบอร์ด'}
            </button>
          ))}
        </div>
      </nav>

      {/* Notifications */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
};
