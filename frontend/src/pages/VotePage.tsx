import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Clock } from "lucide-react";

// Components
import Header from "../components/Header";
import { TripProgress } from "../components/TripProgress";
import { OwnerControls } from "./VotePage/components/OwnerControls";
import { MemberProgressList } from "../components/MemberProgressList";
import { StepVote } from "./VotePage/components/StepVote";
import { StepBudget } from "./VotePage/components/StepBudget";
import { StepPlace } from "./VotePage/components/StepPlace";
import { StepSummary } from "./VotePage/components/StepSummary";
import { MemberControls } from "./VotePage/components/MemberControls";
import { Toast } from "../components/Toast";

// Services & Utils
import { tripAPI } from "../services/api";
import { CONFIG, log } from '../config/app.config';

// Data & Types
import { getMockTripData, TripData, Member, HistoryEntry } from "../data/mockData";

// ============== TYPES ==============
interface BudgetStats {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  avg: number;
  count: number;
  values: number[];
  outliers?: number;
}

// ============== CONSTANTS ==============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

// ============== HELPER FUNCTIONS ==============
const removeOutliers = (values: number[]): { 
  filtered: number[]; 
  outlierCount: number;
} => {
  if (values.length < 4) {
    return { filtered: values, outlierCount: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length / 4);
  const q3Index = Math.floor(3 * sorted.length / 4);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const filtered = sorted.filter(v => v >= lowerBound && v <= upperBound);
  const outlierCount = sorted.length - filtered.length;
  
  return { filtered, outlierCount };
};

const getSummary = (values: number[]): BudgetStats => {
  const nonZeroValues = values.filter(v => v > 0);
  
  if (nonZeroValues.length === 0) {
    return { 
      min: 0, max: 0, median: 0, q1: 0, q3: 0, avg: 0, count: 0, values: [], outliers: 0 
    };
  }
  
  const { filtered, outlierCount } = removeOutliers(nonZeroValues);
  const sorted = [...filtered].sort((a, b) => a - b);
  const count = sorted.length;
  
  if (count === 0) {
    return { 
      min: 0, max: 0, median: 0, q1: 0, q3: 0, avg: 0, count: 0, values: [], outliers: outlierCount 
    };
  }
  
  const min = sorted[0];
  const max = sorted[count - 1];
  const median = count % 2 === 0 
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 
    : sorted[Math.floor(count / 2)];
  const q1 = sorted[Math.floor(count / 4)];
  const q3 = sorted[Math.floor(3 * count / 4)];
  const avg = sorted.reduce((a, b) => a + b, 0) / count;
  
  return { min, max, median, q1, q3, avg, count, values: sorted, outliers: outlierCount };
};

// ============== MAIN COMPONENT ==============
const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // ============== STATE ==============
  const [trip, setTrip] = useState<TripData>({
    _id: "",
    tripCode: "",
    name: "",
    days: 0,
    detail: "",
    createdBy: "",
    createdAt: 0,
    isCompleted: false,
    members: [],
    voteOptions: [],
    selectedDate: null,
    voteResults: { provinces: [], dates: [] },
    dateRanges: [],
    dateVotes: [],
    provinceVotes: [],
    memberAvailability: []
  });
  
  const [memberBudget, setMemberBudget] = useState<Member | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  
  // ✅ Global History
  const [globalHistory, setGlobalHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const displayCode = inviteCode || tripCode;

  // ============== LOAD TRIP DATA ==============
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const loadTripData = async () => {
      if (tripCode === "UNKNOWN") {
        setError("ไม่พบรหัสทริป");
        setTimeout(() => navigate("/homepage"), 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Loading trip data from mock');
          response = getMockTripData(); 
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log.api('Loading trip data from API');
          response = await tripAPI.getTripDetail(tripCode);
        }
        
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        if (!isMounted) return;

        const tripData = response.data;
        
        if (tripData?.inviteCode) {
          setInviteCode(tripData.inviteCode);
        } else if (tripData?.tripCode) {
          setInviteCode(tripData.tripCode);
        } else {
          setInviteCode(tripCode);
        }
        
        setTrip(tripData);

        const userId = localStorage.getItem('userId');

        if (!userId) {
          log.error('❌ No userId in localStorage');
          setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        let currentMember = tripData.members?.find((m: Member) => m.id === userId);

        if (!currentMember) {
          const userEmail = localStorage.getItem('userEmail');
          if (userEmail) {
            currentMember = tripData.members?.find((m: Member) => 
              m.email?.toLowerCase() === userEmail.toLowerCase()
            );
          }
        }

        if (!currentMember) {
          log.warn('⚠️ Current user not found in members list');
          setError("คุณไม่ได้อยู่ในทริปนี้ กรุณาเข้าร่วมทริปก่อน");
          setTimeout(() => navigate("/homepage"), 3000);
          return;
        }

        setMemberBudget(currentMember);
        setLoading(false);
        
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        
        log.error("Error loading trip:", error);
        
        if (!isMounted) return;
        
        setError("ไม่สามารถโหลดข้อมูลทริปได้");
        setLoading(false);
        setTimeout(() => navigate("/homepage"), 3000);
      }
    };
    
    loadTripData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [tripCode, navigate]);

  // ============== COMPUTED VALUES ==============
  const budgetStats = useMemo(() => {
    const result: Record<string, BudgetStats> = {};
    BUDGET_CATEGORIES.forEach(({ key }) => {
      const values = (trip.members || []).map(m => m.budget[key]);
      result[key] = getSummary(values);
    });
    return result;
  }, [trip.members]);

  const totalBudget = useMemo(() => {
    if (!memberBudget) return 0;
    return BUDGET_CATEGORIES.reduce((sum, { key }) => sum + memberBudget.budget[key], 0);
  }, [memberBudget]);

  const avgPriorities = useMemo(() => {
    const membersWithPriorities = trip.members?.filter(m => m.budgetPriorities) || [];
    
    if (membersWithPriorities.length === 0) {
      return null;
    }
    
    const sum = {
      accommodation: 0,
      transport: 0,
      food: 0
    };
    
    membersWithPriorities.forEach(m => {
      sum.accommodation += m.budgetPriorities?.accommodation || 2;
      sum.transport += m.budgetPriorities?.transport || 2;
      sum.food += m.budgetPriorities?.food || 2;
    });
    
    return {
      accommodation: sum.accommodation / membersWithPriorities.length,
      transport: sum.transport / membersWithPriorities.length,
      food: sum.food / membersWithPriorities.length,
      count: membersWithPriorities.length
    };
  }, [trip.members]);

  // ============== HANDLERS ==============
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/");
  };
  const sanitizeText = (text: string): string => {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .slice(0, 200); // จำกัด 200 ตัวอักษร
  };

  const addHistory = (step: number, stepName: string, action: string) => {
    setGlobalHistory(prev => [{
      step,
      stepName: sanitizeText(stepName),
      action: sanitizeText(action),
      timestamp: Date.now()
    }, ...prev.slice(0, 49)]); // จำกัดแค่ 50 entries
  };

  const canProceedToNextStep = (): boolean => {
    switch (step) {
      case 2:
        return true;

      case 3:
        if (!memberBudget) {
          console.log('❌ No memberBudget');
          return false;
        }
        
        const hasFilledBudget = 
          memberBudget.budget.accommodation > 0 &&
          memberBudget.budget.transport > 0 &&
          memberBudget.budget.food > 0;
        
        if (!hasFilledBudget) {
          console.log('❌ กรุณากรอกงบประมาณให้ครบทุกหมวด (ที่พัก, เดินทาง, อาหาร)');
          return false;
        }
        
        return true;

      case 4:
        return true;

      default:
        return true;
    }
  };

  const next = async () => {
    if (step >= 5) return;
    
    try {
      if (step === 2) {
        console.log('💾 Auto-saving date availability...');
        const saveEvent = new CustomEvent('auto-save-dates');
        window.dispatchEvent(saveEvent);
        await new Promise(resolve => setTimeout(resolve, 500));
        // ✅ แสดง Toast
        // setToast({ message: '✓ บันทึกวันที่ว่างแล้ว', type: 'success' });
        setToast({ message: 'บันทึกวันที่ว่างแล้ว', type: 'success' });
      }
      
      if (step === 3) {
        console.log('💾 Auto-saving budget...');
        const saveEvent = new CustomEvent('auto-save-budget');
        window.dispatchEvent(saveEvent);
        await new Promise(resolve => setTimeout(resolve, 500));
        // ✅ แสดง Toast
        setToast({ message: 'บันทึกงบประมาณแล้ว', type: 'success' });
      }
      
      if (step === 4) {
        console.log('💾 Auto-saving province votes...');
        const saveEvent = new CustomEvent('auto-save-provinces');
        window.dispatchEvent(saveEvent);
        await new Promise(resolve => setTimeout(resolve, 500));
        // ✅ แสดง Toast
        setToast({ message: 'บันทึกโหวตแล้ว', type: 'success' });
      }
      
      if (!canProceedToNextStep()) {
        // ✅ แสดง Error Toast
        setToast({ message: '⚠️ กรุณากรอกข้อมูลให้ครบ', type: 'error' });
        return;
      }
      
      setStep(step + 1);
    } catch (error) {
      setToast({ message: '❌ เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const back = () => { if (step > 2) setStep(step - 1); };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-xl text-gray-700 mb-4">{error}</p>
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

  if (!memberBudget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <p className="text-xl text-gray-700 mb-4">ไม่พบข้อมูลสมาชิก</p>
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
            {/* ✅ ปุ่มประวัติ */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all min-w-[44px] min-h-[44px] justify-center ${
                showHistory 
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="ดูประวัติการแก้ไข"
              aria-label="ดูประวัติการแก้ไข"
            >
              <Clock className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm sm:text-base">ประวัติ</span>
              {globalHistory.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {globalHistory.length > 99 ? '99+' : globalHistory.length}
                </span>
              )}
            </button>
            
            {/* ปุ่มคัดลอกรหัส */}
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all font-mono text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied === 'code' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(displayCode, 'code')}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
              aria-label="คัดลอกรหัสทริป"
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
              aria-label="แชร์ลิงก์ทริป"
            >
              <span className="hidden sm:inline">แชร์ลิงก์</span>
              <span className="sm:hidden">แชร์</span>
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ✅ History Panel */}
        {showHistory && (
          <div className="mt-4 bg-white rounded-lg shadow-lg border-2 border-purple-200 p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              ประวัติการแก้ไข (ทุก Step)
            </h3>
            {globalHistory.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {globalHistory.map((entry, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition"
                  >
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800">
                        {entry.stepName}:
                      </span>{' '}
                      <span className="text-gray-700">{entry.action}</span>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">ยังไม่มีประวัติ</p>
            )}
          </div>
        )}
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OwnerControls
          trip={trip}
          setTrip={setTrip}
          memberBudget={memberBudget}
          tripCode={tripCode}
        />

        <MemberControls
          trip={trip}
          memberBudget={memberBudget}
          tripCode={tripCode}
        />
        
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
              setTrip={setTrip}
              memberBudget={memberBudget}
              tripCode={tripCode}
              addHistory={addHistory}
              onNavigateToStep={(targetStep) => setStep(targetStep)}
            />
          )}
          
          {step === 3 && (
            <StepBudget
              trip={trip}
              setTrip={setTrip}
              memberBudget={memberBudget}
              setMemberBudget={setMemberBudget}
              tripCode={tripCode}
              budgetStats={budgetStats}
              totalBudget={totalBudget}
              addHistory={addHistory}
              onNavigateToStep={(targetStep) => setStep(targetStep)}
              onBudgetChange={(newBudget) => {
                console.log('📥 Received budget change from StepBudget:', newBudget);
                if (memberBudget) {
                  setMemberBudget({
                    ...memberBudget,
                    budget: newBudget
                  });
                }
              }}
            />
          )}
          
          {step === 4 && (
            <StepPlace
              trip={trip}
              setTrip={setTrip}
              memberBudget={memberBudget}
              tripCode={tripCode}
              addHistory={addHistory}
              onNavigateToStep={(targetStep) => setStep(targetStep)}
            />
          )}
          
          {step === 5 && (
            <StepSummary
              trip={trip}
              memberBudget={memberBudget}
              tripCode={tripCode}
              onNavigateToStep={(targetStep) => setStep(targetStep)}
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

        {/* ข้อมูลเพิ่มเติม - Collapsible */}
        <div className="mt-12 pt-12 border-t-2 border-gray-200">
          <button
            onClick={() => setShowExtraInfo(!showExtraInfo)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow hover:bg-gray-50 transition border-2 border-gray-200"
          >
            <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📊</span>
              <span>ข้อมูลเพิ่มเติม</span>
            </span>
            <span className="text-gray-500 text-xl">
              {showExtraInfo ? "▲" : "▼"}
            </span>
          </button>
          
          {showExtraInfo && (
            <div className="mt-6 space-y-6">
              {avgPriorities && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    ⭐ ความสำคัญเฉลี่ยของกลุ่ม
                  </h4>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                    <p className="text-sm text-blue-800">
                      📊 มีสมาชิก {avgPriorities.count}/{trip.members.length} คนที่ระบุความสำคัญ
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'ที่พัก', icon: '🏨', value: avgPriorities.accommodation },
                      { name: 'เดินทาง', icon: '🚗', value: avgPriorities.transport },
                      { name: 'อาหาร', icon: '🍜', value: avgPriorities.food }
                    ].map(({ name, icon, value }) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold">{name}</span>
                            <span className="text-sm text-gray-600">
                              {value <= 1.5 ? '⭐⭐⭐ สำคัญมาก' : 
                               value <= 2.5 ? '⭐⭐ ปานกลาง' : 
                               '⭐ สำคัญน้อย'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                value <= 1.5 ? 'bg-red-500' :
                                value <= 2.5 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${((4 - value) / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-800">
                      💡 <strong>คำแนะนำ:</strong>{' '}
                      {(() => {
                        const sorted = [
                          { name: 'ที่พัก', priority: avgPriorities.accommodation },
                          { name: 'เดินทาง', priority: avgPriorities.transport },
                          { name: 'อาหาร', priority: avgPriorities.food }
                        ].sort((a, b) => a.priority - b.priority);
                        
                        const top = sorted[0];
                        const low = sorted[2];
                        
                        return `กลุ่มของคุณเน้น${top.name}มากที่สุด แนะนำให้เลือก${top.name}คุณภาพดี 
                        และสามารถประหยัด${low.name}ได้`;
                      })()}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  📈 ความคืบหน้าทริป
                </h4>
                <TripProgress 
                  trip={trip}
                  currentMemberId={memberBudget.id}
                />
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  👥 สถานะสมาชิก
                </h4>
                <MemberProgressList 
                  trip={trip}
                  currentUserId={memberBudget.id}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VotePage;