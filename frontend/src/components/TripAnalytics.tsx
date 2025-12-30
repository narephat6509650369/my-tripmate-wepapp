import React from 'react';
import { TripData } from '../data/mockData';
import { calculateTripStatistics, formatDuration } from '../utils/analytics';
import { BarChart3, Clock, Users, TrendingUp } from 'lucide-react';

interface TripAnalyticsProps {
  trip: TripData;
}

export const TripAnalytics: React.FC<TripAnalyticsProps> = ({ trip }) => {
  const stats = calculateTripStatistics(trip);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-800">📊 สถิติทริปนี้</h3>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Time Used */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">เวลาที่ใช้</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {formatDuration(stats.totalDuration || 0)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            เฉลี่ย {stats.averageTimeToComplete} นาที/คน
          </p>
        </div>
        
        {/* Participation */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">การมีส่วนร่วม</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {stats.overallCompletionRate}%
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.totalMembers} สมาชิก
          </p>
        </div>
        
        {/* Date Voting */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📅</span>
            <span className="text-sm font-semibold text-purple-900">เลือกวันที่</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {stats.membersVotedDates}/{stats.totalMembers}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {stats.dateVotingRate}% เสร็จสิ้น
          </p>
        </div>
        
        {/* Budget */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <span className="text-sm font-semibold text-amber-900">งบประมาณ</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {stats.membersCompletedBudget}/{stats.totalMembers}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {stats.budgetCompletionRate}% เสร็จสิ้น
          </p>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">📅 เลือกวันที่ว่าง</span>
            <span className="font-semibold text-purple-600">{stats.dateVotingRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.dateVotingRate}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">💰 กรอกงบประมาณ</span>
            <span className="font-semibold text-green-600">{stats.budgetCompletionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.budgetCompletionRate}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">🗺️ โหวตจังหวัด</span>
            <span className="font-semibold text-blue-600">{stats.provinceVotingRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.provinceVotingRate}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Time Saved (if available) */}
      {stats.timeSavedPercentage && stats.timeSavedPercentage > 0 && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="flex-1">
              <p className="font-bold text-green-900 text-lg mb-1">
                🎉 ประหยัดเวลาได้ {stats.timeSavedPercentage}%!
              </p>
              <p className="text-sm text-green-700">
                คาดว่าถ้าใช้วิธีเดิม: {formatDuration(stats.estimatedTimeWithoutSystem || 0)}
                {' '}→ ใช้จริง: {formatDuration(stats.totalDuration || 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                ประหยัดได้ {formatDuration(stats.actualTimeSaved || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Motivation Message */}
      {stats.overallCompletionRate < 100 && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-amber-900 font-semibold mb-1">
            {stats.overallCompletionRate >= 75 
              ? '🎯 เกือบเสร็จแล้ว! อีกนิดเดียว!' 
              : '⏰ ยังมีข้อมูลที่ต้องกรอก'}
          </p>
          <p className="text-sm text-amber-800">
            {stats.overallCompletionRate >= 75
              ? 'ทริปนี้กำลังจะเสร็จสมบูรณ์ ช่วยกันกรอกให้ครบนะ!'
              : 'อย่าลืมกรอกข้อมูลให้ครบทุก step เพื่อให้ระบบคำนวณผลได้ถูกต้อง'}
          </p>
        </div>
      )}
    </div>
  );
};