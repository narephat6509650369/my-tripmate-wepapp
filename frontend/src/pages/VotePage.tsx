// src/pages/VotePage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Trash2} from "lucide-react";

// Components
import Header from "../components/Header";
import StepVote from "./VotePage/components/StepVote";
import StepBudget from './VotePage/components/StepBudget';
import StepPlace from './VotePage/components/StepPlace';
import StepSummary from './VotePage/components/StepSummary';

// Hooks & Utils
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, voteAPI } from '../services/tripService';
import type { TripDetail, LocationVote, DateMatchingResponse, BudgetVotingResponse } from '../types';
type MatchingData = Pick<DateMatchingResponse, 'availability' | 'recommendation' | 'summary'>;
type BudgetInfo = Pick<BudgetVotingResponse, 'rows' | 'stats' | 'budgetTotal' | 'minTotal' | 'maxTotal' | 'filledMembers'>;

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
  const [matchingData, setMatchingData] = useState<MatchingData | null>(null);
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null); 
  const [userLocations, setUserLocations] = useState<{ place: string; score: number }[]>([]);

  const displayCode = inviteCode || tripCode;
  const isClosed = trip?.status === 'completed' || trip?.status === 'archived';

  const isSummaryUnlocked = (tripData: TripDetail): boolean => {
    if (tripData.status === 'completed' || tripData.status === 'archived') return true;
    if (!tripData.createdat) return false;
    const diffDays = (new Date().getTime() - new Date(tripData.createdat).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

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
          // ========== วันที่ ==========
          const dateRes = await voteAPI.getDateMatchingResult(tripData.tripid);
          if (dateRes?.data) {
            setMatchingData({
              availability: dateRes.data.availability || [],
              recommendation: dateRes.data.recommendation || null,
              summary: dateRes.data.summary || { totalMembers: 0, totalAvailableDays: 0 }
            });
          }
          if (dateRes?.data?.rows) setUserDates(dateRes.data.rows);
          const hasDates = dateRes?.data?.rowlog?.some(
            (r: any) => r.proposed_by === user?.user_id
          );

          // ========== งบประมาณ ==========
          const budgetRes = await voteAPI.getBudgetVoting(tripData.tripid);
          if (budgetRes?.data) setBudgetInfo(budgetRes.data);
          const hasBudget = budgetRes?.data?.rows?.some(
            (r: any) => r.user_id === user?.user_id
          );

          // ========== จังหวัด ==========
          const locRes = await voteAPI.getLocationVote(tripData.tripid);
          const hasPlace = locRes?.data?.rowlog?.some(
            (r: any) => r.proposed_by === user?.user_id
          );
          if (locRes?.data?.rowlog && user?.user_id) {
            const myVotes = locRes.data.rowlog
              .filter((log: any) => log.proposed_by === user.user_id)
              .map((log: any) => ({ place: log.province_name, score: log.score }));
            if (myVotes.length > 0) setUserLocations(myVotes);
          }

          const isCompleted = tripData.status === 'completed' || tripData.status === 'archived';
          if (isCompleted || (hasDates && hasBudget && hasPlace)) {
            setStep(5);
          }
          
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
              await loadTripData();   // ← ให้ทำงานใหม่ทั้งหมด รวม fetch วัน/งบ/จังหวัด
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
        setUserDates(dates);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving dates:', error);
      console.error('บันทึกวันที่ไม่สำเร็จ');
    }
  };

  // ✅ Save Budget
  const handleSaveBudget = async (category: string, amount: number) => {
    if (!trip) return;
    
    try {
      const response = await voteAPI.updateBudget(
        trip.tripid, {
        category: category as any,
        amount
      });
      
      if (response.success) {
        console.log('บันทึกงบประมาณสำเร็จ');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      console.error('บันทึกงบประมาณไม่สำเร็จ');
    }
  };

  // ✅ Vote Location
  const handleVoteLocation = async (votes: LocationVote[]) => {
    if (!trip) return;
    
    try {
      const response = await voteAPI.submitLocationVote(trip.tripid, { votes });
      console.log("submitLocationVote", response);
      if (response.success) {
        console.log('โหวตสำเร็จ');
        const updatedLocations = votes.map(v => ({
        place: v.place,
        score: v.score
      }));
      setUserLocations(updatedLocations);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error voting location:', error);
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    try {
      const response = await tripAPI.deleteTrip(trip.tripid);
      if (response.success) {
        navigate('/homepage');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Delete trip failed:', error);
      alert('ลบทริปไม่สำเร็จ กรุณาลองใหม่');
    }
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
            {/* ปุ่มลบทริป - เฉพาะ Owner */}
            {/* {trip?.ownerid === user?.user_id && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 transition-all text-sm min-w-[44px] min-h-[44px]"
                title="ลบทริป"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">ลบทริป</span>
              </button>
            )} */}
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
              matchingData= {matchingData}
              initialDates={userDates}
              onSave={handleSaveDates}
              onManualNext={next}
              isLocked={isClosed}  
            />
          )}

          {step === 3 && (
            <StepBudget 
              trip={trip}
              budgetInfo={budgetInfo}
              onSave={handleSaveBudget}
              onManualNext={next}
              isLocked={isClosed}
            />
          )}

          {step === 4 && (
            <StepPlace 
              trip={trip}
              onVote={handleVoteLocation}
              initialVotes={userLocations}
              initialVotingResults={userLocations}
              isLocked={isClosed}
            />
          )}

          {step === 5 && (
          <StepSummary 
            trip={trip}
            initialSummaryData={{ matchingData, budgetInfo, userLocations }}
            onNavigateToStep={setStep}
            isOwner={trip.ownerid === user?.user_id}
            canViewSummary={isSummaryUnlocked(trip)}
            onClosed={async () => {         // ← เพิ่ม
              const res = await tripAPI.getTripDetail(tripCode);
              if (res.data) setTrip(res.data);
            }}
          />
        )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={back}
            disabled={step === 2 || isClosed}
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-gray-700 font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm min-h-[48px]"
          >
            <span className="hidden sm:inline">← ย้อนกลับ</span>
            <span className="sm:hidden">← ย้อน</span>
          </button>
          <button 
            onClick={next}
            disabled={step === stepLabels.length || isClosed}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px]"
          >
            <span className="hidden sm:inline">หน้าถัดไป →</span>
            <span className="sm:hidden">ถัดไป →</span>
          </button>
        </div>
      </main>
      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ลบทริปนี้?</h3>
              <p className="text-sm text-gray-600">
                ทริป <strong>"{trip?.tripname}"</strong> จะถูกลบถาวร<br />
                ไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteTrip();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
              >
                ลบทริป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;