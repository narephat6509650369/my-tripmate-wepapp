import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Plus, MapPin, TrendingUp, Users } from 'lucide-react';
import { mockTrips } from '../data/mockData';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const stats = {
    total: mockTrips.length,
    confirmed: mockTrips.filter(t => t.status === 'confirmed').length,
    planning: mockTrips.filter(t => t.status === 'planning').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Plan Your Perfect Trip
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Collaborate with friends and make amazing memories together
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/trips')}
          >
            <Plus className="w-5 h-5 mr-2" />
            View All Trips
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-gray-600">Total Trips</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.confirmed}</div>
                <div className="text-gray-600">Confirmed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.planning}</div>
                <div className="text-gray-600">Planning</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};