// src/pages/VotePage/components/StepVote.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { voteAPI } from '../../../services/tripService';
import type { TripDetail, DateRange } from '../../../types';

// ============== TYPES ==============
interface StepVoteProps {
  trip: TripDetail;
  onSave: (ranges: DateRange[]) => void;
}

// ============== COMPONENT ==============
export const StepVote: React.FC<StepVoteProps> = ({ trip, onSave }) => {
  // ============== STATE ==============
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showResults, setShowResults] = useState(false);

  // ============== HANDLERS ==============
  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleSave = () => {
    if (selectedDates.length === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 วัน");
      return;
    }

    // แปลง selected dates เป็น date ranges
    const sortedDates = [...selectedDates].sort();
    const ranges: DateRange[] = [];
    
    let rangeStart = sortedDates[0];
    let rangeEnd = sortedDates[0];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const prevDate = new Date(sortedDates[i - 1]);
      const daysDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // ต่อเนื่องกัน
        rangeEnd = sortedDates[i];
      } else {
        // ไม่ต่อเนื่อง - เก็บ range เก่า
        ranges.push({
          start_date: rangeStart,
          end_date: rangeEnd
        });
        rangeStart = sortedDates[i];
        rangeEnd = sortedDates[i];
      }
    }
    
    // เก็บ range สุดท้าย
    ranges.push({
      start_date: rangeStart,
      end_date: rangeEnd
    });

    onSave(ranges);
  };

  // ============== RENDER CALENDAR ==============
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

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ปฏิทิน */}
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
              month: "long"
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
      </div>

      {/* ปุ่มบันทึก */}
      <button
        onClick={handleSave}
        disabled={selectedDates.length === 0}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg"
      >
        บันทึกวันที่ ({selectedDates.length} วัน)
      </button>
    </div>
  );
};

export default StepVote;