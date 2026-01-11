import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Calendar, Edit3 } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { formatCurrency } from '../../../utils/helpers';
import { TripData, Member } from '../../../data/mockData';

// ============== TYPES ==============
interface StepSummaryProps {
  trip: TripData;
  memberBudget: Member | null;
  tripCode: string;
  onNavigateToStep: (step: number) => void;
}

// ============== CONSTANTS ==============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

// ============== COMPONENT ==============
export const StepSummary: React.FC<StepSummaryProps> = ({
  trip,
  memberBudget,
  tripCode,
  onNavigateToStep
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ============== COMPUTED VALUES ==============
  const memberStats = {
    total: trip.members?.length || 0,
    completedBudget: trip.members?.filter(m => 
      m.budget.accommodation > 0 && 
      m.budget.transport > 0 && 
      m.budget.food > 0
    ).length || 0,
    votedProvince: trip.provinceVotes?.length || 0,
    votedDate: trip.dateVotes?.length || 0
  };

  const allDataComplete = 
    memberStats.completedBudget === memberStats.total &&
    memberStats.votedProvince === memberStats.total &&
    memberStats.votedDate === memberStats.total;

  const getBestDateRange = () => {
    if (!trip.memberAvailability || trip.memberAvailability.length === 0) {
      return null;
    }

    const tripDays = trip.days || 3;
    const allDates = new Set<string>();
    
    trip.memberAvailability.forEach(m => {
      m.availableDates.forEach(date => allDates.add(date));
    });

    const sortedDates = Array.from(allDates).sort();
    let bestRange = null;
    let maxCount = 0;

    for (let i = 0; i <= sortedDates.length - tripDays; i++) {
      const rangeStart = new Date(sortedDates[i]);
      const rangeEnd = new Date(sortedDates[i + tripDays - 1]);
      const daysDiff = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === tripDays - 1) {
        const datesInRange = sortedDates.slice(i, i + tripDays);
        const membersAvailable = trip.memberAvailability!.filter(member => {
          return datesInRange.every(date => member.availableDates.includes(date));
        });

        if (membersAvailable.length > maxCount) {
          maxCount = membersAvailable.length;
          bestRange = {
            dates: datesInRange,
            count: membersAvailable.length,
            percentage: Math.round((membersAvailable.length / trip.members!.length) * 100)
          };
        }
      }
    }

    return bestRange;
  };

  const bestDateRange = getBestDateRange();
  const topProvinces = (trip.voteResults?.provinces || []).slice(0, 3);

  const avgBudget = {
    accommodation: 0,
    transport: 0,
    food: 0,
    other: 0,
    total: 0
  };

  if (trip.members && trip.members.length > 0) {
    trip.members.forEach(m => {
      avgBudget.accommodation += m.budget.accommodation;
      avgBudget.transport += m.budget.transport;
      avgBudget.food += m.budget.food;
      avgBudget.other += m.budget.other;
    });

    Object.keys(avgBudget).forEach(key => {
      avgBudget[key as keyof typeof avgBudget] /= trip.members!.length;
    });

    avgBudget.total = avgBudget.accommodation + avgBudget.transport + avgBudget.food + avgBudget.other;
  }

  // ============== HANDLERS ==============
  const handleCloseVoting = async () => {
    if (!allDataComplete) {
      alert(`⚠️ ข้อมูลยังไม่ครบ!\n\n` +
        `งบประมาณ: ${memberStats.completedBudget}/${memberStats.total} คน\n` +
        `โหวตจังหวัด: ${memberStats.votedProvince}/${memberStats.total} คน\n` +
        `โหวตวันที่: ${memberStats.votedDate}/${memberStats.total} คน\n\n` +
        `กรุณาให้ทุกคนกรอกข้อมูลให้ครบก่อนปิดการโหวต`
      );
      return;
    }

    setIsClosing(true); 

    if (!confirm(
      "ต้องการปิดการโหวตและบันทึกผลหรือไม่?\n\n" +
      "⚠️ เมื่อปิดแล้ว สมาชิกจะไม่สามารถแก้ไขข้อมูลได้อีก"
    )) {
      setIsClosing(false);
      return;
    }
    
    try {
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Closing trip (mock)');
        await new Promise(resolve => setTimeout(resolve, 500));
        response = { success: true };
      } else {
        log.api('Closing trip via API');
        response = await tripAPI.closeTrip(tripCode);
      }
      
      if (response.success) {
        alert("✓ ปิดการโหวตเรียบร้อย! กำลังนำไปหน้าสรุปผล...");
        navigate(`/summaryPage/${tripCode}`);
      } else {
        throw new Error(response.message || 'ไม่สามารถปิดการโหวตได้');
      }
    } catch (error: any) {
      log.error("Error closing trip:", error);
      alert("เกิดข้อผิดพลาดในการปิดการโหวต");
    } finally {
      setIsClosing(false); 
    }
  };

  // ============== RENDER ==============
  // ============== RENDER ==============
return (
  <div className="space-y-6">
    {/* ============== Header ============== */}
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        ✅ พร้อมปิดการโหวตหรือยัง?
      </h2>
      
      {/* ✅ Quick Edit Buttons */}
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
      
      {/* ✅ Progress Stats - Compact Version */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`p-3 rounded-lg border-2 text-center ${
          memberStats.completedBudget === memberStats.total
            ? 'border-green-500 bg-green-50'
            : 'border-amber-500 bg-amber-50'
        }`}>
          <div className="text-xs text-gray-600 mb-1">งบประมาณ</div>
          <div className="text-xl font-bold">
            {memberStats.completedBudget}/{memberStats.total}
          </div>
          {memberStats.completedBudget === memberStats.total ? (
            <Check className="w-5 h-5 mx-auto mt-1 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 mx-auto mt-1 text-amber-600" />
          )}
        </div>

        <div className={`p-3 rounded-lg border-2 text-center ${
          memberStats.votedProvince === memberStats.total
            ? 'border-green-500 bg-green-50'
            : 'border-amber-500 bg-amber-50'
        }`}>
          <div className="text-xs text-gray-600 mb-1">โหวตจังหวัด</div>
          <div className="text-xl font-bold">
            {memberStats.votedProvince}/{memberStats.total}
          </div>
          {memberStats.votedProvince === memberStats.total ? (
            <Check className="w-5 h-5 mx-auto mt-1 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 mx-auto mt-1 text-amber-600" />
          )}
        </div>

        <div className={`p-3 rounded-lg border-2 text-center ${
          memberStats.votedDate === memberStats.total
            ? 'border-green-500 bg-green-50'
            : 'border-amber-500 bg-amber-50'
        }`}>
          <div className="text-xs text-gray-600 mb-1">โหวตวันที่</div>
          <div className="text-xl font-bold">
            {memberStats.votedDate}/{memberStats.total}
          </div>
          {memberStats.votedDate === memberStats.total ? (
            <Check className="w-5 h-5 mx-auto mt-1 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 mx-auto mt-1 text-amber-600" />
          )}
        </div>
      </div>

      {/* ✅ Warning/Success Message */}
      {!allDataComplete && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
          <p className="font-semibold text-amber-900 mb-2">⚠️ ข้อมูลยังไม่ครบ!</p>
          <p className="text-amber-800 text-sm">
            กรุณาให้สมาชิกที่ยังไม่ได้กรอกข้อมูลเข้ามากรอกให้ครบก่อนปิดการโหวต
          </p>
        </div>
      )}

      {allDataComplete && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <p className="font-semibold text-green-900 mb-2">✓ ข้อมูลครบแล้ว!</p>
          <p className="text-green-800 text-sm">
            สมาชิกทุกคนกรอกข้อมูลครบถ้วนแล้ว สามารถปิดการโหวตและดูผลสรุปได้
          </p>
        </div>
      )}

      {/* ✅ Summary Card - ใหม่! (แทน Preview) */}
      {allDataComplete && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎉</span>
            <h3 className="font-bold text-gray-800">สรุปผลลัพธ์</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {bestDateRange && (
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className="text-gray-700">
                  {bestDateRange.dates[0] && new Date(bestDateRange.dates[0]).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short"
                  })}
                  {' - '}
                  {bestDateRange.dates[bestDateRange.dates.length - 1] && new Date(bestDateRange.dates[bestDateRange.dates.length - 1]).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short"
                  })}
                </span>
              </div>
            )}
            
            {topProvinces.length > 0 && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="text-gray-700 font-semibold">
                  {topProvinces[0].name}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span className="text-gray-700">
                ฿{formatCurrency(Math.round(avgBudget.total))}/คน
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span className="text-gray-700">
                {trip.members?.length || 0} คน
              </span>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-3 italic">
            💡 กดปิดการโหวตเพื่อดูรายละเอียดเต็ม
          </p>
        </div>
      )}

      {/* ❌ ลบ Preview Button ออก */}

      {/* ✅ ปุ่มปิดการโหวต */}
      <button
        onClick={handleCloseVoting}
        disabled={!allDataComplete || isClosing}
        className={`w-full px-6 py-4 rounded-lg font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${
          allDataComplete && !isClosing
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isClosing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>กำลังปิดการโหวต...</span>
          </>
        ) : (
          <>
            <span className="text-xl">✓</span>
            ปิดการโหวตและดูผลสรุป
          </>
        )}
      </button>

      {!allDataComplete && (
        <p className="text-center text-gray-500 text-sm mt-2">
          ต้องให้สมาชิกทุกคนกรอกข้อมูลครบก่อนถึงจะปิดการโหวตได้
        </p>
      )}
    </div>

    {/* ❌ ลบ Preview Section ออกทั้งหมด */}
  </div>
);
};