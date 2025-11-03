// ==========================================
// 📁 src/pages/TripsPage.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { TripCard } from '../components/trip/TripCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Loading } from '../components/common/Loading';
import { Plus, TrendingUp } from 'lucide-react';
import { Trip } from '../types';
import { tripService } from '../services/tripService';

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDesc, setNewTripDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'trips' | 'stats'>('trips');
  const navigate = useNavigate();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await tripService.getAll();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;

    setCreating(true);
    try {
      const newTrip = await tripService.create({
        name: newTripName,
        description: newTripDesc,
      });
      setTrips([newTrip, ...trips]);
      setNewTripName('');
      setNewTripDesc('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setCreating(false);
    }
  };

  const stats = {
    total: trips.length,
    confirmed: trips.filter((t) => t.status === 'confirmed').length,
    planning: trips.filter((t) => t.status === 'planning').length,
    completed: trips.filter((t) => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <Loading text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'trips' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('trips')}
          >
            ทริปของฉัน
          </Button>
          <Button
            variant={activeTab === 'stats' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('stats')}
            icon={<TrendingUp className="w-4 h-4" />}
          >
            สถิติ
          </Button>
        </div>

        {activeTab === 'trips' && (
          <>
            {/* Create Trip Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
              className="w-full mb-6"
              size="lg"
            >
              สร้างทริปใหม่
            </Button>

            {/* Trips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                />
              ))}
            </div>

            {trips.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">ยังไม่มีทริป</p>
                <p className="text-gray-500">เริ่มต้นสร้างทริปแรกของคุณกันเลย!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
              <div className="text-gray-600">ทริปทั้งหมด</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.confirmed}</div>
              <div className="text-gray-600">ยืนยันแล้ว</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.planning}</div>
              <div className="text-gray-600">กำลังวางแผน</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.completed}</div>
              <div className="text-gray-600">เสร็จสิ้น</div>
            </div>
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="สร้างทริปใหม่"
      >
        <div className="space-y-4">
          <Input
            label="ชื่อทริป"
            value={newTripName}
            onChange={(e) => setNewTripName(e.target.value)}
            placeholder="เช่น ทริปเชียงใหม่"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด (ไม่บังคับ)
            </label>
            <textarea
              value={newTripDesc}
              onChange={(e) => setNewTripDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="เพิ่มรายละเอียดเกี่ยวกับทริป..."
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleCreateTrip} loading={creating} className="flex-1">
              สร้างทริป
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripsPage;