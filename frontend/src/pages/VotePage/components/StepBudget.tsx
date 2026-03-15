// src/pages/VotePage/components/StepBudget.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils';
import type { TripDetail, BudgetVotingResponse } from '../../../types';

// ============== API RESPONSE TYPES ==============

interface BudgetStats {
  avg: number;
  min: number;
  max: number;
  myValue: number;
  median?: number;
  outliersCount?: number;
}

interface BudgetStatsMap {
  accommodation: BudgetStats;
  transport: BudgetStats;
  food: BudgetStats;
  other: BudgetStats;
}

// ============== COMPONENT TYPES ==============

type BudgetInfo = Pick<BudgetVotingResponse, 'rows' | 'stats' | 'budgetTotal' | 'minTotal' | 'maxTotal' | 'filledMembers' | 'totalMembers'>;
interface StepBudgetProps {
  trip: TripDetail;
  budgetInfo?: BudgetInfo | null;
  onSave: (category: string, amount: number) => Promise<void>;
  onManualNext?: () => void;
  isLocked?: boolean;
  initialAnalysis?: any;
}

interface BudgetState {
  accommodation: number;
  transport: number;
  food: number;
  other: number;
}

// ============== CONSTANTS ==============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6', required: true },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6', required: true },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981', required: true },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b', required: false }
] as const;

// ✅ Validation Constants
const MAX_BUDGET = 10_000_000; // 10 ล้านบาท
const MIN_BUDGET = 0;

// ============== COMPONENT ==============
export const StepBudget: React.FC<StepBudgetProps> = ({ trip, budgetInfo, onSave, onManualNext, isLocked, initialAnalysis }, ) => {
  // ============== STATE ==============
  const [budget, setBudget] = useState<BudgetState>({
    accommodation: 0,
    transport: 0,
    food: 0,
    other: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetStats, setBudgetStats] = useState<BudgetStatsMap | null>(null);
  const [totalBudgetInfo, setTotalBudgetInfo] = useState<{
    budgetTotal: number;
    minTotal: number;
    maxTotal: number;
    filledMembers: number;
    totalMembers: number;
  } | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  // ✅ เปลี่ยนจาก justSaved เป็น hasSaved + isAnalysisOpen เหมือน StepVote
  const [hasSaved, setHasSaved] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const budgetRef = useRef(budget);
  useEffect(() => { budgetRef.current = budget; }, [budget]);

  // ✅ useRef สำหรับจัดการ timeout
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Cleanup timeout เมื่อ unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // ============== COMPUTED VALUES (useMemo) ==============
  const totalBudget = useMemo(() =>
    Object.values(budget).reduce((sum, val) => sum + val, 0),
    [budget]
  );

  const totalMembers = totalBudgetInfo?.totalMembers || trip.members?.length || 1;
  const filledBudgetMembers = totalBudgetInfo?.filledMembers || 0;
  console.log("filledBudgetMembers:", filledBudgetMembers);
  console.log("totalMembers:", totalBudgetInfo?.totalMembers);
  const tripDuration = trip.numdays;

  const validateBudget = useCallback((amount: number): { valid: boolean; error?: string } => {
    if (!Number.isFinite(amount)) {
      return { valid: false, error: 'ตัวเลขไม่ถูกต้อง' };
    }
    if (amount < MIN_BUDGET) {
      return { valid: false, error: 'จำนวนเงินต้องมากกว่าหรือเท่ากับ 0' };
    }
    if (amount > MAX_BUDGET) {
      return { valid: false, error: `งบประมาณสูงสุด ฿${formatCurrency(MAX_BUDGET)}` };
    }
    return { valid: true };
  }, []);

  // ============== LOAD BUDGET DATA ==============
  useEffect(() => {
    if (!budgetInfo) { setIsLoading(false); return; }

    setTotalBudgetInfo({
      budgetTotal: budgetInfo.budgetTotal || 0,
      minTotal: budgetInfo.minTotal || 0,
      maxTotal: budgetInfo.maxTotal || 0,
      filledMembers: budgetInfo.filledMembers || 0,
      totalMembers: budgetInfo.totalMembers || 0,
    });

    // 1. build loadedBudget ก่อน
    const loadedBudget: BudgetState = { accommodation: 0, transport: 0, food: 0, other: 0 };
    if (budgetInfo.rows && Array.isArray(budgetInfo.rows)) {
      budgetInfo.rows.forEach((vote: any) => {
        const category = vote.category_name as keyof BudgetState;
        if (category in loadedBudget) {
          loadedBudget[category] = Number(vote.estimated_amount) || 0;
        }
      });
    }

    // 2. set budget จาก loadedBudget ที่ build แล้ว
    if (budgetInfo.rows?.length > 0) {
      setBudget(prev => {
        const merged = { ...prev };
        Object.keys(loadedBudget).forEach((k) => {
          const key = k as keyof BudgetState;
          if (loadedBudget[key] > 0) {
            merged[key] = loadedBudget[key];
          }
        });
        return merged;
      });
      setHasSaved(true);
      setIsAnalysisOpen(true);
    }

    // 3. statsMap ใช้ loadedBudget ที่มีค่าแล้ว ✅
    if (budgetInfo.stats) {
      const statsMap: BudgetStatsMap = {
        accommodation: {
          avg: Math.round(budgetInfo.stats.accommodation?.q2 || 0),
          min: Math.round(budgetInfo.stats.accommodation?.q1 || 0),
          max: Math.round(budgetInfo.stats.accommodation?.q3 || 0),
          myValue: loadedBudget.accommodation > 0 ? loadedBudget.accommodation : budgetRef.current.accommodation,
          median: Math.round(budgetInfo.stats.accommodation?.q2 || 0)
        },
        transport: {
          avg: Math.round(budgetInfo.stats.transport?.q2 || 0),
          min: Math.round(budgetInfo.stats.transport?.q1 || 0),
          max: Math.round(budgetInfo.stats.transport?.q3 || 0),
          myValue: loadedBudget.transport > 0 ? loadedBudget.transport : budgetRef.current.transport,
          median: Math.round(budgetInfo.stats.transport?.q2 || 0)
        },
        food: {
          avg: Math.round(budgetInfo.stats.food?.q2 || 0),
          min: Math.round(budgetInfo.stats.food?.q1 || 0),
          max: Math.round(budgetInfo.stats.food?.q3 || 0),
          myValue: loadedBudget.food > 0 ? loadedBudget.food : budgetRef.current.food,
          median: Math.round(budgetInfo.stats.food?.q2 || 0)
        },
        other: {
          avg: Math.round(budgetInfo.stats.other?.q2 || 0),
          min: Math.round(budgetInfo.stats.other?.q1 || 0),
          max: Math.round(budgetInfo.stats.other?.q3 || 0),
          myValue: loadedBudget.other > 0 ? loadedBudget.other : budgetRef.current.other,
          median: Math.round(budgetInfo.stats.other?.q2 || 0)
        }
      };
      setBudgetStats(statsMap);
    }

    setIsLoading(false);
  }, [budgetInfo]);

  // ============== HANDLERS ==============

  const handleSaveCategory = useCallback(async (category: keyof BudgetState) => {
    if (isLocked) return;
    const amount = budget[category];
    const validation = validateBudget(amount);
    if (!validation.valid) {  
      alert(validation.error);
      return;
    }
    if (amount === 0) {
      alert('กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(category, amount);
      console.log(`✅ บันทึก ${category} สำเร็จ: ฿${amount}`);
      setHasSaved(true);
      setIsAnalysisOpen(true);
    } catch (error) {
      console.error(`Error saving ${category}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'ไม่สามารถบันทึกได้';
      setError(`ไม่สามารถบันทึก ${category} ได้: ${errorMsg}`);
      alert(`❌ บันทึกไม่สำเร็จ: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  }, [budget, validateBudget, onSave]);

  const handleBudgetChange = useCallback((key: keyof BudgetState, value: number) => {
    const validation = validateBudget(value);
    if (!validation.valid) {
      alert(`❌ ${validation.error}`);
      return;
    }
    setBudget(prev => ({ ...prev, [key]: value }));
  }, [validateBudget]);

  const handleSaveAll = useCallback(async () => {
    if (isLocked) return;
    const hasRequiredBudget =
      budget.accommodation > 0 &&
      budget.transport > 0 &&
      budget.food > 0;

    if (!hasRequiredBudget) {
      alert('กรุณากรอกงบประมาณที่จำเป็น (ที่พัก, เดินทาง, อาหาร)');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const results = [];
      for (const category of BUDGET_CATEGORIES) {
        if (budget[category.key] === 0) continue;
        try {
          await onSave(category.key, budget[category.key]);
          results.push({ category: category.key });
        } catch (err) {
          console.error(`Failed to save ${category.key}:`, err);
          results.push({ error: err, category: category.key });
        }
      }
      const failures = results.filter(r => r && 'error' in r);

      if (failures.length > 0) {
        const failedCategories = failures.map((f: any) => f.category).join(', ');
        setError(`บันทึกไม่สำเร็จสำหรับ: ${failedCategories}`);
        alert(`⚠️ บันทึกสำเร็จบางส่วน (${results.length - failures.length}/${results.length} หมวด)`);
      } else {
        setBudgetStats(prev => prev ? {
          ...prev,
          accommodation: { ...prev.accommodation, myValue: budget.accommodation },
          transport:     { ...prev.transport,     myValue: budget.transport },
          food:          { ...prev.food,          myValue: budget.food },
          other:         { ...prev.other,         myValue: budget.other },
        } : {
          accommodation: { avg: budget.accommodation, min: budget.accommodation, max: budget.accommodation, myValue: budget.accommodation },
          transport:     { avg: budget.transport,     min: budget.transport,     max: budget.transport,     myValue: budget.transport },
          food:          { avg: budget.food,          min: budget.food,          max: budget.food,          myValue: budget.food },
          other:         { avg: budget.other,         min: budget.other,         max: budget.other,         myValue: budget.other },
        });
      setHasSaved(true);
      setIsAnalysisOpen(true);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
      alert('❌ เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      setIsSaving(false);
    }
  }, [budget, onSave]);

  // ============== ANALYSIS MODAL ==============
  const renderAnalysisModal = () => {
    if (!showAnalysisModal || !budgetStats) return null;

    const totalStats = {
      myTotal: totalBudget,
      avgTotal: Object.values(budgetStats).reduce((sum, s) => sum + s.avg, 0),
      minTotal: Object.values(budgetStats).reduce((sum, s) => sum + s.min, 0),
      maxTotal: Object.values(budgetStats).reduce((sum, s) => sum + s.max, 0)
    };

    const hasRealStats = (() => {
      const voterCount = totalBudgetInfo?.filledMembers || 0;
      if (voterCount < 2) return false;
      return Object.values(budgetStats).some(s => {
        if (s.avg === 0 && s.min === 0 && s.max === 0) return false;
        if (voterCount === 2) return s.min !== s.max;
        return s.median !== undefined && s.median > 0;
      });
    })();

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-backdrop-fade-in"
        onClick={() => setShowAnalysisModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-modal-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl flex justify-between items-center z-10">
            <h3 className="text-xl font-bold">💰 ผลการวิเคราะห์งบประมาณ</h3>
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* ความคืบหน้าการกรอก */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-semibold">📊 ความคืบหน้าการกรอก</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (filledBudgetMembers / totalMembers) * 100
                      )}%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-900">
                  {filledBudgetMembers}/{totalMembers} คน
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {hasRealStats
                  ? '✅ มีข้อมูลเปรียบเทียบจากสมาชิกหลายคนแล้ว'
                  : '⏳ รอสมาชิกคนอื่นกรอกเพื่อเปรียบเทียบ'
                }
              </p>
            </div>

            {!hasRealStats && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">ข้อมูลเบื้องต้น</p>
                    <p className="text-sm text-yellow-800">
                      ขณะนี้แสดงเฉพาะงบประมาณของคุณ เมื่อมีสมาชิกคนอื่นกรอกงบเพิ่มเติม
                      ระบบจะแสดงการเปรียบเทียบแบบเต็มรูปแบบ
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* สรุปรวม */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3">📊 สรุปงบประมาณรวม</h4>
              <div className="grid grid-cols-2 gap-4">
                {BUDGET_CATEGORIES.map(({ key, label, color }) => {
                  const stat = budgetStats[key];
                  if (!stat || stat.myValue === 0) return null;

                  const range = stat.max - stat.min;
                  const position = range > 0
                    ? Math.max(5, Math.min(95, ((stat.myValue - stat.min) / range) * 100))
                    : 50;

                  return (
                    <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-gray-800">{label}</span>
                      </div>

                      {hasRealStats ? (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-2 border-blue-200">
                            <p className="text-xs text-gray-600 mb-1">งบของคุณ</p>
                            <p className="text-2xl font-bold" style={{ color }}>
                              ฿{formatCurrency(stat.myValue)}
                            </p>
                            {(() => {
                              const diffFromAvg = stat.myValue - stat.avg;
                              const diffPercent = stat.avg > 0
                                ? Math.round((diffFromAvg / stat.avg) * 100)
                                : 0;
                              return (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  {diffFromAvg === 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">✓</span>
                                      <span className="text-sm text-green-700 font-semibold">ตรงกับค่าเฉลี่ย</span>
                                    </div>
                                  ) : diffFromAvg > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg text-orange-600">↑</span>
                                      <div className="flex-1">
                                        <span className="text-sm text-orange-700 font-semibold block">สูงกว่าค่าเฉลี่ย</span>
                                        <span className="text-xs text-orange-600">+{Math.abs(diffPercent)}% (฿{formatCurrency(Math.abs(diffFromAvg))})</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg text-green-600">↓</span>
                                      <div className="flex-1">
                                        <span className="text-sm text-green-700 font-semibold block">ต่ำกว่าค่าเฉลี่ย</span>
                                        <span className="text-xs text-green-600">-{Math.abs(diffPercent)}% (฿{formatCurrency(Math.abs(diffFromAvg))})</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 mb-3">ตำแหน่งของคุณเทียบกับทุกคน</p>
                            <div className="relative py-2">
                              <div className="h-3 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100 rounded-full relative">
                                {(() => {
                                  const avgPosition = stat.avg > 0 && stat.min !== stat.max
                                    ? ((stat.avg - stat.min) / range) * 100
                                    : null;
                                  const isTooClose = avgPosition !== null && Math.abs(position - avgPosition) < 15;
                                  return (
                                    <>
                                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group cursor-pointer" style={{ left: `${position}%` }}>
                                        <div className="w-3 h-3 rounded-full border-3 border-white shadow-lg group-hover:scale-125 transition-transform duration-200" style={{ backgroundColor: color }} />
                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-50 transition-opacity duration-200 pointer-events-none">
                                          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap">
                                            <div className="font-bold mb-1">คุณ</div>
                                            <div className="text-gray-300">฿{formatCurrency(stat.myValue)}</div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"><div className="border-4 border-transparent border-t-gray-900"></div></div>
                                          </div>
                                        </div>
                                      </div>
                                      {avgPosition !== null && (
                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer" style={{ left: `${Math.max(5, Math.min(95, avgPosition))}%` }}>
                                          <div className="w-3 h-3 bg-gray-600 rounded-full border-2 border-white shadow group-hover:scale-125 transition-transform duration-200" />
                                          <div className={`absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${isTooClose ? 'top-full mt-2' : '-top-16'}`}>
                                            <div className="bg-gray-700 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap">
                                              <div className="font-bold mb-1">ค่าเฉลี่ย</div>
                                              <div className="text-gray-300">฿{formatCurrency(stat.avg)}</div>
                                              <div className={`absolute left-1/2 -translate-x-1/2 ${isTooClose ? 'bottom-full mb-px' : 'top-full -mt-px'}`}>
                                                <div className={`border-4 border-transparent ${isTooClose ? 'border-b-gray-700' : 'border-t-gray-700'}`}></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex justify-between text-xs text-gray-600 mt-3 px-1">
                                <div className="text-left">
                                  <div className="font-semibold text-green-700">ต่ำสุด</div>
                                  <div className="text-gray-800">฿{formatCurrency(stat.min)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-red-700">สูงสุด</div>
                                  <div className="text-gray-800">฿{formatCurrency(stat.max)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">ดูข้อมูลเพิ่มเติม</summary>
                            <div className="mt-2 space-y-1 bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">ค่าเฉลี่ย (หลังตัด outliers):</span>
                                <span className="font-semibold">฿{formatCurrency(stat.avg)}</span>
                              </div>
                              {stat.median && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">ค่ากลาง (Median):</span>
                                  <span className="font-semibold text-blue-600">฿{formatCurrency(stat.median)}</span>
                                </div>
                              )}
                              {stat.outliersCount !== undefined && stat.outliersCount > 0 && (
                                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200">
                                  <span className="text-orange-600">⚠️</span>
                                  <div className="flex-1">
                                    <span className="text-orange-600 font-semibold">ตัดค่าผิดปกติ {stat.outliersCount} รายการ</span>
                                    <p className="text-xs text-orange-500 mt-1">ค่าเหล่านี้ห่างจากค่าเฉลี่ยมากเกินไป จึงไม่นำมาคำนวณ</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic text-center py-8">รอสมาชิกคนอื่นกรอกเพื่อเปรียบเทียบ</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* คำแนะนำ */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="text-sm text-purple-800">
                💡 <strong>คำแนะนำ:</strong> {
                  hasRealStats
                    ? totalStats.myTotal > totalStats.avgTotal
                      ? 'งบของคุณสูงกว่าค่าเฉลี่ย อาจพิจารณาปรับลดได้'
                      : totalStats.myTotal < totalStats.avgTotal
                      ? 'งบของคุณต่ำกว่าค่าเฉลี่ย อาจพิจารณาเพิ่มงบสำรองได้'
                      : 'งบของคุณใกล้เคียงกับค่าเฉลี่ย เหมาะสม!'
                    : 'เชิญชวนสมาชิกคนอื่นกรอกงบประมาณเพื่อดูการเปรียบเทียบ'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============== LOADING STATE ==============
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">กำลังโหลดข้อมูลงบประมาณ...</p>
      </div>
    );
  }

  // ============== RENDER ==============
  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 animate-shake">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800 mb-1">เกิดข้อผิดพลาด</p>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              ปิดข้อความนี้
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* แก้ไขงบประมาณ */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
            💰 กรุณากรอกงบประมาณ (จำนวนเงินแต่ละหมวดต่อ {tripDuration} วัน)
          </h3>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse min-w-[500px]">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">จำนวนเงิน (฿)</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700 w-24">บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATEGORIES.map(({ key, label, color }) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-800">{label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        disabled={isSaving || isLocked}
                        min={MIN_BUDGET}
                        max={MAX_BUDGET}
                        step={100}
                        value={budget[key] || ''}
                        placeholder="0"
                        className="w-full text-right border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        onChange={e => handleBudgetChange(key, Number(e.target.value) || 0)}
                        id={`budget-input-${key}`}
                        onKeyDown={async (e) => {
                          if (e.key !== 'Enter') return;
                          await handleSaveCategory(key);
                          const keys = BUDGET_CATEGORIES.map(c => c.key);
                          const nextKey = keys[keys.indexOf(key) + 1];
                          if (nextKey) {
                            document.getElementById(`budget-input-${nextKey}`)?.focus();
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleSaveCategory(key)}
                        disabled={isSaving || budget[key] === 0 || isLocked}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition"
                      >
                        {isLocked ? '🔒' : 'บันทึก'}
                      </button>
                    </td>
                  </tr>
                ))}

                {/* รวม */}
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                  <td className="px-4 py-3 text-gray-800">รวมทั้งหมด</td>
                  <td className="px-4 py-3 text-right text-blue-700 text-lg">
                    ฿{formatCurrency(totalBudget)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {isSaving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">กำลังบันทึก...</span>
            </div>
          )}
        </div>

        {/* ปุ่มบันทึกทั้งหมด */}
        <button
          onClick={handleSaveAll}
          disabled={isSaving || totalBudget === 0 || isLocked}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังบันทึก...
            </span>
          ) : (
            <span>{isLocked ? '🔒 ปิดการโหวตแล้ว' : `บันทึกงบประมาณทั้งหมด (฿${formatCurrency(totalBudget)})`}</span>
          )}
        </button>

        {/* ✅ ผลการวิเคราะห์ inline (เหมือน StepVote) — แสดงหลังบันทึก */}
        {hasSaved && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">

            {/* Header — กดเพื่อพับ/ขยาย */}
            <button
              onClick={() => setIsAnalysisOpen(prev => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span className="font-bold text-gray-800 text-sm">ผลการวิเคราะห์งบประมาณ</span>
              </div>
              <span className="text-gray-400 text-sm">{isAnalysisOpen ? '▲ ซ่อน' : '▼ ดูผล'}</span>
            </button>

            {/* Content — แสดงเมื่อ isAnalysisOpen */}
            {isAnalysisOpen && budgetStats && (() => {
              const voterCount = totalBudgetInfo?.filledMembers || 0;
              const hasRealStats = voterCount >= 1 && Object.values(budgetStats).some(s => {
                return s.avg > 0 || s.min > 0 || s.max > 0;
              });
              const totalAvg = Object.values(budgetStats).reduce((sum, s) => sum + s.avg, 0);

              return (
                <div className="p-4 space-y-4">

                  {/* ความคืบหน้า */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (filledBudgetMembers / totalMembers) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                        {filledBudgetMembers}/{totalMembers} คน
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {hasRealStats ? '✅ มีข้อมูลเปรียบเทียบจากสมาชิกหลายคนแล้ว' : '⏳ รอสมาชิกคนอื่นกรอกเพื่อเปรียบเทียบ'}
                    </p>
                  </div>

                  {/* รายหมวด */}
                  {BUDGET_CATEGORIES.map(({ key, label, color }) => {
                    const stat = budgetStats[key];
                    if (!stat || stat.myValue === 0) return null;

                    const diffFromAvg = stat.myValue - stat.avg;
                    const diffPercent = stat.avg > 0 ? Math.round((diffFromAvg / stat.avg) * 100) : 0;

                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-sm font-semibold text-gray-800">{label}</span>
                          </div>
                          <span className="text-lg font-bold" style={{ color }}>
                            ฿{formatCurrency(stat.myValue)}
                          </span>
                        </div>

                        {hasRealStats ? (
                          <div className="space-y-2">
                            {/* เปรียบเทียบ */}
                            <div className="flex items-center gap-2 text-sm">
                              {diffFromAvg === 0 ? (
                                <><span className="text-green-600">✓</span><span className="text-green-700 font-semibold">ตรงกับค่าเฉลี่ย</span></>
                              ) : diffFromAvg > 0 ? (
                                <><span className="text-orange-600">↑</span><span className="text-orange-700 font-semibold">สูงกว่าค่าเฉลี่ย +{Math.abs(diffPercent)}%</span><span className="text-xs text-orange-500">(฿{formatCurrency(Math.abs(diffFromAvg))})</span></>
                              ) : (
                                <><span className="text-green-600">↓</span><span className="text-green-700 font-semibold">ต่ำกว่าค่าเฉลี่ย -{Math.abs(diffPercent)}%</span><span className="text-xs text-green-500">(฿{formatCurrency(Math.abs(diffFromAvg))})</span></>
                              )}
                            </div>

                            {/* Range Bar */}
                            {(() => {
                              const range = stat.max - stat.min;
                              const position = range > 0
                                ? Math.max(5, Math.min(95, ((stat.myValue - stat.min) / range) * 100))
                                : 50;
                              return (
                                <div className="relative">
                                  <div className="relative h-2 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100 rounded-full">
                                    {(() => {
                                      const range = stat.max - stat.min;
                                      const avgPosition = range > 0
                                        ? Math.max(5, Math.min(95, ((stat.avg - stat.min) / range) * 100))
                                        : 50;
                                      return (
                                        <div
                                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                                          style={{ left: `${avgPosition}%` }}
                                        >
                                          {/* เส้นตั้ง */}
                                          <div className="w-0.5 h-4 bg-gray-500 rounded-full" />
                                          {/* Tooltip */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="bg-gray-700 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                                              ค่าเฉลี่ย: ฿{formatCurrency(stat.avg)}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    <div
                                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer"
                                      style={{ left: `${position}%` }}
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full border-2 border-white shadow group-hover:scale-125 transition-transform"
                                        style={{ backgroundColor: color }}
                                      />
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                                          คุณ: ฿{formatCurrency(stat.myValue)}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>฿{formatCurrency(stat.min)}</span>
                                    <span className="text-gray-400">ค่าเฉลี่ย ฿{formatCurrency(stat.avg)}</span>
                                    <span>฿{formatCurrency(stat.max)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">รอสมาชิกคนอื่นกรอกเพื่อเปรียบเทียบ</p>
                        )}
                      </div>
                    );
                  })}

                  {/* คำแนะนำ */}
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                    <p className="text-sm text-purple-800">
                      💡 <strong>คำแนะนำ:</strong> {
                        hasRealStats
                          ? totalBudget > totalAvg
                            ? 'งบของคุณสูงกว่าค่าเฉลี่ย อาจพิจารณาปรับลดได้'
                            : totalBudget < totalAvg
                            ? 'งบของคุณต่ำกว่าค่าเฉลี่ย อาจพิจารณาเพิ่มงบสำรองได้'
                            : 'งบของคุณใกล้เคียงกับค่าเฉลี่ย เหมาะสม!'
                          : 'เชิญชวนสมาชิกคนอื่นกรอกงบประมาณเพื่อดูการเปรียบเทียบ'
                      }
                    </p>
                  </div>          
                </div>
              );
            })()}
          </div>
        )}

        {/* คำแนะนำ */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            💡 <strong>หมายเหตุ:</strong> คุณสามารถบันทึกทีละหมวดหมู่ หรือบันทึกทั้งหมดพร้อมกันได้
          </p>
          <p className="text-xs text-blue-700 mt-1">
            * หมวดหมู่ที่มี * เป็นหมวดหมู่ที่จำเป็นต้องกรอก
          </p>
        </div>
      </div>

      {/* Analysis Modal */}
      {renderAnalysisModal()}
    </>
  );
};

export default StepBudget;