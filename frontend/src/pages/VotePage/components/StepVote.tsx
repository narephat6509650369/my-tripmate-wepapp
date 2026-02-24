// src/pages/VotePage/components/StepVote.tsx
import React, { useEffect, useState } from 'react';
import type { TripDetail, DateMatchingResponse } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

type MatchingData = Pick<DateMatchingResponse, 'availability' | 'recommendation' | 'summary'>;

interface StepVoteProps {
  trip: TripDetail;
  matchingData?: MatchingData | null;
  initialDates?: string[];
  onSave?: (dates: string[]) => Promise<void>;
  onManualNext?: () => void;
  isLocked?: boolean;
}

export const StepVote: React.FC<StepVoteProps> = ({ trip, matchingData, initialDates, onSave, onManualNext, isLocked }) => {
  const { user } = useAuth();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const [matchingInfo, setMatchingInfo] = useState<MatchingData | null>(null);

  // State สำหรับ Smart Toast & Modal
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false); 
  const tripDuration = trip.numdays;

  const prevDatesRef = React.useRef<string>("");

  useEffect(() => {
    if (matchingData) {
      setMatchingInfo(matchingData);
    }
  }, [matchingData]);

  useEffect(() => {
    const newDatesStr = JSON.stringify([...(initialDates || [])].sort());
    if (initialDates?.length && newDatesStr !== prevDatesRef.current) {
      prevDatesRef.current = newDatesStr;
      setSelectedDates(initialDates);
    }
  }, [initialDates]);

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
      alert("กรุณาเลือกอย่างน้อย 1 วัน");
      return;
    }

    try {
      setLoading(true);
      if (!trip.tripid || !trip.ownerid) {
        alert("ไม่พบข้อมูลทริปหรือผู้ใช้");
        return;
      }
      if (onSave) {
        await onSave(selectedDates);
      }
      setJustSaved(true);
      setHasSaved(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ============== ANALYSIS MODAL ==============
  const renderAnalysisModal = () => {
    if (!showAnalysisModal || !matchingInfo) return null;

    // ✅ ใช้ recommendation จาก Backend
    const { recommendation, availability, summary } = matchingInfo;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-backdrop-fade-in"
        onClick={() => setShowAnalysisModal(false)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-modal-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl flex justify-between items-center z-10">
            <h3 className="text-xl font-bold">🔍 ผลการวิเคราะห์วันที่</h3>
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* ผลการวิเคราะห์ */}
            {recommendation ? (
              <div className={`border rounded-lg p-4 ${
                recommendation.isConsecutive 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-orange-50 border-orange-300'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`font-semibold mb-1 ${
                      recommendation.isConsecutive ? 'text-blue-800' : 'text-orange-800'
                    }`}>
                      {recommendation.isConsecutive ? '💡' : '⚠️'} ช่วงที่แนะนำ
                    </p>
                    <p className="text-xs text-gray-600">
                      คะแนน: {recommendation.score} • 
                      {recommendation.dates.length === tripDuration 
                        ? ' ✓ ครบจำนวนวัน' 
                        : ` ${recommendation.dates.length}/${tripDuration} วัน`
                      }
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {recommendation.avgPeople}
                    </p>
                    <p className="text-xs text-gray-600">คนว่างเฉลี่ย</p>
                  </div>
                </div>
                
                {/* แสดงวันที่ */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex flex-wrap gap-2 items-center">
                    {recommendation.dates.map((date, idx) => {
                      const d = new Date(date);
                      const availInfo = availability.find(a => a.date === date);
                      const peopleCount = availInfo?.count || 0;
                      
                      return (
                        <React.Fragment key={date}>
                          <div className="flex flex-col items-center">
                            <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${
                              peopleCount >= (recommendation.avgPeople || 0) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {d.toLocaleDateString('th-TH', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            <span className="text-xs text-gray-600 mt-1">
                              👥 {peopleCount}
                            </span>
                          </div>
                          
                          {idx < recommendation.dates.length - 1 && (
                            <span className="text-gray-400 text-xl">
                              {(() => {
                                const gap = (new Date(recommendation.dates[idx + 1]).getTime() - d.getTime()) 
                                          / (1000 * 60 * 60 * 24) - 1;
                                return gap > 0 ? `··· ${gap}วัน ···` : '→';
                              })()}
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                
                {/* สรุปข้อมูล */}
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={recommendation.isConsecutive ? 'text-green-600' : 'text-orange-600'}>
                      {recommendation.isConsecutive ? '✓ วันติดกันทั้งหมด' : '⚠️ มีช่องว่างระหว่างวัน'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📊 {recommendation.percentage}% ของสมาชิกว่าง</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">
                  💭 ยังไม่มีข้อมูลเพียงพอสำหรับการแนะนำ
                </p>
              </div>
            )}

            {/* คำแนะนำ */}
            <div className="mt-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="text-sm text-purple-800">
                💡 <strong>คำแนะนำ:</strong> คุณสามารถปรับเปลี่ยนวันที่ได้ก่อนไปหน้าถัดไป
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-xl border-t flex gap-3">
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              ปิด
            </button>
            <button
              onClick={() => {
                setShowAnalysisModal(false);
                setJustSaved(false);
                onManualNext?.();
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              ไปหน้าถัดไป (งบประมาณ) →
            </button>
          </div>
        </div>
      </div>
    );
  };

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
          disabled={isPast || isLocked}
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
        <div className="space-y-6">        
        {/* คำอธิบาย */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition"
          >
            <h3 className="font-bold text-blue-900">📅 เลือกวันที่ว่าง (ต้องการ {tripDuration} วันติดกัน)</h3>
            <span className="text-blue-700 text-sm">
              {showInstructions ? '▲ ซ่อนคำแนะนำ' : '▼ ดูคำแนะนำ'}
            </span>
          </button>
         
          {showInstructions && (
            <div className="px-4 pb-4 border-t border-blue-200">
              <ul className="text-sm text-blue-800 space-y-1 mt-3">
                <li>• คลิกเลือกวันที่คุณว่าง (เลือกได้หลายวัน)</li>
                <li>• ระบบจะวิเคราะห์ช่วงวันที่เหมาะสม<strong>หลังจากบันทึก</strong></li>
                <li>• หากต้องการยกเลิกคลิกวันที่เลือกแล้วอีกครั้งเพื่อยกเลิก</li>
                <li>• ถ้าเลือกไม่ครบ {tripDuration} วันติดกัน ระบบจะเตือนเมื่อบันทึก</li>
              </ul>
            </div>
          )}
        </div>

        {/* ปฏิทิน */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] text-lg"
            >
              ←
            </button>

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

        {/* {selectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">
            📅 เลือกแล้ว {selectedDates.length} วัน
          </h3>
          
          <div className="text-sm text-blue-800">
            <p>ระบบจะวิเคราะห์ช่วงวันที่เหมาะสมหลังจากบันทึก</p>
          </div>
        </div>
      )} */}

        {/* ปุ่มบันทึก */}
        <button
          onClick={handleSave}
          disabled={selectedDates.length === 0 || loading || isLocked}
          className={`
            w-full px-6 py-3 font-bold rounded-xl transition shadow-lg
            ${selectedDates.length === 0 || loading
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {loading 
            ? "กำลังบันทึก..." 
            : isLocked ? '🔒 ปิดการโหวตแล้ว' : `บันทึกวันที่ (${selectedDates.length} วัน)`
          }
        </button>

        {/* ── ผลการวิเคราะห์ (แสดงหลังบันทึก) ── */}
        {hasSaved && matchingInfo && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Header — กดเพื่อพับ/ขยาย */}
          <button
            onClick={() => setIsAnalysisOpen(prev => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="font-bold text-gray-800 text-sm">ผลการวิเคราะห์วันที่</span>
            </div>
            <span className="text-gray-400 text-sm">{isAnalysisOpen ? '▲ ซ่อน' : '▼ ดูผล'}</span>
          </button>

          {/* Content — แสดงเมื่อ isAnalysisOpen */}
          {isAnalysisOpen && (
            <div className="p-4 space-y-4">
              {matchingInfo.recommendation ? (
                <div className={`border rounded-lg p-4 ${
                  matchingInfo.recommendation.isConsecutive
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-orange-50 border-orange-300'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`font-semibold mb-1 ${
                        matchingInfo.recommendation.isConsecutive ? 'text-blue-800' : 'text-orange-800'
                      }`}>
                        {matchingInfo.recommendation.isConsecutive ? '💡' : '⚠️'} ช่วงที่แนะนำ
                      </p>
                      <p className="text-xs text-gray-600">
                        คะแนน: {matchingInfo.recommendation.score} •{' '}
                        {matchingInfo.recommendation.dates.length === tripDuration
                          ? '✓ ครบจำนวนวัน'
                          : `${matchingInfo.recommendation.dates.length}/${tripDuration} วัน`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {matchingInfo.recommendation.avgPeople}
                      </p>
                      <p className="text-xs text-gray-600">คนว่างเฉลี่ย</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex flex-wrap gap-2 items-center">
                      {matchingInfo.recommendation.dates.map((date, idx) => {
                        const d = new Date(date);
                        const availInfo = matchingInfo.availability.find(a => a.date === date);
                        const peopleCount = availInfo?.count || 0;

                        return (
                          <React.Fragment key={date}>
                            <div className="flex flex-col items-center">
                              <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${
                                peopleCount >= (matchingInfo.recommendation?.avgPeople || 0)
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                              </div>
                              <span className="text-xs text-gray-600 mt-1">👥 {peopleCount}</span>
                            </div>
                            {idx < matchingInfo.recommendation!.dates.length - 1 && (
                              <span className="text-gray-400">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <span className={matchingInfo.recommendation.isConsecutive ? 'text-green-600' : 'text-orange-600'}>
                      {matchingInfo.recommendation.isConsecutive ? '✓ วันติดกันทั้งหมด' : '⚠️ มีช่องว่างระหว่างวัน'}
                    </span>
                    <p className="text-gray-600">📊 {matchingInfo.recommendation.percentage}% ของสมาชิกว่าง</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">💭 ยังไม่มีข้อมูลเพียงพอสำหรับการแนะนำ</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Analysis Modal */}
      {renderAnalysisModal()}
    </>
  );
};

export default StepVote;