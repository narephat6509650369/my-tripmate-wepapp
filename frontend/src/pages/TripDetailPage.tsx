import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { VoteSection } from '../components/trip/VoteSection';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ArrowLeft, Users, Calendar, DollarSign } from 'lucide-react';
import { mockTrips, mockVoteCategories } from '../data/mockData';

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const trip = mockTrips.find(t => t.id === Number(id));

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 text-lg mb-4">ไม่พบทริปที่คุณต้องการ</p>
          <Button onClick={() => navigate('/trips')}>กลับไปหน้าทริป</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="secondary"
          onClick={() => navigate('/trips')}
          className="mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Trips
        </Button>

        {/* Trip Header */}
        {trip.imageUrl && (
          <img
            src={trip.imageUrl}
            alt={trip.name}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}

        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{trip.name}</h1>
              <p className="text-gray-600 mb-3">{trip.description}</p>
              <Badge variant="warning">กำลังวางแผน</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">สมาชิก</div>
                <div className="font-semibold">{trip.memberCount} คน</div>
              </div>
            </div>
            {trip.startDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">วันเดินทาง</div>
                  <div className="font-semibold">
                    {new Date(trip.startDate).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>
            )}
            {trip.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">งบประมาณ</div>
                  <div className="font-semibold">{trip.budget}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vote Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Voting</h2>
          {mockVoteCategories.map((category) => (
            <VoteSection key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
};