import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';
import { tripAPI } from '../../../services/api';
import { CONFIG } from '../../../config/app.config';
import { formatCurrency } from '../../../utils/helpers';
import { TripData, Member, BudgetPriority } from '../../../data/mockData';

// ============== TYPES ==============
interface StepBudgetProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  setMemberBudget: React.Dispatch<React.SetStateAction<Member | null>>;
  tripCode: string;
  budgetStats: Record<string, BudgetStats>;
  totalBudget: number;
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

const MAX_TOTAL_BUDGET = 1000000;
const MAX_PER_CATEGORY = 100000;
const EDIT_COOLDOWN_MS = 0;

// ============== RANGE BAR COMPONENT ==============
interface RangeBarProps {
  stats: BudgetStats;
  label: string;
  color?: string;
  currentValue?: number;
}

const RangeBar: React.FC<RangeBarProps> = ({ 
  stats, 
  label, 
  color = "#3b82f6",
  currentValue 
}) => {
  if (stats.count === 0) {
    return (
      <div className="py-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
        ไม่มีข้อมูลสำหรับ {label}
      </div>
    );
  }

  const widthPx = 400;
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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={widthPx} height={60} className="mx-auto">
          <line 
            x1={xMin} x2={xMax} y1={30} y2={30} 
            stroke="#e0e7ff" strokeWidth={8} strokeLinecap="round"
          />
          <rect 
            x={xQ1} y={15} 
            width={Math.max(1, xQ3 - xQ1)} height={30} 
            fill={color} fillOpacity={0.2} rx={6}
          />
          <line 
            x1={xMed} x2={xMed} y1={10} y2={50} 
            stroke={color} strokeWidth={3}
          />
          {xCurrent !== null && (
            <circle 
              cx={xCurrent} cy={30} r={6} 
              fill="#ef4444" stroke="white" strokeWidth={2}
            />
          )}
          <circle cx={xMin} cy={30} r={4} fill={color} />
          <circle cx={xMax} cy={30} r={4} fill={color} />
          <text 
            x={xMed} 
            y={8} 
            textAnchor="middle" 
            className="text-xs font-semibold"
            fill={color}
          >
            ฿{formatCurrency(Math.round(stats.median))}
          </text>
        </svg>
      </div>
      
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>ต่ำสุด: ฿{formatCurrency(stats.min)}</span>
          <span>สูงสุด: ฿{formatCurrency(stats.max)}</span>
        </div>
        <div className="flex justify-between">
          <span>Q1-Q3: ฿{formatCurrency(Math.round(stats.q1))} - ฿{formatCurrency(Math.round(stats.q3))}</span>
          <span>เฉลี่ย: ฿{formatCurrency(Math.round(stats.avg))}</span>
        </div>
        {stats.outliers && stats.outliers > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-amber-600 font-medium">
              ⚠️ กรองค่าผิดปกติ {stats.outliers} ค่าออก
            </p>
          </div>
           )}
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
  onBudgetChange
}) => {
  // ============== GUARD CLAUSE ==============
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
  const [history, setHistory] = useState<string[]>([]);
  const [followMajority, setFollowMajority] = useState(false);

  // ============== REFS ==============
  const debouncedUpdateRef = useRef<ReturnType<typeof debounce>>();

  // ============== SYNC LOCAL BUDGET ==============
  useEffect(() => {
    const handleAutoSave = () => {
      console.log('📥 Received auto-save event for budget');
      saveBudget();
    };
    
    window.addEventListener('auto-save-budget', handleAutoSave);
    
    return () => {
      window.removeEventListener('auto-save-budget', handleAutoSave);
    };
  }, [localBudget]);

  // ============== UPDATE BUDGET FUNCTION ==============
  const saveBudget = async (): Promise<void> => {
    if (isSaving) {
      console.log('⏳ Already saving, skipping update');
      return;
    }
    
    console.log('💾 Starting save all budget:', localBudget);
    
    // Validation: ตัวเลขต้องถูกต้อง
    const hasValidBudget = 
      localBudget.accommodation > 0 &&
      localBudget.transport > 0 &&
      localBudget.food > 0;
    
    if (!hasValidBudget) {
      console.log('❌ Please fill all required fields');
      return;
    }

    const nowTs = Date.now();

    const newBudget = {
      ...localBudget,
      lastUpdated: nowTs
    };

    console.log('🔄 Budget to save:', JSON.stringify(newBudget, null, 2));

    // Optimistic update
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
        setHistory(prev => [
          `${memberBudget.name} บันทึกงบประมาณ: ที่พัก ฿${formatCurrency(newBudget.accommodation)}, เดินทาง ฿${formatCurrency(newBudget.transport)}, อาหาร ฿${formatCurrency(newBudget.food)}, สำรอง ฿${formatCurrency(newBudget.other)} เวลา ${new Date().toLocaleTimeString("th-TH")}`,
          ...prev
        ]);
        console.log('✅ Budget saved successfully:', newBudget);
      } else {
        throw new Error(response.message || 'ไม่สามารถบันทึกได้');
      }

    } catch (err) {
      console.error("❌ Error saving budget:", err);
      
      // Rollback
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
    console.log(`📝 Input changed: ${key} = ${value}`);
    
    // อัปเดต local state ทันที (responsive UI)
    const newBudget = { ...localBudget, [key]: value };
    setLocalBudget(newBudget);
    
    // ✅ ส่งกลับไปที่ parent ทันที
    if (onBudgetChange) {
      onBudgetChange(newBudget);
    }
  };

  // ============== UPDATE PRIORITY ==============
  const updatePriority = async (
    category: keyof typeof priorities,
    value: BudgetPriority
  ) => {
    const newPriorities = { ...priorities, [category]: value };
    setPriorities(newPriorities);

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.updateBudgetPriority?.(tripCode, memberBudget.id, newPriorities);
      }

      setMemberBudget(prev => prev ? {
        ...prev,
        budgetPriorities: newPriorities
      } : null);

      setTrip(prev => ({
        ...prev,
        members: prev.members?.map(m =>
          m.id === memberBudget.id ? { ...m, budgetPriorities: newPriorities } : m
        ) || []
      }));
    } catch (error) {
      // alert("เกิดข้อผิดพลาดในการบันทึก Priority");
      setPriorities(memberBudget.budgetPriorities || priorities);
    }
  };

  // ============== HELPER FUNCTIONS ==============
  const getPriorityLabel = (priority: BudgetPriority): string => {
    switch (priority) {
      case 1: return "⭐⭐⭐ สำคัญมาก";
      case 2: return "⭐⭐ สำคัญปานกลาง";
      case 3: return "⭐ สำคัญน้อย";
    }
  };

  const getPriorityColor = (priority: BudgetPriority): string => {
    switch (priority) {
      case 1: return "bg-red-100 text-red-700 border-red-300";
      case 2: return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case 3: return "bg-green-100 text-green-700 border-green-300";
    }
  };

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ============ แก้ไขงบประมาณ ============ */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💰 แก้ไขงบประมาณ</h3>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">
                  หมวดหมู่ (* บังคับ)
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">
                  จำนวนเงิน (บาท)
                </th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_CATEGORIES.map(({ key, label, color }) => (
                <tr 
                  key={key} 
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-gray-800">{label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      disabled={isSaving}
                      min={0}
                      step={100}
                      value={localBudget[key]}
                      className="w-full text-right border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onChange={e => handleBudgetChange(key, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                <td className="px-4 py-3 text-gray-800">รวมทั้งหมด</td>
                <td className="px-4 py-3 text-right text-blue-700 text-lg">
                  {/* ✅ คำนวณจาก localBudget แทน */}
                  ฿{formatCurrency(
                    localBudget.accommodation + 
                    localBudget.transport + 
                    localBudget.food + 
                    localBudget.other
                  )}
                </td>
              </tr>
            </tbody>
          </table>
      </div>
      
      {/* ✅ เพิ่มปุ่มบันทึก */}
      {/* <button
        onClick={saveBudget}
        disabled={isSaving || (
          localBudget.accommodation <= 0 ||
          localBudget.transport <= 0 ||
          localBudget.food <= 0
        )}
        className={`
          w-full mt-4 px-6 py-3 font-bold rounded-lg transition shadow-lg
          ${isSaving || (
            localBudget.accommodation <= 0 ||
            localBudget.transport <= 0 ||
            localBudget.food <= 0
          )
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
          }
        `}
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังบันทึก...
          </span>
        ) : (
          '💾 บันทึกงบประมาณ'
        )}
      </button> */}
      
      {isSaving && (
        <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">กำลังบันทึก...</span>
        </div>
      )}
    </div>

      {/* ✅ เพิ่มส่วนนี้ */}
      {/* Follow Majority Option */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6">
        <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={followMajority}
              onChange={(e) => {
                const checked = e.target.checked;
                setFollowMajority(checked);
                
                if (checked) {
                  // Calculate average budget from other members
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
                    
                    // ✅ ส่งไปที่ parent
                    if (onBudgetChange) {
                      onBudgetChange(avgBudget);
                    }
                  } else {
                    console.log('ยังไม่มีเพื่อนคนไหนกรอกงบประมาณ');
                    setFollowMajority(false);
                  }
                }
              }}
              className="mt-1 w-5 h-5 text-purple-600"
            />
            <div>
              <p className="font-semibold text-purple-900">
                ✨ ใช้งบเฉลี่ยของกลุ่ม
              </p>
              <p className="text-sm text-purple-700 mt-1">
                ระบบจะคำนวณงบเฉลี่ยจากเพื่อนที่กรอกไปแล้วให้อัตโนมัติ 
                (คุณยังสามารถแก้ไขได้ทีหลัง)
              </p>
              {followMajority && (
                <div className="mt-2 p-2 bg-white rounded text-xs text-purple-600">
                  💡 ระบบกำลังใช้งบเฉลี่ยของกลุ่ม แต่คุณยังแก้ไขได้ตลอดเวลา
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* ============ Priority Voting ============ */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          ⭐ ระดับความสำคัญของงบประมาณ
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm text-blue-800">
            💡 <strong>คำแนะนำ:</strong> เลือกว่าคุณต้องการให้งบประมาณรวมของกลุ่ม
            จัดสรรไปที่หมวดไหนมากที่สุด
          </p>
        </div>

        <div className="space-y-4">
          {(['accommodation', 'transport', 'food'] as const).map((key) => {
            const category = BUDGET_CATEGORIES.find(c => c.key === key);
            if (!category) return null;

            return (
              <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-semibold text-gray-800">
                      {category.label}
                    </span>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getPriorityColor(priorities[key])}`}>
                    {getPriorityLabel(priorities[key])}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => updatePriority(key, priority as BudgetPriority)}
                      className={`py-2 px-3 rounded-lg font-medium transition-all ${
                        priorities[key] === priority
                          ? getPriorityColor(priority as BudgetPriority) + " border-2"
                          : "bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {getPriorityLabel(priority as BudgetPriority)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ การกระจายงบประมาณ ============ */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 การกระจายงบประมาณของสมาชิกทั้งหมด
        </h3>
        
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>จุดสีแดง = งบของเรา</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-5 h-[3px] bg-blue-500"></span>
            <span>เส้นสีน้ำเงิน = ค่ากลาง (Median)</span>
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

      {/* ============ ประวัติการแก้ไข ============ */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📝 ประวัติการแก้ไข</h3>
        <div className="bg-gray-50 p-4 rounded-lg h-48 overflow-y-auto border border-gray-200">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มีประวัติการแก้ไข</p>
          ) : (
            <ul className="text-sm space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

