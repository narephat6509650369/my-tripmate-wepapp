import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { TripCard } from '../components/trip/TripCard';
import { Button } from '../components/common/Button';
import { Plus } from 'lucide-react';
import { mockTrips } from '../data/mockData';

export const TripsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Trips</h2>
          <Button onClick={() => alert('สร้างทริปใหม่')}>
            <Plus className="w-5 h-5 mr-2" />
            Create Trip
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trips/${trip.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};