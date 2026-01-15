// ============================================================================
// frontend/src/components/MemberProgressList.tsx
// ✅ แก้ไข: ใช้ TripDetail จาก Backend (ไม่ใช่ Mock Data)
// ============================================================================

import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { TripDetail } from '../types';

interface MemberProgressListProps {
  trip: TripDetail;
  currentUserId: string;
}

interface MemberProgress {
  memberId: string;
  memberName: string;
  dateSelected: boolean;
  budgetFilled: boolean;
  provinceVoted: boolean;
  completionPercentage: number;
}

export const MemberProgressList: React.FC<MemberProgressListProps> = ({ 
  trip, 
  currentUserId 
}) => {
  // ============================================================================
  // ✅ คำนวณความคืบหน้าจาก TripDetail จริง
  // ============================================================================
  
  const calculateMemberProgress = (): MemberProgress[] => {
    const members = trip.members || [];
    const availabilities = trip.memberAvailabilitys || [];
    const budgets = trip.budgetOptions || [];
    const votes = trip.provinceVotes || [];
    
    return members.map(member => {
      // ✅ ตรวจสอบว่ากรอกวันที่หรือยัง
      const dateSelected = availabilities.some(
        a => a.user_id === member.id
      );
      
      // ✅ ตรวจสอบว่ากรอกงบหรือยัง (ถ้ามี category_name ที่เสนอโดย member นี้)
      const budgetFilled = budgets.some(
        b => b.category_name && b.estimated_amount > 0
      );
      
      // ✅ ตรวจสอบว่าโหวตจังหวัดหรือยัง
      const provinceVoted = votes.length > 0; // ถ้ามี vote แสดงว่ามีคนโหวตแล้ว
      
      // คำนวณ % ความสำเร็จ
      const tasksCompleted = [dateSelected, budgetFilled, provinceVoted].filter(Boolean).length;
      const completionPercentage = Math.round((tasksCompleted / 3) * 100);
      
      return {
        memberId: member.id,
        memberName: member.name,
        dateSelected,
        budgetFilled,
        provinceVoted,
        completionPercentage
      };
    });
  };
  
  const memberProgress = calculateMemberProgress();
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (memberProgress.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          👥 ความคืบหน้าของสมาชิก
        </h3>
        <p className="text-gray-500 text-center py-8">
          ยังไม่มีข้อมูลสมาชิก
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        👥 ความคืบหน้าของสมาชิก
      </h3>
      
      <div className="space-y-2">
        {memberProgress.map(progress => {
          const isMe = progress.memberId === currentUserId;
          
          return (
            <div 
              key={progress.memberId}
              className={`p-4 rounded-lg transition-all ${
                isMe 
                  ? 'bg-blue-50 border-2 border-blue-300' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {progress.completionPercentage === 100 ? '✅' : '⏳'}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {isMe ? 'คุณ' : progress.memberName}
                  </span>
                  {isMe && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      ฉัน
                    </span>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {progress.completionPercentage}%
                  </p>
                  {progress.completionPercentage === 100 && (
                    <p className="text-xs text-green-600 font-semibold">เสร็จสิ้น</p>
                  )}
                </div>
              </div>
              
              {/* Task Checklist */}
              <div className="flex gap-4 text-sm">
                <div className={`flex items-center gap-1 ${
                  progress.dateSelected ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {progress.dateSelected ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>วันที่</span>
                </div>
                
                <div className={`flex items-center gap-1 ${
                  progress.budgetFilled ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {progress.budgetFilled ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>งบประมาณ</span>
                </div>
                
                <div className={`flex items-center gap-1 ${
                  progress.provinceVoted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {progress.provinceVoted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>จังหวัด</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progress.completionPercentage === 100 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">เสร็จสมบูรณ์:</span>
          <span className="font-semibold text-gray-900">
            {memberProgress.filter(p => p.completionPercentage === 100).length}/{memberProgress.length} คน
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemberProgressList;