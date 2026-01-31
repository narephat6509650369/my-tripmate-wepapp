// src/pages/VotePage/components/StepVote.tsx
import React, { useEffect, useState } from 'react';
import { voteAPI } from '../../../services/tripService';
import type { TripDetail } from '../../../types';
import { ToastContainer } from '../../../components/Toast';
import { useToast } from '../hooks/useToast';

interface StepVoteProps {
  trip: TripDetail;
  onSave?: (dates: string[]) => Promise<void>;
}

export const StepVote: React.FC<StepVoteProps> = ({ trip }) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [matchingInfo, setMatchingInfo] = useState<{
    fullMatches: string[][];
    partialMatches: { days: number; ranges: string[][] }[];
  } | null>(null);

  // ใช้ Toast Hook
  const toast = useToast();

  const tripDuration = trip.duration || 3;

  useEffect(() => {
    console.log("TripId changed:", trip.tripid);
    if (!trip.tripid) return;

    voteAPI.getDateMatchingResult(trip.tripid)
      .then((res) => {
        console.log("Date Matching Result Response:", res);
        const matching = res.data?.data;
        if (!matching) return;

        const matchInfo = findAllMatches(matching.intersection, tripDuration);
        setMatchingInfo(matchInfo);
        displayMatchingResults(matchInfo, tripDuration);

        console.log("Matching Info:", matchInfo);
        console.log("Weighted:", matching.weighted);
      })
      .catch((err) => {
        console.error("Load date matching failed", err);
        toast.error("ไม่สามารถโหลดข้อมูลการแมทวันที่ได้");
      });

  }, [trip.tripid, tripDuration]);

  // ================= HELPER FUNCTIONS =================

  const findConsecutiveDays = (dates: string[], targetDays: number): string[][] => {
    if (!dates || dates.length === 0) return [];
    
    const sortedDates = [...dates].sort();
    const ranges: string[][] = [];
    
    for (let i = 0; i <= sortedDates.length - targetDays; i++) {
      const potentialRange: string[] = [];
      let isConsecutive = true;
      
      for (let j = 0; j < targetDays; j++) {
        const currentDate = new Date(sortedDates[i + j]);
        
        if (j > 0) {
          const prevDate = new Date(sortedDates[i + j - 1]);
          const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (dayDiff !== 1) {
            isConsecutive = false;
            break;
          }
        }
        
        potentialRange.push(sortedDates[i + j]);
      }
      
      if (isConsecutive && potentialRange.length === targetDays) {
        ranges.push(potentialRange);
      }
    }
    
    return ranges;
  };

  const findAllMatches = (intersection: string[], maxDays: number) => {
    const fullMatches = findConsecutiveDays(intersection, maxDays);
    const partialMatches: { days: number; ranges: string[][] }[] = [];

    if (fullMatches.length === 0) {
      for (let days = maxDays - 1; days >= 1; days--) {
        const matches = findConsecutiveDays(intersection, days);
        if (matches.length > 0) {
          partialMatches.push({ days, ranges: matches });
        }
      }
    }

    return { fullMatches, partialMatches };
  };

  const displayMatchingResults = (matchInfo: any, maxDays: number) => {
    if (matchInfo.fullMatches.length > 0) {
      console.log(`✅ พบวันที่ตรงกัน ${maxDays} วัน: ${matchInfo.fullMatches.length} ช่วง`);
    } else if (matchInfo.partialMatches.length > 0) {
      const bestMatch = matchInfo.partialMatches[0];
      console.log(`⚠️ ไม่มีช่วง ${maxDays} วันที่ตรงกัน`);
      console.log(`แต่พบช่วง ${bestMatch.days} วันติดกัน: ${bestMatch.ranges.length} ช่วง`);
    } else {
      console.log(`❌ ไม่พบวันที่ตรงกัน`);
    }
  };

  const checkCoverageStatus = (dates: string[]): {
    hasFullCoverage: boolean;
    bestCoverage: number;
    suggestedDates: string[];
  } => {
    if (dates.length === 0) {
      return { hasFullCoverage: false, bestCoverage: 0, suggestedDates: [] };
    }

    for (let targetDays = tripDuration; targetDays >= 1; targetDays--) {
      const ranges = findConsecutiveDays(dates, targetDays);
      
      if (ranges.length > 0) {
        return {
          hasFullCoverage: targetDays === tripDuration,
          bestCoverage: targetDays,
          suggestedDates: ranges[0],
        };
      }
    }

    return { hasFullCoverage: false, bestCoverage: 0, suggestedDates: [] };
  };

  // ================= HANDLERS =================

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleSave = async () => {
    if (selectedDates.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 วัน");
      return;
    }

    try {
      setLoading(true);

      if (!trip.tripid) {
        toast.error("ไม่พบข้อมูลทริป");
        return;
      }

      if (!trip.ownerid) {
        toast.error("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        user_id: trip.ownerid,
        ranges: selectedDates.sort(),
      });

      console.log("Selected Dates:", selectedDates);

      const coverage = checkCoverageStatus(selectedDates);

      // เตือนถ้าไม่ครบ N วัน
      if (!coverage.hasFullCoverage) {
        toast.warning(`บันทึกวันว่างเรียบร้อย\n⚠️ คุณเลือก ${selectedDates.length} วัน (ต้องการ ${tripDuration} วันติดกัน)\nช่วงที่ดีที่สุด: ${coverage.bestCoverage > 0 ? coverage.bestCoverage + ' วันติดกัน' : 'ไม่มีวันติดกัน'}`);
      } else {
        toast.success(`บันทึกวันว่างเรียบร้อย\n ครอบคลุม ${tripDuration} วันติดกันแล้ว`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const currentCoverage = checkCoverageStatus(selectedDates);

  // ================= RENDER CALENDAR =================
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 sm:h-12" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = selectedDates.includes(dateStr);
      const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && toggleDate(dateStr)}
          disabled={isPast}
          className={`
            h-10 sm:h-12 
            rounded-lg font-semibold 
            text-sm sm:text-base
            transition-all
            min-w-[40px] min-h-[40px]
            relative
            ${isPast ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
            ${isSelected && !isPast
              ? "bg-green-500 text-white shadow-lg scale-105"
              : !isPast
              ? "bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400"
              : ""
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // ============== RENDER ==============
  return (
    <>
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <div className="space-y-6">
        {/* คำอธิบาย (Collapsible) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition"
          >
            <h3 className="font-bold text-blue-900">📅 เลือกวันที่ว่าง (ต้องการ {tripDuration} วันติดกัน)</h3>
            <span className="text-blue-700 text-xl">
              {showInstructions ? '−' : '+'}
            </span>
          </button>
          
          {showInstructions && (
            <div className="px-4 pb-4 border-t border-blue-200">
              <ul className="text-sm text-blue-800 space-y-1 mt-3">
                <li>• คลิกเลือกวันที่คุณว่าง (เลือกได้หลายวัน)</li>
                <li>• ระบบจะตรวจสอบอัตโนมัติว่าครอบคลุม <strong>{tripDuration} วันติดกัน</strong>หรือไม่</li>
                <li>• หากต้องการยกเลิกคลิกวันที่เลือกแล้วอีกครั้งเพื่อยกเลิก</li>
                <li>• ถ้าเลือกไม่ครบ {tripDuration} วันติดกัน ระบบจะเตือนเมื่อบันทึก</li>
              </ul>
            </div>
          )}
        </div>

        {/* แสดงผลการแมท */}
        {matchingInfo && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3">🔍 ผลการวิเคราะห์วันที่ว่าง</h3>
            
            {matchingInfo.fullMatches.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 font-semibold">
                  ✅ พบวันที่ทุกคนว่างพร้อมกัน {tripDuration} วัน: {matchingInfo.fullMatches.length} ช่วง
                </p>
                <div className="mt-2 space-y-1">
                  {matchingInfo.fullMatches.slice(0, 3).map((range, idx) => {
                    const start = new Date(range[0]);
                    const end = new Date(range[range.length - 1]);
                    return (
                      <div key={idx} className="text-sm text-green-700">
                        • {start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} 
                        {' - '}
                        {end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    );
                  })}
                  {matchingInfo.fullMatches.length > 3 && (
                    <div className="text-sm text-green-600">
                      และอีก {matchingInfo.fullMatches.length - 3} ช่วง...
                    </div>
                  )}
                </div>
              </div>
            ) : matchingInfo.partialMatches.length > 0 ? (
              <div className="space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ ไม่พบวันที่ทุกคนว่างพร้อมกัน {tripDuration} วันติดกัน
                  </p>
                </div>
                {matchingInfo.partialMatches.map((partial, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 font-semibold">
                      📌 พบวันที่ว่างพร้อมกัน {partial.days} วันติดกัน: {partial.ranges.length} ช่วง
                    </p>
                    <div className="mt-2 space-y-1">
                      {partial.ranges.slice(0, 3).map((range, ridx) => {
                        const start = new Date(range[0]);
                        const end = new Date(range[range.length - 1]);
                        return (
                          <div key={ridx} className="text-sm text-blue-700">
                            • {start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} 
                            {' - '}
                            {end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        );
                      })}
                      {partial.ranges.length > 3 && (
                        <div className="text-sm text-blue-600">
                          และอีก {partial.ranges.length - 3} ช่วง...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-semibold">
                  ❌ ไม่พบวันที่ทุกคนว่างพร้อมกัน
                </p>
                <p className="text-sm text-red-600 mt-1">
                  แต่ละคนสามารถเลือกวันที่ตนเองว่างได้
                </p>
              </div>
            )}
          </div>
        )}

        {/* ปฏิทิน */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] text-lg"
              aria-label="เดือนก่อนหน้า"
            >
              ←
            </button>

            {/* คลิกเพื่อเลือกเดือน/ปี */}
            <div className="flex items-center gap-2">
              <select
                value={calendarMonth.getMonth()}
                onChange={(e) => setCalendarMonth(new Date(calendarMonth.getFullYear(), parseInt(e.target.value), 1))}
                className="px-3 py-2 border-2 border-blue-300 rounded-xl font-bold text-sm sm:text-base hover:border-blue-500 hover:bg-blue-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer shadow-sm hover:shadow-md"
              >
                {[
                  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ].map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={calendarMonth.getFullYear()}
                onChange={(e) => setCalendarMonth(new Date(parseInt(e.target.value), calendarMonth.getMonth(), 1))}
                className="px-3 py-2 border-2 border-blue-300 rounded-xl font-bold text-sm sm:text-base hover:border-blue-500 hover:bg-blue-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer shadow-sm hover:shadow-md"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year}>
                    {year + 543}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] text-lg"
              aria-label="เดือนถัดไป"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(day => (
              <div key={day} className="text-center font-bold text-gray-600 text-xs sm:text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {renderCalendar()}
          </div>

          <div className="mt-4 flex items-center gap-4 flex-wrap text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>วันที่เลือก</span>
            </div>
          </div>
        </div>

        {/* สถานะการเลือกปัจจุบัน */}
        {selectedDates.length > 0 && (
          <div className={`border rounded-lg p-4 ${
            currentCoverage.hasFullCoverage 
              ? 'bg-green-50 border-green-200' 
              : currentCoverage.bestCoverage > 0
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-bold text-lg mb-2">
              {currentCoverage.hasFullCoverage 
                ? '✅ สถานะ: ครบ ' + tripDuration + ' วันติดกันแล้ว' 
                : currentCoverage.bestCoverage > 0
                ? '⚠️ สถานะ: ยังไม่ครบ ' + tripDuration + ' วันติดกัน'
                : '❌ สถานะ: ยังไม่มีวันติดกัน'
              }
            </h3>
            
            <div className="text-sm space-y-1">
              <p>
                <strong>จำนวนวันที่เลือก:</strong> {selectedDates.length} วัน
              </p>
              
              {currentCoverage.bestCoverage > 0 && (
                <p>
                  <strong>ช่วงที่ดีที่สุด:</strong> {currentCoverage.bestCoverage} วันติดกัน
                  {currentCoverage.suggestedDates.length > 0 && (
                    <span className="ml-2 text-xs">
                      ({new Date(currentCoverage.suggestedDates[0]).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      {' - '}
                      {new Date(currentCoverage.suggestedDates[currentCoverage.suggestedDates.length - 1]).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ปุ่มบันทึก */}
        <button
          onClick={handleSave}
          disabled={selectedDates.length === 0 || loading}
          className={`
            w-full px-6 py-3 font-bold rounded-xl transition shadow-lg
            ${selectedDates.length === 0 || loading
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : currentCoverage.hasFullCoverage
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {loading 
            ? "กำลังบันทึก..." 
            : `บันทึกวันที่ (${selectedDates.length} วัน${
                currentCoverage.hasFullCoverage ? ' ✓' : ''
              })`
          }
        </button>
      </div>
    </>
  );
};

export default StepVote;