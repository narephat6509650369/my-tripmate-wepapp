// src/pages/VotePage/components/StepBudget.tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { voteAPI } from '../../../services/tripService';
import { formatCurrency } from '../../../utils';
import type { TripDetail, } from '../../../types';

// ============== TYPES ==============
interface StepBudgetProps {
  trip: TripDetail;
  onSave: (category: string, amount: number) => void;
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
];

// ============== COMPONENT ==============
export const StepBudget: React.FC<StepBudgetProps> = ({ trip, onSave }) => {
  // ============== STATE ==============
  const [budget, setBudget] = useState<BudgetState>({
    accommodation: 0,
    transport: 0,
    food: 0,
    other: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
  if (!trip?.tripid) {
    console.log("Trip ID not ready yet");
    return; // ⛔ หยุดตรงนี้
  }

  console.log("tripId:", trip.tripid);

  voteAPI.getBudgetVoting(trip.tripid)
    .then((res) => {
      console.log('Budget Voting Response:', res);
      const data = res.data?.data;
      if (!data) return;

      const initialBudget: BudgetState = {
        accommodation: 0,
        transport: 0,
        food: 0,
        other: 0
      };

      data.budget_options.forEach((budgetUserVotes) => {
        initialBudget[budgetUserVotes.category_name] =
          budgetUserVotes.estimated_amount;
      });

      setBudget(initialBudget);
    })
    .catch((err) => {
      console.error('Load budget voting failed', err);
    });
}, [trip?.tripid]);


  const handleSaveCategory = async (category: keyof BudgetState) => {
    const amount = budget[category];
    
    if (amount < 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(category, amount);
    } finally {
      setIsSaving(false);
    }
  };

  // ============== HANDLERS ==============
  const handleBudgetChange = (key: keyof BudgetState, value: number) => {
    setBudget(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    const hasRequiredBudget = 
      budget.accommodation > 0 &&
      budget.transport > 0 &&
      budget.food > 0;
    
    if (!hasRequiredBudget) {
      alert('กรุณากรอกงบประมาณที่จำเป็น (ที่พัก, เดินทาง, อาหาร)');
      return;
    }

    setIsSaving(true);
    try {
      // Save ทีละ category
      for (const category of BUDGET_CATEGORIES) {
        if (budget[category.key] > 0) {
          await onSave(category.key, budget[category.key]);
        }
      }
      alert('✅ บันทึกงบประมาณทั้งหมดสำเร็จ');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const totalBudget = Object.values(budget).reduce((sum, val) => sum + val, 0);

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* แก้ไขงบประมาณ */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
          💰 แก้ไขงบประมาณ
        </h3>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse min-w-[500px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">
                  หมวดหมู่
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">
                  จำนวนเงิน (฿)
                </th>
                <th className="py-3 px-4 text-center font-semibold text-gray-700 w-24">
                  บันทึก
                </th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_CATEGORIES.map(({ key, label, color, required }) => (
                <tr key={key} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
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
                      value={budget[key] || ''}
                      placeholder="0"
                      className="w-full text-right border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onChange={e => handleBudgetChange(key, Number(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSaveCategory(key)}
                      disabled={isSaving || budget[key] === 0}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition"
                    >
                      บันทึก
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* รวมทั้งหมด */}
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
        disabled={isSaving || totalBudget === 0}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังบันทึก...
          </span>
        ) : (
          `บันทึกงบประมาณทั้งหมด (฿${formatCurrency(totalBudget)})`
        )}
      </button>

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
  );
};

export default StepBudget;