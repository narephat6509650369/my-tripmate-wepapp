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
const EDIT_COOLDOWN_MS = 2 * 60 * 1000;

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
  totalBudget
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

  // ============== REFS ==============
  const debouncedUpdateRef = useRef<ReturnType<typeof debounce>>();

  // ============== SYNC LOCAL BUDGET ==============
  useEffect(() => {
    setLocalBudget(memberBudget.budget);
  }, [memberBudget.budget]);

  // ============== SETUP DEBOUNCE ==============
  useEffect(() => {
    debouncedUpdateRef.current = debounce(
      (key: keyof Member["budget"], value: number) => {
        updateBudget(key, value);
      }, 
      1000
    );
    
    return () => {
      debouncedUpdateRef.current?.cancel();
    };
  }, [tripCode]);

  // ============== UPDATE BUDGET FUNCTION ==============
  const updateBudget = async (
    key: keyof Member["budget"], 
    value: number
  ): Promise<void> => {
    // Validation: ตัวเลขต้องถูกต้อง
    if (isNaN(value) || value < 0) {
      alert("กรุณากรอกตัวเลขที่ถูกต้องและไม่ติดลบ");
      return;
    }

    // Validation: หมวดบังคับต้องมากกว่า 0
    const requiredCategories = ["accommodation", "transport", "food"];
    if (requiredCategories.includes(key) && value <= 0) {
      alert(`${BUDGET_CATEGORIES.find(c => c.key === key)?.label} ต้องมากกว่า 0 บาท`);
      return;
    }

    // Validation: ไม่เกินวงเงินต่อหมวด
    if (value > MAX_PER_CATEGORY) {
      alert(`จำนวนเงินต่อหมวดไม่ควรเกิน ฿${formatCurrency(MAX_PER_CATEGORY)}`);
      return;
    }

    // คำนวณงบประมาณรวมใหม่
    const currentBudget = { ...memberBudget.budget };
    const newTotal = Object.keys(currentBudget).reduce((sum, k) => {
      if (k === 'lastUpdated') return sum;
      return sum + (k === key ? value : currentBudget[k as keyof typeof currentBudget] as number);
    }, 0);

    // Validation: ไม่เกินวงเงินรวม
    if (newTotal > MAX_TOTAL_BUDGET) {
      alert(`งบประมาณรวมต้องไม่เกิน ฿${formatCurrency(MAX_TOTAL_BUDGET)}`);
      return;
    }

    // Cooldown check
    const nowTs = Date.now();
    const lastUpdated = memberBudget.budget.lastUpdated ?? 0;
    const timeSinceLastUpdate = nowTs - lastUpdated;

    if (lastUpdated > 0 && timeSinceLastUpdate < EDIT_COOLDOWN_MS) {
      const minutesLeft = Math.ceil((EDIT_COOLDOWN_MS - timeSinceLastUpdate) / 60000);
      alert(`กรุณารออีก ${minutesLeft} นาทีก่อนแก้ไขอีกครั้ง`);
      return;
    }

    // เก็บค่าเดิมสำหรับ rollback
    const oldValue = memberBudget.budget[key];
    const oldLastUpdated = memberBudget.budget.lastUpdated;

    // Optimistic update
    const updatedMember = {
      ...memberBudget,
      budget: {
        ...memberBudget.budget,
        [key]: value,
        lastUpdated: nowTs
      }
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
        response = await tripAPI.updateMemberBudget(tripCode, memberBudget.id, {
          [key]: value
        });
      }

      if (response.success) {
        const categoryLabel = BUDGET_CATEGORIES.find(c => c.key === key)?.label || key;
        setHistory(prev => [
          `${memberBudget.name} แก้ไข${categoryLabel}เป็น ฿${formatCurrency(value)} เวลา ${new Date().toLocaleTimeString("th-TH")}`,
          ...prev
        ]);
      } else {
        throw new Error(response.message || 'ไม่สามารถบันทึกได้');
      }

    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกงบประมาณ กลับไปใช้ค่าเดิม");
      
      // Rollback
      const rolledBackMember = {
        ...memberBudget,
        budget: {
          ...memberBudget.budget,
          [key]: oldValue,
          lastUpdated: oldLastUpdated
        }
      };

      setMemberBudget(rolledBackMember);

      setTrip(prev => ({
        ...prev,
        members: prev.members?.map(m =>
          m.id === memberBudget.id ? rolledBackMember : m
        ) || []
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // ============== HANDLE INPUT CHANGE ==============
  const handleBudgetChange = (key: keyof Member["budget"], value: number) => {
    // อัปเดต local state ทันที (responsive UI)
    setLocalBudget(prev => ({ ...prev, [key]: value }));
    
    // เรียก API หลังจากหยุดพิมพ์ 1 วินาที
    debouncedUpdateRef.current?.(key, value);
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
      alert("เกิดข้อผิดพลาดในการบันทึก Priority");
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
                  ฿{formatCurrency(totalBudget)}
                </td>
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

