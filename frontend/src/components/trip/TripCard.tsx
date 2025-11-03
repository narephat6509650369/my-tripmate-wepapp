// ==========================================
// 📁 src/components/trip/TripCard.tsx
// ==========================================

import React from 'react';
import { Trip } from '../../types';
import { Users, Calendar, DollarSign, MapPin } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  const getStatusVariant = (status: Trip['status']) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'planning':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: Trip['status']) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'planning':
        return 'กำลังวางแผน';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  return (
    <Card hover onClick={onClick} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{trip.name}</h3>
          {trip.description && (
            <p className="text-gray-600 text-sm mb-2">{trip.description}</p>
          )}
          <Badge variant={getStatusVariant(trip.status)}>
            {getStatusText(trip.status)}
          </Badge>
        </div>
        {trip.unread_count && trip.unread_count > 0 && (
          <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {trip.unread_count}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{trip.members?.length || 0} สมาชิก</span>
        </div>
        {trip.start_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(trip.start_date).toLocaleDateString('th-TH')}</span>
          </div>
        )}
        {trip.budget_min && trip.budget_max && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>
              {trip.budget_min.toLocaleString()}-{trip.budget_max.toLocaleString()} ฿
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{trip.votes?.length || 0} การโหวต</span>
        </div>
      </div>
    </Card>
  );
};