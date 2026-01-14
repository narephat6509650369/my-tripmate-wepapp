// src/pages/VotePage/components/StepSummary.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, ArrowRight } from 'lucide-react';
import type { TripDetail } from '../../../types';

// ============== TYPES ==============
interface StepSummaryProps {
  trip: TripDetail;
  onNavigateToStep?: (step: number) => void;
}

// ============== COMPONENT ==============
export const StepSummary: React.FC<StepSummaryProps> = ({ 
  trip, 
  onNavigateToStep 
}) => {
  const navigate = useNavigate();

  // ============== HANDLERS ==============
  const handleViewFullSummary = () => {
    navigate(`/summary/${trip.trip_id}`);
  };

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          ✅ เสร็จสิ้น!
        </h2>
        
        <p className="text-gray-600 mb-6">
          คุณได้กรอกข้อมูลเรียบร้อยแล้ว รอให้เพื่อนๆ กรอกข้อมูลให้ครบ 
          แล้วเจ้าของทริปจะปิดการโหวตและดูผลสรุปได้
        </p>

        {/* Quick Edit Buttons */}
        {onNavigateToStep && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-3 font-semibold">
              🔧 ต้องการแก้ไขข้อมูล?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigateToStep(2)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium transition"
              >
                <Edit3 className="w-4 h-4" />
                แก้ไขวันที่
              </button>
              <button
                onClick={() => onNavigateToStep(3)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium transition"
              >
                <Edit3 className="w-4 h-4" />
                แก้ไขงบประมาณ
              </button>
              <button
                onClick={() => onNavigateToStep(4)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium transition"
              >
                <Edit3 className="w-4 h-4" />
                แก้ไขจังหวัด
              </button>
            </div>
          </div>
        )}

        {/* Trip Info Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">🎉</span>
            <h3 className="text-xl font-bold text-gray-800">ข้อมูลทริป</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-sm text-gray-600">ชื่อทริป</p>
                <p className="font-semibold text-gray-800">{trip.trip_name}</p>
              </div>
            </div>

            {trip.description && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-sm text-gray-600">รายละเอียด</p>
                  <p className="text-gray-700">{trip.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-sm text-gray-600">จำนวนวัน</p>
                <p className="font-semibold text-gray-800">{trip.num_days} วัน</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm text-gray-600">จำนวนสมาชิก</p>
                <p className="font-semibold text-gray-800">{trip.member_count} คน</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🔖</span>
              <div>
                <p className="text-sm text-gray-600">รหัสทริป</p>
                <p className="font-mono font-semibold text-blue-600">{trip.invite_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <p className="font-semibold text-yellow-900 mb-2">⏳ รอเพื่อนๆ กรอกข้อมูล</p>
          <p className="text-yellow-800 text-sm">
            เมื่อทุกคนกรอกข้อมูลครบแล้ว เจ้าของทริปจะสามารถปิดการโหวตและดูผลสรุปได้
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewFullSummary}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
        >
          <span>ดูหน้าสรุปผล</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-gray-500 text-sm mt-3">
          💡 คุณสามารถกลับมาแก้ไขข้อมูลได้ตลอดเวลา
        </p>
      </div>

      {/* Tips */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
        <p className="font-semibold text-purple-900 mb-2">💡 เคล็ดลับ</p>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• แชร์รหัสทริปให้เพื่อนๆ เข้าร่วม</li>
          <li>• ตรวจสอบว่าทุกคนกรอกข้อมูลแล้วหรือยัง</li>
          <li>• เจ้าของทริปสามารถปิดการโหวตได้เมื่อข้อมูลครบ</li>
        </ul>
      </div>
    </div>
  );
};

export default StepSummary;