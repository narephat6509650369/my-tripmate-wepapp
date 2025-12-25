import React, { useState, useEffect, useMemo, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Users } from "lucide-react";

// Components
import Header from "../components/Header";
import { TripProgress } from "../components/TripProgress";
import { OwnerControls } from "./VotePage/components/OwnerControls";
import { StepVote } from "./VotePage/components/StepVote";
import { StepBudget } from "./VotePage/components/StepBudget";
import { StepPlace } from "./VotePage/components/StepPlace";
import { StepSummary } from "./VotePage/components/StepSummary";

// Services & Utils
import { tripAPI } from "../services/api";
import { CONFIG, log } from '../config/app.config';
import { formatCurrency } from '../utils/helpers';

// Data & Types
import { getMockTripData, TripData, Member } from "../data/mockData";

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
}

// ============== CONSTANTS ==============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

// ============== HELPER FUNCTIONS ==============
const getSummary = (values: number[]): BudgetStats => {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  
  if (count === 0) {
    return { min: 0, max: 0, median: 0, q1: 0, q3: 0, avg: 0, count: 0, values: [] };
  }
  
  const min = sorted[0];
  const max = sorted[count - 1];
  const median = count % 2 === 0 
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 
    : sorted[Math.floor(count / 2)];
  const q1 = sorted[Math.floor(count / 4)];
  const q3 = sorted[Math.floor(3 * count / 4)];
  const avg = sorted.reduce((a, b) => a + b, 0) / count;
  
  return { min, max, median, q1, q3, avg, count, values: sorted };
};

// ============== MAIN COMPONENT ==============
const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();

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

  // Display code
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
        
        // Set invite code
        if (tripData?.inviteCode) {
          setInviteCode(tripData.inviteCode);
        } else if (tripData?.tripCode) {
          setInviteCode(tripData.tripCode);
        } else {
          setInviteCode(tripCode);
        }
        
        setTrip(tripData);

        // Get current user
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

        console.log('✅ Trip loaded:', {
          tripCode: tripData.tripCode,
          members: tripData.members?.length,
          currentMember: currentMember.name,
          budget: currentMember.budget
        });
        
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

  const next = () => { if (step < 5) setStep(step + 1); };
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
            <button 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-mono ${
                copied === 'code' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(displayCode, 'code')}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
            >
              {displayCode}
              <Copy className="w-4 h-4" />
            </button>
            <button 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                copied === 'link' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(window.location.href, 'link')}
            >
              แชร์ลิงก์
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner Controls */}
        <OwnerControls
          trip={trip}
          setTrip={setTrip}
          memberBudget={memberBudget}
          tripCode={tripCode}
        />

        {/* Trip Progress */}
        <TripProgress 
          trip={trip}
          currentMemberId={memberBudget.id}
        />
        
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
            <div 
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
                      w-12 h-12 flex items-center justify-center rounded-full border-4 font-bold transition-all duration-300 z-10
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
                      text-xs mt-3 font-medium text-center max-w-[80px] transition-colors
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
            />
          )}
          
          {step === 4 && (
            <StepPlace
              trip={trip}
              setTrip={setTrip}
              memberBudget={memberBudget}
              tripCode={tripCode}
            />
          )}
          
          {step === 5 && (
            <StepSummary
              trip={trip}
              memberBudget={memberBudget}
              tripCode={tripCode}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={back}
            disabled={step === 2}
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 rounded-xl text-gray-700 font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm"
          >
            ← ย้อนกลับ
          </button>
          <button 
            onClick={next}
            disabled={step === stepLabels.length}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            หน้าถัดไป →
          </button>
        </div>
      </main>
    </div>
  );
};

export default VotePage;