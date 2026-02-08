// src/pages/VotePage/components/StepSummary.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, ArrowRight } from 'lucide-react';
import type { TripCard, TripDetail } from '../../../types';

// ============== TYPES ==============
interface UserInputSummary {
  dates: string[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
  };
  locations: { place: string; score: number }[];
}

interface StepSummaryProps {
  trip: TripDetail;
  onNavigateToStep?: (step: number) => void;
  userInput?: UserInputSummary;  
  isOwner?: boolean;           
  canViewSummary?: boolean;       // (owner หรือ ครบ 7 วัน)
}

// ============== COMPONENT ==============
export const StepSummary: React.FC<StepSummaryProps> = ({ 
  trip, 
  onNavigateToStep,
  userInput,   
  isOwner,         
  canViewSummary 
}) => {
  const navigate = useNavigate();

  // ============== HANDLERS ==============
  const handleViewFullSummary = () => {
    navigate(`/summary/${trip.tripid}`);
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
          แล้วเจ้าของทริปจะปิดการโหวตหรือครบ7วันหลังสร้างห้องและดูผลสรุปได้
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
                <p className="font-semibold text-gray-800">{trip.tripname}</p>
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
                <p className="font-semibold text-gray-800">{trip.numdays} วัน</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm text-gray-600">จำนวนสมาชิก</p>
                {/*<p className="font-semibold text-gray-800">{trip.membercount} คน</p>*/}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🔖</span>
              <div>
                <p className="text-sm text-gray-600">รหัสทริป</p>
                <p className="font-mono font-semibold text-blue-600">{trip.invitecode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* การกรอกของฉัน ← เพิ่มตรงนี้ */}
        {userInput && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span> การกรอกของคุณ
            </h3>

            {/* วันที่ */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">📅 วันที่เลือก</p>
              {userInput.dates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userInput.dates.sort().map((date) => (
                    <span key={date} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-600">❌ ยังไม่ได้เลือกวันที่</p>
              )}
            </div>

            {/* งบประมาณ */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">💰 งบประมาณ</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'accommodation', label: 'ที่พัก' },
                  { key: 'transport', label: 'เดินทาง' },
                  { key: 'food', label: 'อาหาร' },
                  { key: 'other', label: 'สำรอง' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between bg-white rounded-lg px-3 py-1.5 border border-blue-100">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-semibold text-blue-700">
                      ฿{userInput.budget[key as keyof typeof userInput.budget].toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* จังหวัด */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">📍 จังหวัดที่โหวต</p>
              {userInput.locations.length > 0 ? (
                <div className="space-y-1">
                  {userInput.locations
                    .sort((a, b) => b.score - a.score)
                    .map((loc, idx) => (
                      <div key={loc.place} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-blue-100">
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                        <span className="text-sm text-gray-700">{loc.place}</span>
                        <span className="ml-auto text-xs text-gray-500">({loc.score} คะแนน)</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-red-600">❌ ยังไม่ได้โหวตจังหวัด</p>
              )}
            </div>
          </div>
        )}

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
          disabled={!canViewSummary}
          className={`w-full px-6 py-4 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
            canViewSummary
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>{canViewSummary ? 'ดูหน้าสรุปผล' : '🔒 รอครบ 7 วันก่อน'}</span>
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