// ============================================================================
// src/pages/VotePage.tsx
// ✅ แก้ไข: แก้ getHeatmap error
// ============================================================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy } from "lucide-react";

// Components
import Header from "../components/Header";
import Toast from "../components/Toast";
import StepVote from "./VotePage/components/StepVote";
import StepBudget from "./VotePage/components/StepBudget";
import StepPlace from "./VotePage/components/StepPlace";
import StepSummary from "./VotePage/components/StepSummary";
import OwnerControls from "./VotePage/components/OwnerControls";
import MemberControls from "./VotePage/components/MemberControls";

// Hooks & Utils
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, voteAPI } from '../services/tripService';
import type { TripDetail, DateRange, HeatmapData } from '../types';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // ============================================================================
  // STATE
  // ============================================================================

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayCode = inviteCode || tripCode;

  // ============================================================================
  // ✅ LOAD TRIP DATA
  // ============================================================================

  useEffect(() => {
    const loadTripData = async () => {
      if (tripCode === "UNKNOWN") {
        setError("ไม่พบรหัสทริป");
        setTimeout(() => navigate("/homepage"), 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading trip:', tripCode);
        
        const response = await tripAPI.getTripDetail(tripCode);
        console.log("Trip detail response:", response);
        if (!response || !response.success || !response.data) {
          throw new Error(response?.message || 'ไม่พบข้อมูลทริป');
        }

        const tripData = response.data;
        
        setInviteCode(tripData.invite_code);
        setTrip(tripData);
        
        console.log('✅ Trip loaded:', {
          trip_id: tripData.trip_id,
          trip_name: tripData.trip_name,
          invite_code: tripData.invite_code
        });
        
      } catch (error: any) {
        console.error("❌ Error loading trip:", error);
        setError(error.message || "ไม่สามารถโหลดข้อมูลทริปได้");
        setTimeout(() => navigate("/homepage"), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    loadTripData();
  }, [tripCode, navigate]);

  // ============================================================================
  // ✅ LOAD HEATMAP DATA (แก้ไข)
  // ============================================================================

  useEffect(() => {
    const loadHeatmap = async () => {
      if (!trip?.tripid) {
        console.log('⏭️ Skip heatmap: no trip_id yet');
        return;
      }
      
      try {
        console.log('🔥 Loading heatmap for trip:', trip.tripid);
        
        // ✅ แก้ไข: เรียก getTripHeatmap แทน getHeatmap
        const response = await voteAPI.getTripHeatmap(trip.tripid);
        
        if (response.success && response.data) {
          setHeatmapData(response.data);
          console.log('✅ Heatmap loaded:', response.data);
        } else {
          console.warn('⚠️ Heatmap not available:', response.message);
        }
      } catch (error: any) {
        // ✅ ไม่แสดง error เพราะไม่ critical
        console.warn('⚠️ Failed to load heatmap:', error.message);
        // Heatmap เป็น optional feature
      }
    };
    
    loadHeatmap();
  }, [trip?.trip_id]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    logout();
  };

  // ============================================================================
  // ✅ SAVE DATES
  // ============================================================================

  const handleSaveDates = async (ranges: DateRange[]) => {
    if (!trip) {
      setToast({ message: 'ไม่พบข้อมูลทริป', type: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('💾 Saving dates:', ranges);
      
      const response = await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        ranges
      });
      
      if (response.success) {
        setToast({ message: 'บันทึกวันที่สำเร็จ ✅', type: 'success' });
        
        // ✅ Reload trip data
        const updatedTrip = await tripAPI.getTripDetail(tripCode);
        if (updatedTrip.success && updatedTrip.data) {
          setTrip(updatedTrip.data);
        }
        
        // ✅ Reload heatmap
        try {
          const updatedHeatmap = await voteAPI.getTripHeatmap(trip.trip_id);
          if (updatedHeatmap.success && updatedHeatmap.data) {
            setHeatmapData(updatedHeatmap.data);
          }
        } catch (heatmapError) {
          console.warn('⚠️ Failed to reload heatmap:', heatmapError);
        }
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      console.error('❌ Error saving dates:', error);
      setToast({ 
        message: error.message || 'เกิดข้อผิดพลาด ❌', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // ✅ SAVE BUDGET
  // ============================================================================

  const handleSaveBudget = async (category: string, amount: number) => {
    if (!trip) {
      setToast({ message: 'ไม่พบข้อมูลทริป', type: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
<<<<<<< HEAD
      const response = await voteAPI.updateBudget(trip.invitecode, {
        category: category as any,
=======
      console.log('💾 Saving budget:', { category, amount });
      
      const response = await voteAPI.updateBudget(trip.invite_code, {
        category,
>>>>>>> 59dcfd2d1d16c01491237a32cdfa0ce1fc61ca1d
        amount
      });
      
      if (response.success) {
        setToast({ message: 'บันทึกงบประมาณสำเร็จ ✅', type: 'success' });
        
        // ✅ Reload trip data
        const updatedTrip = await tripAPI.getTripDetail(tripCode);
        if (updatedTrip.success && updatedTrip.data) {
          setTrip(updatedTrip.data);
        }
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      console.error('❌ Error saving budget:', error);
      setToast({ 
        message: error.message || 'เกิดข้อผิดพลาด ❌', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // ✅ VOTE LOCATION
  // ============================================================================

  const handleVoteLocation = async (votes: [string, string, string]) => {
    if (!trip) {
      setToast({ message: 'ไม่พบข้อมูลทริป', type: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
<<<<<<< HEAD
      const response = await voteAPI.submitLocationVote(trip.invitecode, { votes });
=======
      console.log('💾 Voting location:', votes);
      
      const response = await voteAPI.submitLocationVote(trip.invite_code, { votes });
>>>>>>> 59dcfd2d1d16c01491237a32cdfa0ce1fc61ca1d
      
      if (response.success) {
        setToast({ message: 'โหวตสำเร็จ ✅', type: 'success' });
        
        // ✅ Reload trip data
        const updatedTrip = await tripAPI.getTripDetail(tripCode);
        if (updatedTrip.success && updatedTrip.data) {
          setTrip(updatedTrip.data);
        }
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      console.error('❌ Error voting location:', error);
      setToast({ 
        message: error.message || 'เกิดข้อผิดพลาด ❌', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const back = () => { 
    if (step > 2) setStep(step - 1); 
  };

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลทริป...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-xl text-gray-700 mb-4">{error || 'ไม่พบข้อมูลทริป'}</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            ← กลับไปหน้าหลัก
          </button>
          
          <div className="flex items-center gap-3">
            {/* ปุ่มคัดลอกรหัส */}
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all font-mono text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied === 'code' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(displayCode, 'code')}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
            >
              <span className="truncate max-w-[80px] sm:max-w-none">{displayCode}</span>
              <Copy className="w-4 h-4" />
            </button>

            {/* ปุ่มแชร์ลิงก์ */}
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied === 'link' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(window.location.href, 'link')}
              title="แชร์ลิงก์ทริป"
            >
              <span className="hidden sm:inline">แชร์ลิงก์</span>
              <span className="sm:hidden">แชร์</span>
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner/Member Controls */}
        <OwnerControls trip={trip} />
        <MemberControls trip={trip} />

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 sm:h-1 bg-gray-200 rounded-full" />
            <div 
              className="absolute top-5 sm:top-6 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
            
            <div className="relative flex justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 
                      flex items-center justify-center 
                      rounded-full border-2 sm:border-4 
                      font-bold text-sm sm:text-base
                      transition-all duration-300 z-10
                      ${isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' 
                        : isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }
                    `}>
                      {isCompleted ? "✓" : stepNum}
                    </div>
                    
                    <span className={`
                      text-[10px] sm:text-xs 
                      mt-2 sm:mt-3 
                      font-medium text-center 
                      max-w-[60px] sm:max-w-[80px] 
                      transition-colors
                      leading-tight
                      ${step >= stepNum ? "text-gray-900" : "text-gray-400"}
                    `}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 2 && (
            <StepVote 
              trip={trip} 
              onSave={handleSaveDates}
              heatmapData={heatmapData}
              memberAvailabilities={trip.memberAvailabilitys || []}
            />
          )}
          
          {step === 3 && (
            <StepBudget 
              trip={trip} 
              onSave={handleSaveBudget}
              budgetOptions={trip.budgetOptions || []}
            />
          )}
          
          {step === 4 && (
            <StepPlace 
              trip={trip} 
              onVote={handleVoteLocation}
              provinceVotes={trip.provinceVotes || []}
            />
          )}
          
          {step === 5 && (
            <StepSummary 
<<<<<<< HEAD
              trip={trip}
              //onNavigateToSummary={() => navigate(`/summary/${tripCode}`)}
=======
              trip={trip} 
              onNavigateToStep={setStep} 
>>>>>>> 59dcfd2d1d16c01491237a32cdfa0ce1fc61ca1d
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={back}
            disabled={step === 2 || saving}
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-gray-700 font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm min-h-[48px]"
          >
            <span className="hidden sm:inline">← ย้อนกลับ</span>
            <span className="sm:hidden">← ย้อน</span>
          </button>
          
          <button 
            onClick={next}
            disabled={step === stepLabels.length || saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">กำลังบันทึก...</span>
                <span className="sm:hidden">บันทึก...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">หน้าถัดไป →</span>
                <span className="sm:hidden">ถัดไป →</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default VotePage;