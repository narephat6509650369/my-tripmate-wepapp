import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { TripData, Member } from '../../../data/mockData';

// ============== TYPES ==============
interface StepVoteProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  tripCode: string;
}

// ============== COMPONENT ==============
export const StepVote: React.FC<StepVoteProps> = ({
  trip,
  setTrip,
  memberBudget,
  tripCode
}) => {
  // ============== STATE ==============
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followMajority, setFollowMajority] = useState(false);

  // ============== EFFECTS ==============
  
  /**
   * โหลดวันที่ว่างของตัวเองจาก trip.memberAvailability
   */
  // ============== AUTO-SAVE LISTENER ==============
  useEffect(() => {
    const handleAutoSave = () => {
      console.log('📥 Received auto-save event for dates');
      if (selectedDates.length > 0) {
        saveAvailability();
      }
    };
    
    window.addEventListener('auto-save-dates', handleAutoSave);
    
    return () => {
      window.removeEventListener('auto-save-dates', handleAutoSave);
    };
  }, [selectedDates]);

  // ============== HANDLERS ==============
  
  /**
   * Toggle เลือก/ยกเลิกวันที่
   */
  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  /**
   * บันทึกวันที่ว่างของตัวเอง
   */
  const saveAvailability = async () => {
    // ✅ เพิ่มการ handle follow majority
    let datesToSave = selectedDates;
    
    if (followMajority && selectedDates.length === 0) {
      // Auto-select dates based on majority
      const allDates = trip.memberAvailability?.flatMap(m => m.availableDates) || [];
      const dateFrequency: Record<string, number> = {};
      
      allDates.forEach(date => {
        dateFrequency[date] = (dateFrequency[date] || 0) + 1;
      });
      
      datesToSave = Object.entries(dateFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([date]) => date)
        .slice(0, trip.days || 3);
      
      if (datesToSave.length === 0) {
        alert("ยังไม่มีเพื่อนคนไหนเลือกวันที่ กรุณาเลือกเอง");
        return;
      }
    } else if (!followMajority && selectedDates.length === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 วัน หรือเลือก 'ตามใจเพื่อน'");
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.updateMemberAvailability(tripCode, {
          memberId: memberBudget?.id || "",
          availableDates: datesToSave
        });
      }

      // อัปเดต trip state
      setTrip(prev => {
        const existing = prev.memberAvailability?.findIndex(
          m => m.memberId === memberBudget?.id
        );
        const newEntry = {
          memberId: memberBudget?.id || "",
          memberName: memberBudget?.name || "",
          availableDates: datesToSave,
          timestamp: Date.now()
        };

        if (existing !== undefined && existing >= 0) {
          const updated = [...(prev.memberAvailability || [])];
          updated[existing] = newEntry;
          return { ...prev, memberAvailability: updated };
        } else {
          return {
            ...prev,
            memberAvailability: [...(prev.memberAvailability || []), newEntry]
          };
        }
      });

    } catch (error) {
      log.error('Error saving availability:', error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // ============== HELPER FUNCTIONS ==============
  
  /**
   * สร้างปฏิทินแสดงวันในเดือน
   */
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    // เว้นวันว่าง (วันอาทิตย์ = 0)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // วันในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      
      const isSelected = selectedDates.includes(dateStr);
      const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && toggleDate(dateStr)}
          disabled={isPast}
          className={`
            h-12 rounded-lg font-semibold transition-all
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

  /**
   * คำนวณช่วงวันที่ติดกันที่คนว่างมากที่สุด
   */
  const getBestDateRanges = () => {
    if (!trip.memberAvailability || trip.memberAvailability.length === 0) {
      return [];
    }

    const tripDays = trip.days || 3;
    const allDates = new Set<string>();
    
    trip.memberAvailability.forEach(m => {
      m.availableDates.forEach(date => allDates.add(date));
    });

    const sortedDates = Array.from(allDates).sort();
    const ranges: Array<{
      dates: string[];
      count: number;
      percentage: number;
    }> = [];

    for (let i = 0; i <= sortedDates.length - tripDays; i++) {
      const rangeStart = new Date(sortedDates[i]);
      const rangeEnd = new Date(sortedDates[i + tripDays - 1]);
      const daysDiff = Math.round(
        (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === tripDays - 1) {
        const datesInRange = sortedDates.slice(i, i + tripDays);
        
        const membersAvailable = trip.memberAvailability!.filter(member => {
          return datesInRange.every(date => member.availableDates.includes(date));
        });

        ranges.push({
          dates: datesInRange,
          count: membersAvailable.length,
          percentage: Math.round(
            (membersAvailable.length / trip.members!.length) * 100
          )
        });
      }
    }

    return ranges.sort((a, b) => b.count - a.count).slice(0, 3);
  };

  /**
   * คำนวณวันเดี่ยวที่คนว่างมาก
   */
  const getCommonDates = () => {
    if (!trip.memberAvailability || trip.memberAvailability.length === 0) {
      return [];
    }

    const allDates = trip.memberAvailability.flatMap(m => m.availableDates);
    const dateCounts = allDates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const bestDateRanges = getBestDateRanges();
  const commonDates = getCommonDates();

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ============== ปฏิทิน ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {/* Header - เลือกเดือน */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
              )
            }
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
          >
            ←
          </button>

          <h3 className="text-xl font-bold">
            {calendarMonth.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long"
            })}
          </h3>

          <button
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
              )
            }
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
          >
            →
          </button>
        </div>

        {/* Header วัน */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(day => (
            <div key={day} className="text-center font-bold text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>วันที่คุณเลือก ({selectedDates.length})</span>
          </div>
        </div>

        {/* ✅ เพิ่มส่วนนี้ */}
        {/* Follow Majority Option */}
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={followMajority}
              onChange={(e) => setFollowMajority(e.target.checked)}
              className="mt-1 w-5 h-5 text-purple-600"
            />
            <div>
              <p className="font-semibold text-purple-900">
                ✨ ตามใจเพื่อนส่วนใหญ่
              </p>
              <p className="text-sm text-purple-700 mt-1">
                ระบบจะเลือกวันที่ที่เพื่อนส่วนใหญ่เลือกให้อัตโนมัติ 
                (คุณยังสามารถแก้ไขได้ทีหลัง)
              </p>
              {followMajority && (
                <div className="mt-2 p-2 bg-white rounded text-xs text-purple-600">
                  💡 เมื่อคุณกด "บันทึก" ระบบจะเลือกวันที่ให้โดยอัตโนมัติ
                </div>
              )}
            </div>
          </label>
        </div>
        
        {/* ปุ่มบันทึก */}
        {/* <button
          onClick={saveAvailability}
          disabled={isSubmitting}
          className={`
            w-full mt-6 px-6 py-3 font-bold rounded-lg transition shadow-lg
            ${isSubmitting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }
          `}
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกวันที่ว่าง'}
        </button> */}
      </div>

      {/* ============== สรุปช่วงวันที่ที่เหมาะสม ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🏆 ช่วงวันที่เหมาะสมสำหรับทริป {trip.days} วัน
        </h3>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-blue-800 text-sm">
            <strong>💡 คำอธิบาย:</strong> แสดงช่วงวันที่ติดกัน {trip.days} วัน 
            ที่สมาชิกว่างครบทุกวันมากที่สุด
          </p>
        </div>

        {bestDateRanges.length > 0 ? (
          <div className="space-y-4">
            {bestDateRanges.map((range, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-lg border-2 ${
                  idx === 0
                    ? "border-yellow-400 bg-yellow-50"
                    : idx === 1
                    ? "border-gray-400 bg-gray-50"
                    : "border-orange-400 bg-orange-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </span>
                      <div>
                        <p className="font-bold text-lg text-gray-800">
                          อันดับ {idx + 1}
                        </p>
                        <p className="text-sm text-gray-600">
                          {range.count}/{trip.members?.length || 0} คน ({range.percentage}%)
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-700">
                          ช่วงวันที่:
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {range.dates.map((date, dIdx) => (
                          <div
                            key={date}
                            className="bg-blue-50 px-3 py-2 rounded text-center"
                          >
                            <p className="text-xs text-gray-600">
                              วันที่ {dIdx + 1}
                            </p>
                            <p className="font-semibold text-sm text-gray-800">
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

                    <div className="text-sm text-gray-600">
                      <strong>สมาชิกที่ว่าง:</strong>{" "}
                      {trip.memberAvailability
                        ?.filter(m => 
                          range.dates.every(date => m.availableDates.includes(date))
                        )
                        .map(m => m.memberName)
                        .join(", ") || "ไม่มี"}
                    </div>
                  </div>

                  <div className="ml-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 32 * (1 - range.percentage / 100)
                          }`}
                          className={
                            idx === 0
                              ? "text-yellow-500"
                              : idx === 1
                              ? "text-gray-400"
                              : "text-orange-400"
                          }
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-800">
                          {range.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* ============== วันเดี่ยวที่คนว่างมาก ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📅 วันเดี่ยวที่คนว่างมากที่สุด (Top 3)
        </h3>
        
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6 rounded">
          <p className="text-gray-700 text-sm">
            <strong>ℹ️ หมายเหตุ:</strong> หากหาช่วงวันที่ติดกันไม่ได้ 
            สามารถดูวันเดี่ยวที่คนว่างมากเพื่อประกอบการตัดสินใจ
          </p>
        </div>

        {commonDates.length > 0 ? (
          <div className="space-y-3">
            {commonDates.map(({ date, count }, idx) => (
              <div
                key={date}
                className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{count}</p>
                    <p className="text-sm text-gray-600">
                      /{trip.members?.length || 0} คน
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4">ยังไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
};