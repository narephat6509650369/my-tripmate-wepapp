import React from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'New vote on Chiang Mai Trip',
    message: 'Somchai voted for travel dates',
    time: '5 min ago',
    isRead: false,
  },
  {
    id: 2,
    title: 'Trip confirmed',
    message: 'Phuket Trip has been confirmed!',
    time: '2 hours ago',
    isRead: false,
  },
  {
    id: 3,
    title: 'New member joined',
    message: 'Wichai joined Bangkok Trip',
    time: '1 day ago',
    isRead: true,
  },
];

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = React.useState(mockNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {t('notif.notifications')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            {t('notif.markAllRead')}
          </button>
        </div>

        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${
                !notification.isRead ? 'bg-blue-50' : 'hover:bg-gray-50'
              } cursor-pointer transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    !notification.isRead ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('notif.noNew')}</p>
          </div>
        )}
      </div>
    </>
  );
};