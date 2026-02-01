// src/pages/VotePage/components/StepVote.tsx
import React, { useEffect, useState } from 'react';
import { voteAPI } from '../../../services/tripService';
import type { TripDetail } from '../../../types';

interface StepVoteProps {
  trip: TripDetail;
  onSave?: (dates: string[]) => Promise<void>;
  onManualNext?: () => void;
}

export const StepVote: React.FC<StepVoteProps> = ({ trip, onSave, onManualNext }) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [matchingInfo, setMatchingInfo] = useState<{
  fullMatches: string[][];
  partialMatches: { days: number; ranges: string[][] }[];
    weighted?: Record<string, number>;
    bestAlternative?: { 
      dates: string[];
      totalPeople: number;
      avgPeople: number;
      totalGap: number;
      score: number;
      isConsecutive: boolean;
    } | null;
  } | null>(null);

  // State สำหรับ Smart Toast & Modal
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const tripDuration = trip.duration || 3;

  useEffect(() => {
    console.log("TripId changed:", trip.tripid);
    if (!trip.tripid) return;

    voteAPI.getDateMatchingResult(trip.tripid)
    .then((res) => {
      console.log("Date Matching Result Response:", res);
      const matching = res.data?.data;
      
      // ✅ ถ้าไม่มีข้อมูล ให้ใช้ค่า default
      if (!matching || !matching.intersection) {
        console.warn('⚠️ ไม่มีข้อมูล matching - ใช้ค่า default');
        setMatchingInfo({
          fullMatches: [],
          partialMatches: [],
          weighted: {}
        });
        return;
      }

      const matchInfo = findAllMatches(matching.intersection, tripDuration, matching.weighted);
      
      // ✅ เพิ่มข้อมูล weighted เข้าไป
      setMatchingInfo({
        ...matchInfo,
        weighted: matching.weighted || {}
      });
      
      displayMatchingResults(matchInfo, tripDuration);

      console.log("Matching Info:", matchInfo);
      console.log("Weighted:", matching.weighted);
    })
    .catch((err) => {
      console.error("Load date matching failed", err);
      console.error("ไม่สามารถโหลดข้อมูลการแมทวันที่ได้");
      
      // ✅ ถ้า error ก็ให้ค่า default
      setMatchingInfo({
        fullMatches: [],
        partialMatches: [],
        weighted: {}
      });
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

  const findAllMatches = (
    intersection: string[], 
    maxDays: number,
    weighted?: Record<string, number>
  ) => {
    // 1. หาช่วงที่ตรงกันครบ N วัน (แบบเดิม)
    const fullMatches = findConsecutiveDays(intersection, maxDays);
    
    // 2. ถ้าไม่มี fullMatches → ใช้ partial matches (แบบเดิม)
    const partialMatches: { days: number; ranges: string[][] }[] = [];
    
    if (fullMatches.length === 0) {
      for (let days = maxDays - 1; days >= 1; days--) {
        const matches = findConsecutiveDays(intersection, days);
        if (matches.length > 0) {
          partialMatches.push({ days, ranges: matches });
        }
      }
    }
    
    // 3. ถ้ายังไม่มีเลย → ใช้ Sliding Window หาช่วงที่ดีที่สุด
    let bestAlternative = null;
    if (fullMatches.length === 0 && partialMatches.length === 0 && weighted) {
      bestAlternative = findBestDateRange(weighted, maxDays);
    }

    return { 
      fullMatches, 
      partialMatches,
      bestAlternative
    };
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

  // ================= SLIDING WINDOW WITH PENALTY =================

  /**
   * Sliding Window Algorithm สำหรับหาช่วงวันที่ดีที่สุด
   * คำนวณ Score จาก 3 ปัจจัย:
   * 1. Length Score: ใกล้เคียงกับ targetDays มากที่สุด
   * 2. Availability Score: จำนวนคนว่างเฉลี่ยสูงที่สุด
   * 3. Gap Penalty: ช่องว่างระหว่างวันน้อยที่สุด
   */
  const findBestDateRange = (
    weighted: Record<string, number>,
    targetDays: number
  ): {
    dates: string[];
    totalPeople: number;
    avgPeople: number;
    totalGap: number;
    score: number;
    isConsecutive: boolean;
  } | null => {
    
    const allDates = Object.keys(weighted).sort();
    
    if (allDates.length === 0) return null;
    if (allDates.length < targetDays) {
      // ถ้ามีวันน้อยกว่าที่ต้องการ ใช้ทุกวันที่มี
      return evaluateRange(allDates, weighted, targetDays);
    }
    
    let bestResult: ReturnType<typeof evaluateRange> = null;
    let bestScore = -Infinity;
    
    // Sliding Window: ลองทุกช่วงที่เป็นไปได้
    for (let windowSize = targetDays; windowSize >= Math.max(1, targetDays - 2); windowSize--) {
      for (let i = 0; i <= allDates.length - windowSize; i++) {
        const window = allDates.slice(i, i + windowSize);
        const result = evaluateRange(window, weighted, targetDays);
        
        if (result && result.score > bestScore) {
          bestScore = result.score;
          bestResult = result;
        }
      }
    }
    
    return bestResult;
  };

  /**
   * ประเมินคะแนนของช่วงวันที่
   */
  const evaluateRange = (
    dates: string[],
    weighted: Record<string, number>,
    targetDays: number
  ) => {
    if (dates.length === 0) return null;
    
    // 1. คำนวณจำนวนคนรวมและเฉลี่ย
    const totalPeople = dates.reduce((sum, date) => sum + (weighted[date] || 0), 0);
    const avgPeople = totalPeople / dates.length;
    
    // 2. คำนวณ Gap (ช่องว่างระหว่างวัน)
    let totalGap = 0;
    let isConsecutive = true;
    
    for (let i = 0; i < dates.length - 1; i++) {
      const dayDiff = (new Date(dates[i + 1]).getTime() - new Date(dates[i]).getTime()) 
                      / (1000 * 60 * 60 * 24);
      const gap = dayDiff - 1;
      
      if (gap > 0) {
        isConsecutive = false;
        totalGap += gap;
      }
    }
    
    // 3. คำนวณคะแนนรวม (สูง = ดี)
    const lengthScore = calculateLengthScore(dates.length, targetDays);
    const availabilityScore = avgPeople * 100; // คูณ 100 เพื่อให้มีน้ำหนักมากขึ้น
    const gapPenalty = totalGap * 50; // ลงโทษ gap แต่ละวัน 50 คะแนน
    const consecutiveBonus = isConsecutive ? 200 : 0; // โบนัสถ้าติดกันหมด
    
    const score = lengthScore + availabilityScore - gapPenalty + consecutiveBonus;
    
    return {
      dates,
      totalPeople,
      avgPeople: Math.round(avgPeople * 10) / 10,
      totalGap,
      score: Math.round(score),
      isConsecutive
    };
  };

  /**
   * คำนวณคะแนนจากความยาวช่วง
   * ยิ่งใกล้ targetDays ยิ่งได้คะแนนสูง
   */
  const calculateLengthScore = (actualDays: number, targetDays: number): number => {
    if (actualDays === targetDays) return 500; // Perfect match!
    
    const diff = Math.abs(actualDays - targetDays);
    
    if (diff === 1) return 300; // ต่างแค่ 1 วัน
    if (diff === 2) return 150; // ต่าง 2 วัน
    return Math.max(0, 100 - diff * 30); // ยิ่งห่างยิ่งหัก
  };

  // ฟังก์ชันหาจำนวนคนที่ว่างในช่วงวันนั้น
  const getAvailableCount = (dateRange: string[]): number => {
    if (!matchingInfo?.weighted) return 0;
    
    // หาจำนวนคนน้อยที่สุดในช่วงนั้น (เพราะต้องว่างทุกวัน)
    const counts = dateRange.map(date => matchingInfo.weighted![date] || 0);
    return Math.min(...counts);
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
      alert("กรุณาเลือกอย่างน้อย 1 วัน");
      return;
    }

    try {
      setLoading(true);

      if (!trip.tripid) {
        alert("ไม่พบข้อมูลทริป");
        return;
      }

      if (!trip.ownerid) {
        alert("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        user_id: trip.ownerid,
        ranges: selectedDates.sort(),
      });

      console.log("Selected Dates:", selectedDates);

      // ✅ แสดงแค่ Smart Toast (ไม่ใช้ toast.success)
      setJustSaved(true);

      // เรียก onSave callback
      if (onSave) {
        await onSave(selectedDates);
      }

    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const currentCoverage = checkCoverageStatus(selectedDates);

  // ============== ANALYSIS MODAL ==============
  const renderAnalysisModal = () => {
    if (!showAnalysisModal || !matchingInfo) return null;

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
          <div className="p-6 custom-scrollbar">
            {/* ความคืบหน้า */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-semibold">📊 ความคืบหน้าการกรอก</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${trip.members ? (Object.keys(matchingInfo?.weighted || {}).length / trip.members.length * 100) : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-900">
                  {Object.keys(matchingInfo?.weighted || {}).length}/{trip.members?.length || 0} คน
                </span>
              </div>
            </div>

            {/* ผลการวิเคราะห์ */}
            {matchingInfo.fullMatches.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold mb-3">
                  ✅ พบวันที่ทุกคนว่างพร้อมกัน {tripDuration} วัน: {matchingInfo.fullMatches.length} ช่วง
                </p>
                <div className="space-y-3">
                  {matchingInfo.fullMatches.slice(0, 3).map((range, idx) => {
                    const start = new Date(range[0]);
                    const end = new Date(range[range.length - 1]);
                    return (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-green-300 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} ช่วงที่ {idx + 1}
                            </p>
                            <p className="text-sm text-gray-600">
                              📅 {start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} 
                              {' - '}
                              {end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {getAvailableCount(range)}
                            </p>
                            <p className="text-xs text-gray-600">คนว่าง</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {matchingInfo.fullMatches.length > 3 && (
                    <p className="text-sm text-green-600 text-center">
                      และอีก {matchingInfo.fullMatches.length - 3} ช่วง...
                    </p>
                  )}
                </div>
              </div>
            ) : matchingInfo.partialMatches.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ ไม่พบวันที่ทุกคนว่างพร้อมกัน {tripDuration} วันติดกัน
                  </p>
                </div>
                {matchingInfo.partialMatches.map((partial, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold mb-3">
                      📌 พบวันที่ว่างพร้อมกัน {partial.days} วันติดกัน: {partial.ranges.length} ช่วง
                    </p>
                    <div className="space-y-2">
                      {partial.ranges.slice(0, 3).map((range, ridx) => {
                        const start = new Date(range[0]);
                        const end = new Date(range[range.length - 1]);
                        return (
                          <div key={ridx} className="bg-white rounded-lg p-3 border border-blue-300 shadow-sm">
                            <p className="text-sm text-blue-700">
                              📅 {start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} 
                              {' - '}
                              {end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                              <span className="ml-2 font-semibold">
                                👥 {getAvailableCount(range)} คน
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const bestAlt = matchingInfo?.bestAlternative;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-semibold">
                        ❌ ไม่พบวันที่ทุกคนว่างพร้อมกัน {tripDuration} วันติดกัน
                      </p>
                    </div>
                    
                    {bestAlt && (
                      <div className={`border rounded-lg p-4 ${
                        bestAlt.isConsecutive 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-orange-50 border-orange-300'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className={`font-semibold mb-1 ${
                              bestAlt.isConsecutive ? 'text-blue-800' : 'text-orange-800'
                            }`}>
                              {bestAlt.isConsecutive ? '💡' : '⚠️'} ช่วงที่แนะนำ (ใกล้เคียงที่สุด)
                            </p>
                            <p className="text-xs text-gray-600">
                              คะแนน: {bestAlt.score} • 
                              {bestAlt.dates.length === tripDuration 
                                ? ' ✓ ครบจำนวนวัน' 
                                : ` ${bestAlt.dates.length}/${tripDuration} วัน`
                              }
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {bestAlt.avgPeople}
                            </p>
                            <p className="text-xs text-gray-600">คนว่างเฉลี่ย</p>
                          </div>
                        </div>
                        
                        {/* แสดงวันที่ */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex flex-wrap gap-2 items-center">
                            {bestAlt.dates.map((date, idx) => {
                              const d = new Date(date);
                              const peopleCount = matchingInfo?.weighted?.[date] || 0;
                              
                              return (
                                <React.Fragment key={date}>
                                  <div className="flex flex-col items-center">
                                    <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${
                                      peopleCount >= (bestAlt.avgPeople || 0) 
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
                                  
                                  {idx < bestAlt.dates.length - 1 && (
                                    <span className="text-gray-400 text-xl">
                                      {(() => {
                                        const gap = (new Date(bestAlt.dates[idx + 1]).getTime() - d.getTime()) 
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
                            <span className={bestAlt.isConsecutive ? 'text-green-600' : 'text-orange-600'}>
                              {bestAlt.isConsecutive ? '✓ วันติดกันทั้งหมด' : `⚠️ มีช่องว่าง ${bestAlt.totalGap} วัน`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span>📊 รวม {bestAlt.totalPeople} คน-วัน</span>
                          </div>
                        </div>
                        
                        {/* คำอธิบาย */}
                        <div className="mt-3 bg-white bg-opacity-50 rounded-lg p-2 text-xs text-gray-700">
                          <p>
                            💡 ระบบแนะนำช่วงนี้จาก: 
                            <strong> ความยาวช่วง ({bestAlt.dates.length} วัน)</strong>, 
                            <strong> จำนวนคนว่าง ({bestAlt.avgPeople} คน/วัน)</strong>, 
                            <strong> ความต่อเนื่อง ({bestAlt.isConsecutive ? 'ติดกัน' : `ห่าง ${bestAlt.totalGap} วัน`})</strong>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!bestAlt && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm">
                          💭 ยังไม่มีข้อมูลเพียงพอสำหรับการแนะนำ
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
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
              {/* ← แก้ไขวันที่ */}
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

        {/* ✅ Smart Toast (แสดงหลังบันทึกสำเร็จ) */}
        {justSaved && (
          <>
            {/* Backdrop - คลิกปิด Toast */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-backdrop-fade-in"
              onClick={() => setJustSaved(false)}
            />
            
            {/* Toast Content - กลางหน้าจอ */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-toast-pop-up">
              <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 p-4 max-w-md">
                <div className="flex items-start gap-3">
                  {/* ปุ่มปิด X */}
                  <button
                    onClick={() => setJustSaved(false)}
                    className="ml-auto -mt-1 -mr-1 text-gray-400 hover:text-gray-600 transition"
                    aria-label="ปิด"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-start gap-3 mt-2">
                  <div className="flex-shrink-0 text-3xl">✅</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 mb-1">บันทึกวันที่สำเร็จ!</p>
                    <p className="text-sm text-gray-600 mb-3">
                      📊 {currentCoverage.hasFullCoverage 
                        ? `ครอบคลุม ${tripDuration} วันติดกัน ✓` 
                        : `ช่วงที่ดีที่สุด: ${currentCoverage.bestCoverage} วันติดกัน`
                      }
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('คลิกดูผลการวิเคราะห์'); 
                          console.log('matchingInfo:', matchingInfo);
                          setJustSaved(false);
                          setShowAnalysisModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                      >
                        🔍 ดูผลการวิเคราะห์
                      </button>
                      <button
                        onClick={() => {
                          setJustSaved(false);
                          onManualNext?.();
                        }}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        ไปหน้าถัดไป →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analysis Modal */}
      {renderAnalysisModal()}
    </>
  );
};

export default StepVote;