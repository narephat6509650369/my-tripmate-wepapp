import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Calendar } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { formatCurrency } from '../../../utils/helpers';
import { TripData, Member } from '../../../data/mockData';

// ============== TYPES ==============
interface StepSummaryProps {
  trip: TripData;
  memberBudget: Member | null;
  tripCode: string;
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
  tripCode
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ============== COMPUTED VALUES ==============
  
  /**
   * สถิติสมาชิก
   */
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

  /**
   * หาช่วงวันที่ที่เหมาะสมที่สุด
   */
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

  /**
   * Top 3 จังหวัด
   */
  const topProvinces = (trip.voteResults?.provinces || []).slice(0, 3);

  /**
   * งบประมาณเฉลี่ย
   */
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
  
  /**
   * ปิดการโหวตและไปหน้าสรุปผล
   */
  const handleCloseVoting = async () => {
    // ตรวจสอบความครบถ้วน
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
    }finally {
      setIsClosing(false); 
    }
  };

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ============== Header ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          ✅ พร้อมปิดการโหวตหรือยัง?
        </h2>
        
        {/* สถานะความครบถ้วน */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            memberStats.completedBudget === memberStats.total
              ? 'border-green-500 bg-green-50'
              : 'border-amber-500 bg-amber-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">งบประมาณ</div>
                <div className="text-2xl font-bold">
                  {memberStats.completedBudget}/{memberStats.total}
                </div>
              </div>
              {memberStats.completedBudget === memberStats.total ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            memberStats.votedProvince === memberStats.total
              ? 'border-green-500 bg-green-50'
              : 'border-amber-500 bg-amber-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">โหวตจังหวัด</div>
                <div className="text-2xl font-bold">
                  {memberStats.votedProvince}/{memberStats.total}
                </div>
              </div>
              {memberStats.votedProvince === memberStats.total ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            memberStats.votedDate === memberStats.total
              ? 'border-green-500 bg-green-50'
              : 'border-amber-500 bg-amber-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">โหวตวันที่</div>
                <div className="text-2xl font-bold">
                  {memberStats.votedDate}/{memberStats.total}
                </div>
              </div>
              {memberStats.votedDate === memberStats.total ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              )}
            </div>
          </div>
        </div>

        {/* คำเตือน */}
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

        {/* ปุ่ม Preview */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full mb-4 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          {showPreview ? "ซ่อน" : "แสดง"} Preview ผลสรุป
          {showPreview ? " ↑" : " ↓"}
        </button>

        {/* ปุ่มปิดการโหวต */}
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

      {/* ============== Preview Section ============== */}
      {showPreview && (
        <div className="space-y-6">
          {/* ช่วงวันที่ที่เหมาะสม */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📅 ช่วงวันที่แนะนำสำหรับทริป
            </h3>
            {bestDateRange ? (
              <div className="p-6 rounded-lg border-2 border-yellow-400 bg-yellow-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🥇</span>
                    <div>
                      <p className="text-lg font-bold text-gray-800">
                        ช่วงวันที่ยอดนิยม
                      </p>
                      <p className="text-sm text-gray-600">
                        {bestDateRange.count}/{trip.members?.length || 0} คน ({bestDateRange.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-600">
                      {bestDateRange.percentage}%
                    </p>
                    <p className="text-sm text-gray-600">ว่างครบ</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-lg">
                  {bestDateRange.dates.map((date, idx) => (
                    <div key={date} className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">วันที่ {idx + 1}</p>
                      <p className="font-bold text-lg text-gray-800">
                        {new Date(date).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short"
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(date).toLocaleDateString("th-TH", {
                          weekday: "short"
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-semibold mb-2">
                  ยังหาช่วงวันที่เหมาะสมไม่เจอ
                </p>
                <p className="text-sm">
                  ต้องการให้สมาชิกเลือกวันที่ติดกันอย่างน้อย {trip.days} วัน
                </p>
              </div>
            )}
          </div>

          {/* Top 3 จังหวัด */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🗺️ Top 3 จังหวัดยอดนิยม
            </h3>
            {topProvinces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topProvinces.map((province, idx) => (
                  <div
                    key={province.name}
                    className={`p-4 rounded-lg border-2 ${
                      idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                      idx === 1 ? 'border-gray-400 bg-gray-50' :
                      'border-orange-400 bg-orange-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mb-1">
                        {province.name}
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {province.score} คะแนน
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">ยังไม่มีข้อมูลจังหวัด</p>
            )}
          </div>

          {/* งบประมาณเฉลี่ย */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💰 งบประมาณเฉลี่ยต่อคน
            </h3>
            <div className="space-y-3">
              {BUDGET_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-bold text-blue-600">
                    ฿{formatCurrency(Math.round(avgBudget[key]))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
                <span className="font-bold">รวมทั้งหมด</span>
                <span className="text-2xl font-bold">
                  ฿{formatCurrency(Math.round(avgBudget.total))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};