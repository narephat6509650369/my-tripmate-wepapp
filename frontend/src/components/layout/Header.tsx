import React, { useState } from 'react';
import { MapPin, Bell, Menu, X, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationPanel } from '../common/NotificationPanel';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const handleTabClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <>
      {/* ---------- MAIN HEADER ---------- */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">
          {/* Center Logo */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/homepage')}
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
              onClick={() => setNotificationOpen(true)}
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
                    {t('nav.logout')}
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

        {/* ---------- SUB-HEADER (Desktop) ---------- */}
        <div className="hidden md:block border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-4">
            <button
              onClick={() => handleTabClick('/homepage')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentPath === '/homepage'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
              }`}
            >
              {t('nav.trips')}
            </button>

            <button
              onClick={() => handleTabClick('/dashboard')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentPath === '/dashboard'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
              }`}
            >
              {t('nav.dashboard')}
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
                {t('nav.logout')}
              </button>

              {/* Mobile Sub-tabs */}
              <button
                onClick={() => handleTabClick('/homepage')}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPath === '/homepage' 
                    ? 'bg-blue-100 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('nav.trips')}
              </button>

              <button
                onClick={() => handleTabClick('/dashboard')}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPath === '/dashboard'
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('nav.dashboard')}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
};