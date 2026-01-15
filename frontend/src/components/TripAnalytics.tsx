// ============================================================================
// frontend/src/components/TripAnalytics.tsx
// ✅ แก้ไข: ใช้ TripDetail จาก Backend (ไม่ใช่ Mock Data)
// ============================================================================

import React from 'react';
import { BarChart3, Clock, Users, TrendingUp } from 'lucide-react';
import type { TripDetail } from '../types';

interface TripAnalyticsProps {
  trip: TripDetail;
}

interface TripStatistics {
  totalMembers: number;
  membersVotedDates: number;
  membersCompletedBudget: number;
  membersVotedProvinces: number;
  dateVotingRate: number;
  budgetCompletionRate: number;
  provinceVotingRate: number;
  overallCompletionRate: number;
}

export const TripAnalytics: React.FC<TripAnalyticsProps> = ({ trip }) => {
  // ============================================================================
  // ✅ คำนวณสถิติจาก TripDetail จริง
  // ============================================================================
  
  const calculateStatistics = (): TripStatistics => {
    const members = trip.members || [];
    const totalMembers = members.length;
    
    if (totalMembers === 0) {
      return {
        totalMembers: 0,
        membersVotedDates: 0,
        membersCompletedBudget: 0,
        membersVotedProvinces: 0,
        dateVotingRate: 0,
        budgetCompletionRate: 0,
        provinceVotingRate: 0,
        overallCompletionRate: 0
      };
    }
    
    const availabilities = trip.memberAvailabilitys || [];
    const budgets = trip.budgetOptions || [];
    const provinceVotes = trip.provinceVotes || [];
    
    // นับจำนวนคนที่กรอกแต่ละหมวด
    const membersVotedDates = availabilities.length;
    const membersCompletedBudget = budgets.length > 0 ? totalMembers : 0; // สมมติถ้ามี budget แสดงว่าทุกคนกรอกแล้ว
    const membersVotedProvinces = provinceVotes.length > 0 ? totalMembers : 0;
    
    // คำนวณ % ความสำเร็จ
    const dateVotingRate = Math.round((membersVotedDates / totalMembers) * 100);
    const budgetCompletionRate = Math.round((membersCompletedBudget / totalMembers) * 100);
    const provinceVotingRate = Math.round((membersVotedProvinces / totalMembers) * 100);
    
    // ความสำเร็จรวม
    const overallCompletionRate = Math.round(
      (dateVotingRate + budgetCompletionRate + provinceVotingRate) / 3
    );
    
    return {
      totalMembers,
      membersVotedDates,
      membersCompletedBudget,
      membersVotedProvinces,
      dateVotingRate,
      budgetCompletionRate,
      provinceVotingRate,
      overallCompletionRate
    };
  };
  
  const stats = calculateStatistics();
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-800">📊 สถิติทริปนี้</h3>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Members */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">สมาชิก</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {stats.totalMembers} คน
          </p>
          <p className="text-xs text-blue-600 mt-1">
            ในทริปนี้
          </p>
        </div>
        
        {/* Overall Progress */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">ความสำเร็จ</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {stats.overallCompletionRate}%
          </p>
          <p className="text-xs text-green-600 mt-1">
            เสร็จสมบูรณ์
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
      
      {/* Success Message */}
      {stats.overallCompletionRate === 100 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-green-900 font-semibold mb-1">
            🎉 ทุกคนกรอกข้อมูลครบแล้ว!
          </p>
          <p className="text-sm text-green-800">
            ทริปนี้พร้อมปิดการโหวตและสรุปผลแล้ว
          </p>
        </div>
      )}
    </div>
  );
};

export default TripAnalytics;