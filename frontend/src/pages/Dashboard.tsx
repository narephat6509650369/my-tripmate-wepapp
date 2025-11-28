// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Plus, MapPin, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips from API
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const resMy = await api.get('/trips/my');        // ทริปของตัวเอง
        const resJoined = await api.get('/trips/joined'); // ทริปที่เข้าร่วม
        setMyTrips(resMy.data.data || []);
        setJoinedTrips(resJoined.data.data || []);
      } catch (err) {
        console.error('Failed to fetch trips:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Calculate stats
  const stats = {
    totalTrips: myTrips.length + joinedTrips.length,
    confirmedTrips: [...myTrips, ...joinedTrips].filter(t => t.status === t('status.confirmed')).length,
    planningTrips: [...myTrips, ...joinedTrips].filter(t => t.status === t('status.planning')).length
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-xl p-8 shadow-md mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            {t('dashboard.title')} 🎉
          </h2>
          <p className="text-xl text-gray-600">
            {t('dashboard.welcome')} {user?.name} {t('dashboard.ready')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            {t('dashboard.manage')}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {t('dashboard.subtitle')}
          </p>
          <Button
            onClick={() => navigate('/Homepage')}
            className="text-lg px-8 py-3"
          >
            <div className="w-5 h-5 mr-2 inline" />
            {t('dashboard.viewAll')}
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.totalTrips}</div>
                <div className="text-gray-600">{t('dashboard.totalTrips')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.confirmedTrips}</div>
                <div className="text-gray-600">{t('dashboard.confirmed')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.planningTrips}</div>
                <div className="text-gray-600">{t('dashboard.planning')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
