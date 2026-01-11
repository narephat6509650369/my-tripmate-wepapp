import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG } from '../../../config/app.config';
import { formatCurrency } from '../../../utils/helpers';
import { TripData, Member, BudgetPriority, HistoryEntry } from '../../../data/mockData';

// ============== TYPES ==============
interface StepBudgetProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  setMemberBudget: React.Dispatch<React.SetStateAction<Member | null>>;
  tripCode: string;
  budgetStats: Record<string, BudgetStats>;
  totalBudget: number;
  addHistory: (step: number, stepName: string, action: string) => void;
  onNavigateToStep: (step: number) => void;
  onBudgetChange?: (budget: Member['budget']) => void;
}

interface BudgetStats {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  avg: number;
  count: number;
  values: number[];
  outliers?: number;
}

// ============== CONSTANTS ==============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

// ============== RANGE BAR COMPONENT ==============
interface RangeBarProps {
  stats: BudgetStats;
  label: string;
  color?: string;
  currentValue?: number;
}

const RangeBar: React.FC<RangeBarProps> = ({ stats, label, color = "#3b82f6", currentValue }) => {
  if (stats.count === 0) return null;

  const widthPx = 300;
  const pad = Math.max(0.05 * (stats.max - stats.min || 1), 1);
  const domainMin = stats.min - pad;
  const domainMax = stats.max + pad;
  const scale = (v: number) => ((v - domainMin) / (domainMax - domainMin)) * widthPx;
  
  const xMin = scale(stats.min);
  const xQ1 = scale(stats.q1);
  const xQ3 = scale(stats.q3);
  const xMax = scale(stats.max);
  const xMed = scale(stats.median);
  const xCurrent = currentValue !== undefined ? scale(currentValue) : null;

  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={widthPx} height={50} className="mx-auto">
          <line x1={xMin} x2={xMax} y1={25} y2={25} stroke="#e0e7ff" strokeWidth={6} strokeLinecap="round" />
          <rect x={xQ1} y={12} width={Math.max(1, xQ3 - xQ1)} height={26} fill={color} fillOpacity={0.2} rx={4} />
          <line x1={xMed} x2={xMed} y1={8} y2={42} stroke={color} strokeWidth={2} />
          {xCurrent !== null && (
            <circle cx={xCurrent} cy={25} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
          )}
          <circle cx={xMin} cy={25} r={3} fill={color} />
          <circle cx={xMax} cy={25} r={3} fill={color} />
        </svg>
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <span>฿{formatCurrency(stats.min)}</span>
        <span className="font-semibold text-gray-800">฿{formatCurrency(Math.round(stats.median))}</span>
        <span>฿{formatCurrency(stats.max)}</span>
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
export const StepBudget: React.FC<StepBudgetProps> = ({
  trip,
  setTrip,
  memberBudget,
  setMemberBudget,
  tripCode,
  budgetStats,
  totalBudget,
  addHistory,
  onNavigateToStep,
  onBudgetChange
}) => {
  if (!memberBudget) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <p className="text-gray-500">ไม่พบข้อมูลสมาชิก</p>
      </div>
    );
  }

  // ============== STATE ==============
  const [isSaving, setIsSaving] = useState(false);
  const [localBudget, setLocalBudget] = useState(memberBudget.budget);
  const [priorities, setPriorities] = useState<{
    accommodation: BudgetPriority;
    transport: BudgetPriority;
    food: BudgetPriority;
  }>(
    memberBudget.budgetPriorities || {
      accommodation: 2,
      transport: 2,
      food: 2
    }
  );
  const [followMajority, setFollowMajority] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ============== AUTO-SAVE LISTENER ==============
  useEffect(() => {
    const handleAutoSave = async () => {
      console.log('📥 Received auto-save event for budget');
      
      if (followMajority && (
        localBudget.accommodation === 0 ||
        localBudget.transport === 0 ||
        localBudget.food === 0
      )) {
        const otherMembers = trip.members?.filter(m => 
          m.id !== memberBudget?.id &&
          m.budget.accommodation > 0 && 
          m.budget.transport > 0 && 
          m.budget.food > 0
        ) || [];
        
        if (otherMembers.length > 0) {
          const avgBudget = {
            accommodation: 0,
            transport: 0,
            food: 0,
            other: 0
          };
          
          otherMembers.forEach(m => {
            avgBudget.accommodation += m.budget.accommodation;
            avgBudget.transport += m.budget.transport;
            avgBudget.food += m.budget.food;
            avgBudget.other += m.budget.other;
          });
          
          avgBudget.accommodation = Math.round(avgBudget.accommodation / otherMembers.length);
          avgBudget.transport = Math.round(avgBudget.transport / otherMembers.length);
          avgBudget.food = Math.round(avgBudget.food / otherMembers.length);
          avgBudget.other = Math.round(avgBudget.other / otherMembers.length);
          
          setLocalBudget(avgBudget);
          
          if (onBudgetChange) {
            onBudgetChange(avgBudget);
          }
          
          setTimeout(() => saveBudget(), 100);
          return;
        }
      }
      
      saveBudget();
    };
    
    window.addEventListener('auto-save-budget', handleAutoSave);
    
    return () => {
      window.removeEventListener('auto-save-budget', handleAutoSave);
    };
  }, [localBudget, followMajority]);

  // ============== SAVE BUDGET ==============
  const saveBudget = async (): Promise<void> => {
    if (isSaving) {
      console.log('⏳ Already saving, skipping update');
      return;
    }
    
    const hasValidBudget = 
      localBudget.accommodation > 0 &&
      localBudget.transport > 0 &&
      localBudget.food > 0;
    
    if (!hasValidBudget) {
      console.log('❌ Please fill all required fields');
      return;
    }

    const nowTs = Date.now();
    const newBudget = { ...localBudget, lastUpdated: nowTs };

    const updatedMember = {
      ...memberBudget,
      budget: newBudget
    };

    setMemberBudget(updatedMember);

    setTrip(prev => ({
      ...prev,
      members: prev.members?.map(m =>
        m.id === memberBudget.id ? updatedMember : m
      ) || []
    }));

    setIsSaving(true);

    try {
      let response;

      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
        response = { success: true };
      } else {
        response = await tripAPI.updateMemberBudget(tripCode, memberBudget.id, newBudget);
      }

      if (response.success) {
        addHistory(3, 'งบประมาณ', `บันทึกงบประมาณ: ที่พัก ฿${formatCurrency(newBudget.accommodation)}, เดินทาง ฿${formatCurrency(newBudget.transport)}, อาหาร ฿${formatCurrency(newBudget.food)}`);
        console.log('✅ Budget saved successfully');
      } else {
        throw new Error(response.message || 'ไม่สามารถบันทึกได้');
      }

    } catch (err) {
      console.error("❌ Error saving budget:", err);
      setMemberBudget(memberBudget);
      setTrip(prev => ({
        ...prev,
        members: prev.members?.map(m =>
          m.id === memberBudget.id ? memberBudget : m
        ) || []
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // ============== HANDLE INPUT CHANGE ==============
  const handleBudgetChange = (key: keyof Member["budget"], value: number) => {
    const newBudget = { ...localBudget, [key]: value };
    setLocalBudget(newBudget);
    
    if (onBudgetChange) {
      onBudgetChange(newBudget);
    }
  };

  // ============== UPDATE PRIORITY ==============
  const updatePriority = async (category: keyof typeof priorities, value: BudgetPriority) => {
    const newPriorities = { ...priorities, [category]: value };
    setPriorities(newPriorities);

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.updateBudgetPriority?.(tripCode, memberBudget.id, newPriorities);
      }

      setMemberBudget(prev => prev ? { ...prev, budgetPriorities: newPriorities } : null);

      setTrip(prev => ({
        ...prev,
        members: prev.members?.map(m =>
          m.id === memberBudget.id ? { ...m, budgetPriorities: newPriorities } : m
        ) || []
      }));

      addHistory(3, 'งบประมาณ', `เปลี่ยนความสำคัญ ${category}`);
    } catch (error) {
      setPriorities(memberBudget.budgetPriorities || priorities);
    }
  };

  // ============== HELPER FUNCTIONS ==============
  const getPriorityLabel = (priority: BudgetPriority): string => {
    switch (priority) {
      case 1: return "⭐⭐⭐";
      case 2: return "⭐⭐";
      case 3: return "⭐";
    }
  };

  const getPriorityColor = (priority: BudgetPriority): string => {
    switch (priority) {
      case 1: return "text-red-600";
      case 2: return "text-yellow-600";
      case 3: return "text-green-600";
    }
  };

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ============ แก้ไขงบประมาณ + Priority ในตาราง ============ */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">💰 แก้ไขงบประมาณ</h3>
      
      {/* ✅ เพิ่ม horizontal scroll indicator */}
      <div className="relative">
        {/* Scroll hint for mobile */}
        <div className="sm:hidden absolute -top-2 right-0 text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
          👉 เลื่อนดู →
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-4 sm:mx-0">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-gray-700 text-sm sm:text-base">
                  หมวดหมู่
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold text-gray-700 text-sm sm:text-base">
                  จำนวนเงิน (฿)
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-gray-700 text-xs sm:text-sm">
                  ความสำคัญ
                </th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_CATEGORIES.map(({ key, label, color }) => (
                <tr key={key} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                      <span className="font-medium text-gray-800 text-sm sm:text-base">{label}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <input 
                      type="number" 
                      disabled={isSaving}
                      min={0}
                      step={100}
                      value={localBudget[key]}
                      className="w-full text-right border-2 border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onChange={e => handleBudgetChange(key, Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    {(key === 'accommodation' || key === 'transport' || key === 'food') && (
                      <div className="flex gap-0.5 sm:gap-1 justify-center">
                        {[1, 2, 3].map((priority) => (
                          <button
                            key={priority}
                            onClick={() => updatePriority(key, priority as BudgetPriority)}
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${
                              priorities[key] === priority
                                ? `${getPriorityColor(priority as BudgetPriority)} bg-gray-100 border border-gray-300`
                                : "text-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            {getPriorityLabel(priority as BudgetPriority)}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-800 text-sm sm:text-base">รวมทั้งหมด</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-blue-700 text-base sm:text-lg">
                  ฿{formatCurrency(
                    localBudget.accommodation + 
                    localBudget.transport + 
                    localBudget.food + 
                    localBudget.other
                  )}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isSaving && (
        <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">กำลังบันทึก...</span>
        </div>
      )}
    </div>

      {/* Follow Majority */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={followMajority}
              onChange={(e) => {
                const checked = e.target.checked;
                setFollowMajority(checked);
                
                if (checked) {
                  const otherMembers = trip.members?.filter(m => 
                    m.id !== memberBudget.id &&
                    m.budget.accommodation > 0 && 
                    m.budget.transport > 0 && 
                    m.budget.food > 0
                  ) || [];
                  
                  if (otherMembers.length > 0) {
                    const avgBudget = {
                      accommodation: 0,
                      transport: 0,
                      food: 0,
                      other: 0
                    };
                    
                    otherMembers.forEach(m => {
                      avgBudget.accommodation += m.budget.accommodation;
                      avgBudget.transport += m.budget.transport;
                      avgBudget.food += m.budget.food;
                      avgBudget.other += m.budget.other;
                    });
                    
                    avgBudget.accommodation = Math.round(avgBudget.accommodation / otherMembers.length);
                    avgBudget.transport = Math.round(avgBudget.transport / otherMembers.length);
                    avgBudget.food = Math.round(avgBudget.food / otherMembers.length);
                    avgBudget.other = Math.round(avgBudget.other / otherMembers.length);
                    
                    setLocalBudget(avgBudget);
                    
                    if (onBudgetChange) {
                      onBudgetChange(avgBudget);
                    }
                  } else {
                    setFollowMajority(false);
                  }
                }
              }}
              className="mt-1 w-5 h-5 text-purple-600"
            />
            <div>
              <p className="font-semibold text-purple-900">✨ ใช้งบเฉลี่ยของกลุ่ม</p>
              <p className="text-sm text-purple-700 mt-1">
                ระบบจะคำนวณงบเฉลี่ยจากเพื่อนที่กรอกไปแล้วให้อัตโนมัติ
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ✅ ปุ่มดูผลลัพธ์ */}
      {(localBudget.accommodation > 0 || localBudget.transport > 0 || localBudget.food > 0) && (
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

      {/* ============ การกระจายงบประมาณ - Compact ============ */}
      {showResults && (localBudget.accommodation > 0 || localBudget.transport > 0 || localBudget.food > 0) && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>เปรียบเทียบกับกลุ่ม</span>
          </h3>
          
          <div className="flex gap-3 mb-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>คุณ</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-[2px] bg-blue-500"></span>
              <span>ค่ากลาง</span>
            </div>
          </div>

          {BUDGET_CATEGORIES.map(({ key, label, color }) => (
            <RangeBar
              key={key}
              stats={budgetStats[key]}
              label={label}
              color={color}
              currentValue={memberBudget.budget[key]}
            />
          ))}
        </div>
      )}
    </div>
  );
};