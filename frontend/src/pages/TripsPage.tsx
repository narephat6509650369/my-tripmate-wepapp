import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { TripCard } from '../components/trip/TripCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus } from 'lucide-react';
import { mockTrips } from '../data/mockData';
import { Trip } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const TripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDesc, setNewTripDesc] = useState('');
  const { t } = useLanguage();

  const handleCreateTrip = () => {
    if (!newTripName.trim()) return;

    const newTrip: Trip = {
      id: trips.length + 1,
      name: newTripName,
      description: newTripDesc,
      status: 'planning',
      memberCount: 1,
    };

    setTrips([newTrip, ...trips]);
    setNewTripName('');
    setNewTripDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Trips</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Trip
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trips/${trip.id}`)}
            />
          ))}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-600 text-lg mb-4">ยังไม่มีทริป</p>
            <p className="text-gray-500">เริ่มต้นสร้างทริปแรกของคุณกันเลย!</p>
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
              รายละเอียด
            </label>
            <textarea
              value={newTripDesc}
              onChange={(e) => setNewTripDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="เพิ่มรายละเอียดเกี่ยวกับทริป..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleCreateTrip} className="flex-1">
              สร้างทริป
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};