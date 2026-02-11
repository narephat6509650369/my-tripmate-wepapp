// src/pages/VotePage.tsx
import React, { useState, useEffect, useRef, useCallback} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Clock } from "lucide-react";

// Components
import Header from "../components/Header";
import StepVote from "./VotePage/components/StepVote";
import StepBudget from './VotePage/components/StepBudget';
import StepPlace from './VotePage/components/StepPlace';
import StepSummary from './VotePage/components/StepSummary';

// Hooks & Utils
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, voteAPI } from '../services/tripService';
import type { TripDetail, DateRange, LocationVote } from '../types';

// ============== MAIN COMPONENT ==============
const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // ============== STATE ==============
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [userDates, setUserDates] = useState<string[]>([]);
  const [userBudget, setUserBudget] = useState({ accommodation: 0, transport: 0, food: 0, other: 0 });
  const [userLocations, setUserLocations] = useState<{ place: string; score: number }[]>([]);

  const displayCode = inviteCode || tripCode;

  const isSummaryUnlocked = (tripData: TripDetail): boolean => {
    if (!tripData.createdat) return false;
    const createdAt = new Date(tripData.createdat);
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

  const getUserInput = () => ({
    dates: userDates,
    budget: userBudget,
    locations: userLocations
  });

  const budgetSaveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  

  // ============== LOAD TRIP DATA ==============
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
        
        const response = await tripAPI.getTripDetail(tripCode);
        console.log("Trip detail response:", response);
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        const tripData = response.data;
        
        setInviteCode(tripData.invitecode);
        setTrip(tripData);
        try {
          // วันที่
          const dateRes = await voteAPI.getDateMatchingResult(tripData.tripid);
          if (dateRes?.data?.data?.userAvailability) {
            setUserDates(dateRes.data.data.userAvailability);
          }

          // งบ
          const budgetRes = await voteAPI.getBudgetVoting(tripData.tripid);
          if (budgetRes?.data?.data?.budget_options) {
            const b = { accommodation: 0, transport: 0, food: 0, other: 0 };
            budgetRes.data.data.budget_options.forEach((item: any) => {
              if (item.category_name in b) {
                b[item.category_name as keyof typeof b] = item.estimated_amount;
              }
            });
            setUserBudget(b);
          }

          // จังหวัด
          const locRes = await voteAPI.getLocationVote(tripData.tripid);
          /*
          if (locRes?.data?.data?.my_votes) {
            setUserLocations(locRes.data.data.my_votes);
          }
            */
        } catch (e) {
          console.error('Load user input failed:', e);
        }

        setLoading(false);
        
      } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
          navigate(`/login?redirect=/votepage/${tripCode}`);
          return;
        }
        if (status === 403) {
          console.log("User not in trip → auto join flow");

        try {
          const joinRes = await tripAPI.joinTrip(tripCode);

            if (joinRes.success) {
              console.log("Auto join success → reload trip");
              // reload trip detail
              const detail = await tripAPI.getTripDetail(tripCode);
              setTrip(detail?.data || null);
              setInviteCode(detail?.data?.invitecode ?? detail?.data?.invitecode ?? "");
              setLoading(false);
            return;
            }
        } catch (e) {
          console.error("Join failed → fallback redirect");
          navigate(`/join/${tripCode}`);
          return;
        }
        }
      }
    };
    
    loadTripData();
  }, [tripCode, navigate]);

  // ============== HANDLERS ==============
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    logout();
  };

  // ✅ Manual Navigation (สำหรับ Smart Toast)
  const handleManualNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  // ✅ Save Dates (มี Auto-navigation)
  const handleSaveDates = async (dates: string[]) => {
    if (!trip) {
      console.log('No trip data available');
      return;
    }

    if (!user) {
      console.log('No user data available');
      return;
    }
    
    try {
      const response = await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        user_id: user.user_id,
        ranges: dates.sort(), 
      });
      
      if (response.success) {
        console.log('✅ บันทึกวันที่สำเร็จ');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving dates:', error);
      console.error('บันทึกวันที่ไม่สำเร็จ');
    }
  };

  // ✅ Save Budget
  // ✅ Save Budget with Debounce
  const handleSaveBudget = useCallback(async (category: string, amount: number) => {
    if (!trip) return;

    // Clear previous timeout for this category
    if (budgetSaveTimeoutRef.current[category]) {
      clearTimeout(budgetSaveTimeoutRef.current[category]);
    }

    // Set new timeout
    budgetSaveTimeoutRef.current[category] = setTimeout(async () => {
      try {
        const response = await voteAPI.updateBudget(trip.tripid, {
          category: category as any,
          amount
        });

        if (response.success) {
          console.log(`✅ บันทึกงบประมาณ ${category}: ${amount} บาท`);
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('❌ Error saving budget:', error);
      }
    }, 500); // 500ms debounce

  }, [trip]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(budgetSaveTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // ✅ Vote Location Handler
   // ✅ Vote Location (แก้ไขตามที่แนะนำก่อนหน้า)
  const handleVoteLocation = useCallback(async (votes: LocationVote[]) => {
    if (!trip) return;

    try {
      const response = await voteAPI.submitLocationVote(trip.tripid, { votes });

      console.log("✅ submitLocationVote response:", response);

      if (response.success) {
        // ✅ Update local state
        setUserLocations(votes.map(v => ({
          place: v.location_name,
          score: v.score
        })));

        console.log('✅ โหวตสำเร็จ');
      } else {
        throw new Error(response.message || 'โหวตไม่สำเร็จ');
      }
    } catch (error) {
      console.error('❌ Error voting location:', error);
      throw error;
    }
  }, [trip]);

  const next = async () => {
    if (step >= 5) return;
    
    try {
      // Auto-save logic here if needed
      setStep(step + 1);
    } catch (error) {
      console.error('Error moving to next step:', error);
    }
  };

  const back = () => { 
    if (step > 2) setStep(step - 1); 
  };

  // ============== LOADING & ERROR STATES ==============
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

  // ============== MAIN RENDER ==============
  const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            ◄ กลับไปหน้าหลัก
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
                    {/* Step Circle */}
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
                    
                    {/* Step Label */}
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
              onManualNext={handleManualNext}
            />
          )}

          {step === 3 && (
            <StepBudget 
              trip={trip}
              onSave={handleSaveBudget}
            />
          )}

          {step === 4 && (
            <StepPlace 
              trip={trip}
              onVote={handleVoteLocation}
            />
          )}

          {step === 5 && (
            <StepSummary 
              trip={trip}
              onNavigateToStep={setStep}
              isOwner={trip.ownerid === user?.user_id}
              canViewSummary={trip.ownerid === user?.user_id || isSummaryUnlocked(trip)}
              userInput={getUserInput()} 
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={back}
            disabled={step === 2}
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-gray-700 font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm min-h-[48px]"
          >
            <span className="hidden sm:inline">← ย้อนกลับ</span>
            <span className="sm:hidden">← ย้อน</span>
          </button>
          <button 
            onClick={next}
            disabled={step === stepLabels.length}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px]"
          >
            <span className="hidden sm:inline">หน้าถัดไป →</span>
            <span className="sm:hidden">ถัดไป →</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default VotePage;