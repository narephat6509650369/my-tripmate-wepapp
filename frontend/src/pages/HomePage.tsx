import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { Modal } from '../components/common/Modal';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [roomCode, setRoomCode] = useState('');

  // Modal Create Trip
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDays, setTripDays] = useState('');
  const [tripDetails, setTripDetails] = useState('');

  // Fake data
  const myTrips = [
    {
      title: 'กรุงเชียงใหม่',
      status: t('status.planning'),
      travelers: 3,
      destinations: [
        { name: 'วันที่เดินทาง', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'สถานที่ท่องเที่ยว', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'งบประมาณ', duration: '3 ตัวเลือก', nights: '2 โควต' }
      ]
    },
    {
      title: 'กรุงเชียงใหม่',
      status: t('status.confirmed'),
      travelers: 3,
      destinations: [
        { name: 'วันที่เดินทาง', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'สถานที่ท่องเที่ยว', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'งบประมาณ', duration: '3 ตัวเลือก', nights: '2 โควต' }
      ]
    }
  ];

  const joinedTrips = [
    {
      title: 'กรุงเชียงใหม่',
      status: t('status.planning'),
      travelers: 3,
      destinations: [
        { name: 'วันที่เดินทาง', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'สถานที่ท่องเที่ยว', duration: '3 ตัวเลือก', nights: '2 โควต' },
        { name: 'งบประมาณ', duration: '3 ตัวเลือก', nights: '2 โควต' }
      ]
    }
  ];

  // Card Component
  const TripCard = ({ title, status, travelers, destinations }: any) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mt-1">
            {status}
          </span>
        </div>
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-3">
        <Users className="w-4 h-4 mr-1" />
        <span>{travelers} {t('home.travelers')}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {destinations.map((dest: any, index: number) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded p-2">
            <div className="text-xs text-gray-600">{dest.name}</div>
            <div className="font-semibold text-sm text-gray-800">{dest.duration}</div>
            <div className="text-xs text-gray-600">{dest.nights}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Section Component
  const TripSection = ({ title, trips }: any) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        {trips.map((trip: any, index: number) => (
          <TripCard key={index} {...trip} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Trip / Join Trip */}
        <div className="flex items-center space-x-4 mb-8">
          {/* Create Trip Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            <span className="text-lg">{t('home.createTrip')}</span>
          </button>

          {/* Join Trip */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder={t('home.enterCode')}
              className="px-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="px-6 py-4 rounded-lg font-medium transition flex items-center shadow-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
            >
              {t('common.join')}
            </button>
          </div>
        </div>

        {/* Sections */}
        <TripSection title={t('home.myTrips')} trips={myTrips} />
        <TripSection title={t('home.joinedTrips')} trips={joinedTrips} />
      </main>

      {/* ======================== */}
      {/* Modal: Create Trip */}
      {/* ======================== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('home.createTrip')}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={t('modal.tripName')}
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="number"
            placeholder={t('modal.tripDays')}
            value={tripDays}
            onChange={(e) => setTripDays(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <textarea
            placeholder={t('modal.tripDetails')}
            value={tripDetails}
            onChange={(e) => setTripDetails(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            {t('common.cancel')}
          </button>

          <button
            onClick={() => {
              console.log('สร้างทริป:', tripName, tripDays, tripDetails);
              setShowCreateModal(false);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>

    </div>
  );
};
