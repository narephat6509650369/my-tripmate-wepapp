import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { TripData, Member, HistoryEntry } from '../../../data/mockData';

// ============== TYPES ==============
interface StepVoteProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  tripCode: string;
  addHistory: (step: number, stepName: string, action: string) => void;
  onNavigateToStep: (step: number) => void;
}

// ============== COMPONENT ==============
export const StepVote: React.FC<StepVoteProps> = ({
  trip,
  setTrip,
  memberBudget,
  tripCode,
  addHistory,
  onNavigateToStep
}) => {
  // ============== STATE ==============
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followMajority, setFollowMajority] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ============== EFFECTS ==============
  useEffect(() => {
    const myAvailability = trip.memberAvailability?.find(
      m => m.memberId === memberBudget?.id
    );
    if (myAvailability) {
      setSelectedDates(myAvailability.availableDates);
    }
  }, [trip.memberAvailability, memberBudget]);

  // ============== AUTO-SAVE LISTENER ==============
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleAutoSave = () => {
      console.log('📥 Received auto-save event for dates');
      
      if (followMajority && selectedDates.length === 0) {
        const allDates = trip.memberAvailability?.flatMap(m => m.availableDates) || [];
        const dateFrequency: Record<string, number> = {};
        
        allDates.forEach(date => {
          dateFrequency[date] = (dateFrequency[date] || 0) + 1;
        });
        
        const topDates = Object.entries(dateFrequency)
          .sort((a, b) => b[1] - a[1])
          .map(([date]) => date)
          .slice(0, trip.days || 3);
        
        if (topDates.length > 0) {
          setSelectedDates(topDates);
          setTimeout(() => saveAvailability(), 100);
          return;
        }
      }
      
      if (selectedDates.length > 0) {
        saveAvailability();
      }
    };
    
    window.addEventListener('auto-save-dates', handleAutoSave);
    
    return () => {
      window.removeEventListener('auto-save-dates', handleAutoSave);
    };
  }, [selectedDates, followMajority]);

  // ============== HANDLERS ==============
  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const saveAvailability = async () => {
    let datesToSave = selectedDates;
    
    if (followMajority && selectedDates.length === 0) {
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
        console.log("ยังไม่มีเพื่อนคนไหนเลือกวันที่");
        return;
      }
    } else if (!followMajority && selectedDates.length === 0) {
      console.log("กรุณาเลือกอย่างน้อย 1 วัน");
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

      addHistory(2, 'เลือกวันที่', `เลือกวันที่ว่าง ${datesToSave.length} วัน`);

    } catch (error) {
      log.error('Error saving availability:', error);
    }
  };

  // ============== HELPER FUNCTIONS ==============
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
      const daysDiff = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === tripDays - 1) {
        const datesInRange = sortedDates.slice(i, i + tripDays);
        
        const membersAvailable = trip.memberAvailability!.filter(member => {
          return datesInRange.every(date => member.availableDates.includes(date));
        });

        ranges.push({
          dates: datesInRange,
          count: membersAvailable.length,
          percentage: Math.round((membersAvailable.length / trip.members!.length) * 100)
        });
      }
    }

    return ranges.sort((a, b) => b.count - a.count).slice(0, 3);
  };

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
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
            className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition text-lg sm:text-base min-w-[44px] min-h-[44px]"
            aria-label="เดือนก่อนหน้า"
          >
            ←
          </button>

          <h3 className="text-base sm:text-xl font-bold text-center">
            {calendarMonth.toLocaleDateString("th-TH", { 
              year: "numeric", 
              month: window.innerWidth < 640 ? "short" : "long" 
            })}
          </h3>

          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
            className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition text-lg sm:text-base min-w-[44px] min-h-[44px]"
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

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>วันที่คุณเลือก ({selectedDates.length})</span>
          </div>
        </div>

        {/* Follow Majority */}
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={followMajority}
              onChange={(e) => setFollowMajority(e.target.checked)}
              className="mt-1 w-5 h-5 text-purple-600"
            />
            <div>
              <p className="font-semibold text-purple-900">✨ ตามใจเพื่อนส่วนใหญ่</p>
              <p className="text-sm text-purple-700 mt-1">
                ระบบจะเลือกวันที่ที่เพื่อนส่วนใหญ่เลือกให้อัตโนมัติ
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ✅ ปุ่มดูผลลัพธ์ */}
      {selectedDates.length > 0 && (
        <button
          onClick={() => setShowResults(!showResults)}
          className="w-full px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
          aria-label={showResults ? 'ซ่อนผลลัพธ์' : 'ดูผลลัพธ์'}
        >
          <span>📊</span>
          <span className="hidden sm:inline">{showResults ? 'ซ่อน' : 'ดู'}ผลลัพธ์ล่าสุด</span>
          <span className="sm:hidden">{showResults ? 'ซ่อน' : 'ดู'}ผล</span>
          {showResults ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      )}

      {/* ============== Dashboard (Collapsible) ============== */}
      {showResults && selectedDates.length > 0 && (
        <>
          {/* ช่วงวันที่แนะนำ */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🏆</span>
              <span>ช่วงวันที่แนะนำ ({trip.days} วัน)</span>
            </h3>

            {bestDateRanges.length > 0 ? (
              <div className="space-y-2">
                {bestDateRanges.slice(0, 3).map((range, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                      idx === 1 ? 'border-gray-300 bg-gray-50' :
                      'border-orange-300 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {range.dates.map((date) => (
                            <span
                              key={date}
                              className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700"
                            >
                              {new Date(date).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right ml-3">
                        <p className="text-lg font-bold text-gray-800">{range.percentage}%</p>
                        <p className="text-xs text-gray-600">{range.count} คน</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-3 text-sm">
                ยังหาช่วงวันที่ติดกัน {trip.days} วันไม่เจอ
              </p>
            )}
          </div>

          {/* วันยอดนิยม */}
          {commonDates.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📅</span>
                <span>วันยอดนิยม (Top 3)</span>
              </h3>
              
              <div className="space-y-2">
                {commonDates.map(({ date, count }, idx) => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="font-medium text-gray-800 text-sm">
                        {new Date(date).toLocaleDateString("th-TH", {
                          month: "short",
                          day: "numeric",
                          weekday: "short"
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{count}</p>
                      <p className="text-xs text-gray-600">คน</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};