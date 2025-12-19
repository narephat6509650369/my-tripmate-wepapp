import React from 'react';
import { Check, Loader2, Users } from 'lucide-react';

// ✅ Import types จาก mockData
import type { TripData } from '../data/mockData';

interface TripProgressProps {
  trip: TripData;
  currentMemberId: string;
}

const TripProgress: React.FC<TripProgressProps> = ({ trip, currentMemberId }) => {
  const members = trip.members || [];
  const totalMembers = members.length;

  // คำนวณความคืบหน้า
  const progress = {
    budget: {
      completed: members.filter(m => 
        m.budget.accommodation > 0 && 
        m.budget.transport > 0 && 
        m.budget.food > 0
      ).length,
      percentage: 0
    },
    dateVote: {
      completed: trip.dateVotes?.length || 0,
      percentage: 0
    },
    provinceVote: {
      completed: trip.provinceVotes?.length || 0,
      percentage: 0
    },
    priority: {
      completed: members.filter(m => m.budgetPriorities).length,
      percentage: 0
    }
  };

  // คำนวณ percentage
  Object.keys(progress).forEach(key => {
    const item = progress[key as keyof typeof progress];
    item.percentage = totalMembers > 0 ? Math.round((item.completed / totalMembers) * 100) : 0;
  });

  // คำนวณ overall progress
  const overallProgress = Math.round(
    (progress.budget.percentage + 
     progress.dateVote.percentage + 
     progress.provinceVote.percentage + 
     progress.priority.percentage) / 4
  );

  // ตรวจสอบว่าตัวเองทำครบหรือยัง
  const currentMember = members.find(m => m.id === currentMemberId);
  const myProgress = {
    budget: currentMember && 
      currentMember.budget.accommodation > 0 && 
      currentMember.budget.transport > 0 && 
      currentMember.budget.food > 0,
    dateVote: trip.dateVotes?.some(v => v.memberId === currentMemberId),
    provinceVote: trip.provinceVotes?.some(v => v.memberId === currentMemberId),
    priority: currentMember?.budgetPriorities !== undefined
  };

  const myTasksComplete = Object.values(myProgress).filter(Boolean).length;
  const myTotalTasks = Object.keys(myProgress).length;

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

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900">✏️ งานของคุณ</h4>
          <span className="text-sm text-blue-700 font-medium">
            {myTasksComplete}/{myTotalTasks} งาน
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={`flex items-center gap-2 ${myProgress.budget ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.budget ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            <span>กรอกงบประมาณ</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.priority ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.priority ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            <span>เลือก Priority</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.dateVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.dateVote ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            <span>โหวตวันที่</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.provinceVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.provinceVote ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            <span>โหวตจังหวัด</span>
          </div>
        </div>
      </div>

      {/* Detailed Progress */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-2">📊 ความคืบหน้ารายหมวด</h4>

        {/* งบประมาณ */}
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

        {/* Priority */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">⭐ Priority Voting</span>
            <span className="text-sm font-semibold text-gray-800">
              {progress.priority.completed}/{totalMembers} คน ({progress.priority.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress.priority.percentage}%` }}
            />
          </div>
        </div>

        {/* วันที่ */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-700">📅 โหวตวันที่</span>
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

        {/* จังหวัด */}
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

      {/* All Complete Message */}
      {overallProgress === 100 && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <Check className="w-5 h-5" />
            ทุกคนกรอกข้อมูลครบแล้ว! พร้อมปิดการโหวต
          </p>
        </div>
      )}
    </div>
  );
};

export default TripProgress;