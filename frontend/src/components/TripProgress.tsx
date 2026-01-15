// ============================================================================
// frontend/src/components/TripProgress.tsx
// ✅ แก้ไข: ใช้ TripDetail จาก Backend (ไม่ใช่ Mock Data)
// ============================================================================

import React from 'react';
import { Users, Check, Clock } from 'lucide-react';
import type { TripDetail } from '../types';

interface TripProgressProps {
  trip: TripDetail;
  currentUserId: string;
}

export const TripProgress: React.FC<TripProgressProps> = ({ 
  trip, 
  currentUserId 
}) => {
  // ============================================================================
  // ✅ คำนวณความคืบหน้าจาก TripDetail จริง
  // ============================================================================
  
  const members = trip.members || [];
  const totalMembers = members.length;
  
  if (totalMembers === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">
          ⏳ รอสมาชิก...
        </h3>
        <p className="text-gray-500 mt-2">
          ยังไม่มีสมาชิกในทริปนี้
        </p>
      </div>
    );
  }
  
  const availabilities = trip.memberAvailabilitys || [];
  const budgets = trip.budgetOptions || [];
  const provinceVotes = trip.provinceVotes || [];

  // คำนวณความคืบหน้าแต่ละหมวด
  const progress = {
    budget: {
      completed: budgets.length > 0 ? totalMembers : 0, // ถ้ามี budget แสดงว่ามีคนกรอกแล้ว
      percentage: budgets.length > 0 ? 100 : 0
    },
    dateVote: {
      completed: availabilities.length,
      percentage: totalMembers > 0 
        ? Math.round((availabilities.length / totalMembers) * 100)
        : 0
    },
    provinceVote: {
      completed: provinceVotes.length > 0 ? totalMembers : 0,
      percentage: provinceVotes.length > 0 ? 100 : 0
    }
  };

  // คำนวณความคืบหน้ารวม
  const overallProgress = Math.round(
    (progress.budget.percentage + 
     progress.dateVote.percentage + 
     progress.provinceVote.percentage) / 3
  );

  // ✅ ความคืบหน้าของตัวเอง
  const myProgress = {
    budget: budgets.length > 0, // ถ้ามี budget แสดงว่ากรอกแล้ว
    dateVote: availabilities.some(a => a.user_id === currentUserId),
    provinceVote: provinceVotes.length > 0 // ถ้ามีคะแนนโหวตแสดงว่าโหวตแล้ว
  };

  const myTasksComplete = Object.values(myProgress).filter(Boolean).length;
  const myTotalTasks = Object.keys(myProgress).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          ความคืบหน้าของทริป
        </h3>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{overallProgress}%</div>
          <div className="text-xs text-gray-500">เสร็จสมบูรณ์</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* My Progress */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900">✏️ งานของคุณ</h4>
          <span className="text-sm text-blue-700 font-medium">
            {myTasksComplete}/{myTotalTasks} งาน
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className={`flex items-center gap-2 ${myProgress.budget ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.budget ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>งบประมาณ</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.dateVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.dateVote ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>วันที่</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.provinceVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.provinceVote ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>จังหวัด</span>
          </div>
        </div>
      </div>

      {/* Category Progress */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-2">📊 ความคืบหน้ารายหมวด</h4>

        {/* Budget */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">💰 งบประมาณ</span>
            <span className="text-sm font-semibold text-gray-800">
              {progress.budget.completed}/{totalMembers} คน ({progress.budget.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress.budget.percentage}%` }}
            />
          </div>
        </div>

        {/* Date Vote */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">📅 เลือกวันที่</span>
            <span className="text-sm font-semibold text-gray-800">
              {progress.dateVote.completed}/{totalMembers} คน ({progress.dateVote.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress.dateVote.percentage}%` }}
            />
          </div>
        </div>

        {/* Province Vote */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">🗺️ โหวตจังหวัด</span>
            <span className="text-sm font-semibold text-gray-800">
              {progress.provinceVote.completed}/{totalMembers} คน ({progress.provinceVote.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress.provinceVote.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Complete Message */}
      {overallProgress === 100 && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <Check className="w-5 h-5" />
            ทุกคนกรอกข้อมูลครบแล้ว! พร้อมปิดการโหวต
          </p>
        </div>
      )}
      
      {/* Progress Message */}
      {overallProgress < 100 && overallProgress >= 50 && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-blue-800 font-semibold flex items-center gap-2">
            🎯 เกือบเสร็จแล้ว! อีก {100 - overallProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default TripProgress;