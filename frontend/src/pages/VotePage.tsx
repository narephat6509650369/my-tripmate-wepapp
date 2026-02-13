// src/pages/VotePage.tsx
<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy } from "lucide-react";
=======
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Clock } from "lucide-react";
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

// Components
import Header from "../components/Header";
import StepVote from "./VotePage/components/StepVote";
import StepBudget from './VotePage/components/StepBudget';
import StepPlace from './VotePage/components/StepPlace';
import StepSummary from './VotePage/components/StepSummary';

// Hooks & Utils
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, voteAPI } from '../services/tripService';
<<<<<<< HEAD
import type { TripDetail, LocationVote } from '../types';

// ============== TYPES ==============
interface UserInput {
  dates: string[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
  };
  locations: { place: string; score: number }[];
}
=======
import type { TripDetail, DateRange, LocationVote } from '../types';
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

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
<<<<<<< HEAD
  
  // ✅ FIX #1: Central State Management
  const [userInput, setUserInput] = useState<UserInput>({
    dates: [],
    budget: { accommodation: 0, transport: 0, food: 0, other: 0 },
    locations: []
  });
  
  // ✅ FIX #2: Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // ✅ FIX #3: Loading state for each step
  const [stepLoading, setStepLoading] = useState(false);
=======

  const [userDates, setUserDates] = useState<string[]>([]);
  const [userBudget, setUserBudget] = useState({ accommodation: 0, transport: 0, food: 0, other: 0 });
  const [userLocations, setUserLocations] = useState<{ place: string; score: number }[]>([]);
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

  const displayCode = inviteCode || tripCode;

  const isSummaryUnlocked = (tripData: TripDetail): boolean => {
    if (!tripData.createdat) return false;
    const createdAt = new Date(tripData.createdat);
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

<<<<<<< HEAD
=======
  const getUserInput = () => ({
    dates: userDates,
    budget: userBudget,
    locations: userLocations
  });

>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
        
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        const tripData = response.data;
<<<<<<< HEAD
        setInviteCode(tripData.invitecode);
        setTrip(tripData);
        
        // ✅ FIX #4: Load user input in parallel (faster)
        const [dateRes, budgetRes, locRes] = await Promise.allSettled([
          voteAPI.getDateMatchingResult(tripData.tripid),
          voteAPI.getBudgetVoting(tripData.tripid),
          voteAPI.getLocationVote(tripData.tripid)
        ]);
        
        // Process dates
        if (dateRes.status === 'fulfilled' && dateRes.value?.data?.data?.userAvailability) {
          setUserInput(prev => ({
            ...prev,
            dates: dateRes.value.data.data.userAvailability
          }));
        }
        
        // Process budget
        if (budgetRes.status === 'fulfilled' && budgetRes.value?.data?.data?.budget_options) {
          const b = { accommodation: 0, transport: 0, food: 0, other: 0 };
          budgetRes.value.data.data.budget_options.forEach((item: any) => {
            if (item.category_name in b) {
              b[item.category_name as keyof typeof b] = item.estimated_amount;
            }
          });
          setUserInput(prev => ({ ...prev, budget: b }));
        }
        
        // Process locations
        if (locRes.status === 'fulfilled' && locRes.value?.data?.data?.my_votes) {
          setUserInput(prev => ({
            ...prev,
            locations: locRes.value.data.data.my_votes
          }));
        }
        
        console.log('✅ Trip loaded:', tripData);
        
      } catch (error: any) {
        const status = error.response?.status;
        
=======
        
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
          if (locRes?.data?.data?.my_votes) {
            setUserLocations(locRes.data.data.my_votes);
          }
        } catch (e) {
          console.error('Load user input failed:', e);
        }

        setLoading(false);
        
      } catch (error: any) {
        const status = error.response?.status;
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        if (status === 401) {
          navigate(`/login?redirect=/votepage/${tripCode}`);
          return;
        }
<<<<<<< HEAD
        
        if (status === 403) {
          console.log("User not in trip → auto join flow");
          try {
            const joinRes = await tripAPI.joinTrip(tripCode);
            if (joinRes.success) {
              console.log("Auto join success → reload trip");
              const detail = await tripAPI.getTripDetail(tripCode);
              setTrip(detail?.data || null);
              setInviteCode(detail?.data?.invitecode ?? "");
            }
          } catch (e) {
            console.error("Join failed → fallback redirect");
            navigate(`/join/${tripCode}`);
            return;
          }
        }
        
        setError(error.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
=======
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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

<<<<<<< HEAD
  // ✅ FIX #5: Save Dates with State Update
  const handleSaveDates = useCallback(async (dates: string[]) => {
    if (!trip || !user) {
      console.log('No trip/user data available');
=======
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      return;
    }
    
    try {
      const response = await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        user_id: user.user_id,
        ranges: dates.sort(), 
      });
      
      if (response.success) {
<<<<<<< HEAD
        // ✅ Update local state
        setUserInput(prev => ({ ...prev, dates }));
        setHasUnsavedChanges(false);
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        console.log('✅ บันทึกวันที่สำเร็จ');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving dates:', error);
<<<<<<< HEAD
      throw error; // Re-throw for component to handle
    }
  }, [trip, user]);

  // ✅ FIX #6: Save Budget with State Update
  const handleSaveBudget = useCallback(async (category: string, amount: number) => {
    if (!trip) return;
    
    try {
      const response = await voteAPI.updateBudget(trip.tripid, {
=======
      console.error('บันทึกวันที่ไม่สำเร็จ');
    }
  };

  // ✅ Save Budget
  const handleSaveBudget = async (category: string, amount: number) => {
    if (!trip) return;
    
    try {
      const response = await voteAPI.updateBudget(
        trip.tripid, {
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        category: category as any,
        amount
      });
      
      if (response.success) {
<<<<<<< HEAD
        // ✅ Update local state
        setUserInput(prev => ({
          ...prev,
          budget: { ...prev.budget, [category]: amount }
        }));
        setHasUnsavedChanges(false);
        console.log('✅ บันทึกงบประมาณสำเร็จ');
=======
        console.log('บันทึกงบประมาณสำเร็จ');
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
<<<<<<< HEAD
      throw error;
    }
  }, [trip]);

  // ✅ FIX #7: Vote Location with State Update
  const handleVoteLocation = useCallback(async (votes: LocationVote[]) => {
=======
      console.error('บันทึกงบประมาณไม่สำเร็จ');
    }
  };

  // ✅ Vote Location
  const handleVoteLocation = async (votes: LocationVote[]) => {
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (!trip) return;
    
    try {
      const response = await voteAPI.submitLocationVote(trip.tripid, { votes });
<<<<<<< HEAD
      
      if (response.success) {
        // ✅ Update local state
        setUserInput(prev => ({
          ...prev,
          locations: votes.map(v => ({ place: v.location_name, score: v.score }))
        }));
        setHasUnsavedChanges(false);
        console.log('✅ โหวตสำเร็จ');
=======
      console.log("submitLocationVote", response);
      if (response.success) {
        console.log('โหวตสำเร็จ');
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error voting location:', error);
<<<<<<< HEAD
      throw error;
    }
  }, [trip]);

  // ✅ FIX #8: Smart Navigation with Validation
  const validateStep = useCallback((currentStep: number): { valid: boolean; message?: string } => {
    switch (currentStep) {
      case 2: // Dates
        if (userInput.dates.length === 0) {
          return { valid: false, message: 'กรุณาเลือกวันที่ก่อนไปหน้าถัดไป' };
        }
        break;
      
      case 3: // Budget
        const hasRequiredBudget = 
          userInput.budget.accommodation > 0 &&
          userInput.budget.transport > 0 &&
          userInput.budget.food > 0;
        
        if (!hasRequiredBudget) {
          return { 
            valid: false, 
            message: 'กรุณากรอกงบประมาณที่จำเป็น (ที่พัก, เดินทาง, อาหาร)' 
          };
        }
        break;
      
      case 4: // Locations
        if (userInput.locations.length === 0) {
          return { valid: false, message: 'กรุณาโหวตสถานที่อย่างน้อย 1 แห่ง' };
        }
        break;
    }
    
    return { valid: true };
  }, [userInput]);

  const next = useCallback(async () => {
    if (step >= 5) return;
    
    // ✅ Validate before moving
    const validation = validateStep(step);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    // ✅ Check unsaved changes
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการไปหน้าถัดไปโดยไม่บันทึกหรือไม่?'
      );
      if (!confirm) return;
    }
    
    setStepLoading(true);
    
    try {
      // Optional: Pre-load next step data
      if (step === 2) {
        // Pre-load budget data
        await voteAPI.getBudgetVoting(trip!.tripid);
      } else if (step === 3) {
        // Pre-load location data
        await voteAPI.getLocationVote(trip!.tripid);
      }
      
      setStep(step + 1);
    } catch (error) {
      console.error('Error loading next step:', error);
    } finally {
      setStepLoading(false);
    }
  }, [step, hasUnsavedChanges, validateStep, trip]);

  const back = useCallback(() => { 
    if (step <= 2) return;
    
    // ✅ Warn about unsaved changes
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการย้อนกลับโดยไม่บันทึกหรือไม่?'
      );
      if (!confirm) return;
    }
    
    setStep(step - 1); 
  }, [step, hasUnsavedChanges]);

  // ✅ FIX #9: Manual navigation (from Smart Toast)
  const handleManualNext = useCallback(() => {
    setHasUnsavedChanges(false);
    setStep(prev => Math.min(5, prev + 1));
  }, []);

  // ✅ FIX #10: Track changes in child components
  const handleInputChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);
=======
      console.error('โหวตสถานที่ไม่สำเร็จ');
    }
  };

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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

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
<<<<<<< HEAD
=======
            {/* ปุ่มคัดลอกรหัส */}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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

<<<<<<< HEAD
=======
            {/* ปุ่มแชร์ลิงก์ */}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
        {/* ✅ แสดง unsaved changes warning */}
        {hasUnsavedChanges && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p>
                <p className="text-sm text-yellow-700">กรุณาบันทึกก่อนไปหน้าถัดไป</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
=======
        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            {/* Progress Bar */}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
=======
                    {/* Step Circle */}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
                    
<<<<<<< HEAD
=======
                    {/* Step Label */}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
          {stepLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {step === 2 && (
                <StepVote 
                  trip={trip}
                  initialDates={userInput.dates}
                  onSave={handleSaveDates}
                  onManualNext={handleManualNext}
                  onInputChange={handleInputChange}
                />
              )}

              {step === 3 && (
                <StepBudget 
                  trip={trip}
                  initialBudget={userInput.budget}
                  onSave={handleSaveBudget}
                  onManualNext={handleManualNext}
                  onInputChange={handleInputChange}
                />
              )}

              {step === 4 && (
                <StepPlace 
                  trip={trip}
                  initialVotes={userInput.locations}
                  onVote={handleVoteLocation}
                  onInputChange={handleInputChange}
                />
              )}

              {step === 5 && (
                <StepSummary 
                  trip={trip}
                  onNavigateToStep={setStep}
                  isOwner={trip.ownerid === user?.user_id}
                  canViewSummary={trip.ownerid === user?.user_id || isSummaryUnlocked(trip)}
                  userInput={userInput}
                />
              )}
            </>
=======
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={back}
<<<<<<< HEAD
            disabled={step === 2 || stepLoading}
=======
            disabled={step === 2}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-gray-700 font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm min-h-[48px]"
          >
            <span className="hidden sm:inline">← ย้อนกลับ</span>
            <span className="sm:hidden">← ย้อน</span>
          </button>
          <button 
            onClick={next}
<<<<<<< HEAD
            disabled={step === stepLabels.length || stepLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px] relative"
          >
            {stepLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>
                <span className="hidden sm:inline">หน้าถัดไป →</span>
                <span className="sm:hidden">ถัดไป →</span>
              </>
            )}
=======
            disabled={step === stepLabels.length}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px]"
          >
            <span className="hidden sm:inline">หน้าถัดไป →</span>
            <span className="sm:hidden">ถัดไป →</span>
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
          </button>
        </div>
      </main>
    </div>
  );
};

export default VotePage;