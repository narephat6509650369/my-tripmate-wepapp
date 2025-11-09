import React from 'react';
import { Trip } from '../../types';
import { Users, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  const getStatusVariant = (status: Trip['status']) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'planning': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: Trip['status']) => {
    switch (status) {
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'planning': return 'กำลังวางแผน';
      case 'completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  return (
    <Card onClick={onClick} className="overflow-hidden p-0">
      {trip.imageUrl && (
        <img
          src={trip.imageUrl}
          alt={trip.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{trip.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{trip.description}</p>
            <Badge variant={getStatusVariant(trip.status)}>
              {getStatusText(trip.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{trip.memberCount} สมาชิก</span>
          </div>
          {trip.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(trip.startDate).toLocaleDateString('th-TH')}</span>
            </div>
          )}
          {trip.budget && (
            <div className="flex items-center gap-2 col-span-2">
              <DollarSign className="w-4 h-4" />
              <span>{trip.budget}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};