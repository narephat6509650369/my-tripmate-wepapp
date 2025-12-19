// ============================================================================
// VotePage.tsx - PART 1/7: IMPORTS & TYPES (แก้ไขแล้ว)
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ✅ เพิ่ม icons ที่ขาดหาย
import { 
  Check, 
  Loader2, 
  Users, 
  Copy, 
  Plus, 
  X, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Info 
} from "lucide-react";

// ✅ เพิ่ม Header
import Header from "../components/Header";

import { tripAPI } from "../services/api";

// ✅ เพิ่ม BudgetPriority
import { 
  MOCK_TRIP_DATA, 
  TripData as TripDataFull, 
  Member, 
  DateRange, 
  BudgetPriority 
} from "../data/mockData";

import { CONFIG, log } from '../config/app.config';

// ✅ Import formatCurrency จาก helpers
import { formatCurrency } from '../utils/helpers';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ============ TYPES ============
type TripData = TripDataFull;

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

// ============ CONSTANTS ============
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

const MAX_TOTAL_BUDGET = 1000000;
const MAX_PER_CATEGORY = 100000;
const EDIT_COOLDOWN_MS = 2 * 60 * 1000;

// ============================================================================
// VotePage.tsx - PART 2/7: HELPER FUNCTIONS & HOOKS
// ============================================================================

// ✅ ลบฟังก์ชัน formatCurrency ออก (ใช้จาก helpers แทน)

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

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debounced;
};

// ============================================================================
// VotePage.tsx - PART 3/7: SHARED COMPONENTS (RangeBar, TripProgress, OwnerControls)
// ============================================================================

// ============ RANGEBAR COMPONENT ============
interface RangeBarProps {
  stats: BudgetStats;
  label: string;
  color?: string;
  currentValue?: number;
}

const RangeBar: React.FC<RangeBarProps> = ({ 
  stats, 
  label, 
  color = "#3b82f6",
  currentValue 
}) => {
  if (stats.count === 0) {
    return (
      <div className="py-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
        ไม่มีข้อมูลสำหรับ {label}
      </div>
    );
  }

  const widthPx = 400;
  const pad = Math.max(0.05 * (stats.max - stats.min || 1), 1);
  const domainMin = stats.min - pad;
  const domainMax = stats.max + pad;
  const scale = (v: number) => ((v - domainMin) / (domainMax - domainMin)) * widthPx;
  
  const xMin = scale(stats.min);
  const xQ1 = scale(stats.q1);
  const xQ3 = scale(stats.q3);
  const xMax = scale(stats.max);
  const xMed = scale(stats.median);
  const xCurrent = currentValue !== undefined ? scale(currentValue) : null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={widthPx} height={60} className="mx-auto">
          <line 
            x1={xMin} x2={xMax} y1={30} y2={30} 
            stroke="#e0e7ff" strokeWidth={8} strokeLinecap="round"
          />
          <rect 
            x={xQ1} y={15} 
            width={Math.max(1, xQ3 - xQ1)} height={30} 
            fill={color} fillOpacity={0.2} rx={6}
          />
          <line 
            x1={xMed} x2={xMed} y1={10} y2={50} 
            stroke={color} strokeWidth={3}
          />
          {xCurrent !== null && (
            <circle 
              cx={xCurrent} cy={30} r={6} 
              fill="#ef4444" stroke="white" strokeWidth={2}
            />
          )}
          <circle cx={xMin} cy={30} r={4} fill={color} />
          <circle cx={xMax} cy={30} r={4} fill={color} />
          <text 
            x={xMed} 
            y={8} 
            textAnchor="middle" 
            className="text-xs font-semibold"
            fill={color}
          >
            ฿{formatCurrency(Math.round(stats.median))}
          </text>
        </svg>
      </div>
      
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>ต่ำสุด: ฿{formatCurrency(stats.min)}</span>
          <span>สูงสุด: ฿{formatCurrency(stats.max)}</span>
        </div>
        <div className="flex justify-between">
          <span>Q1-Q3: ฿{formatCurrency(Math.round(stats.q1))} - ฿{formatCurrency(Math.round(stats.q3))}</span>
          <span>เฉลี่ย: ฿{formatCurrency(Math.round(stats.avg))}</span>
        </div>
      </div>
    </div>
  );
};

// ============ TRIP PROGRESS COMPONENT ============
interface TripProgressProps {
  trip: TripData;
  currentMemberId: string;
}

const TripProgress: React.FC<TripProgressProps> = ({ trip, currentMemberId }) => {
  const members = trip.members || [];
  const totalMembers = members.length;

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

  Object.keys(progress).forEach(key => {
    const item = progress[key as keyof typeof progress];
    item.percentage = totalMembers > 0 ? Math.round((item.completed / totalMembers) * 100) : 0;
  });

  const overallProgress = Math.round(
    (progress.budget.percentage + 
     progress.dateVote.percentage + 
     progress.provinceVote.percentage + 
     progress.priority.percentage) / 4
  );

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

      <div className="mb-6">
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900">✏️ งานของคุณ</h4>
          <span className="text-sm text-blue-700 font-medium">
            {myTasksComplete}/{myTotalTasks} งาน
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={`flex items-center gap-2 ${myProgress.budget ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.budget ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
            <span>กรอกงบประมาณ</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.priority ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.priority ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
            <span>เลือก Priority</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.dateVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.dateVote ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
            <span>โหวตวันที่</span>
          </div>
          <div className={`flex items-center gap-2 ${myProgress.provinceVote ? 'text-green-700' : 'text-gray-600'}`}>
            {myProgress.provinceVote ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
            <span>โหวตจังหวัด</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-2">📊 ความคืบหน้ารายหมวด</h4>

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

// ============================================================================
// VotePage.tsx - PART 4/7: MAIN COMPONENT & STATE MANAGEMENT
// ============================================================================

const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();

  // ============ STATE ============
  const [step, setStep] = useState(2);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    provinceVotes: []
  });

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const displayCode = inviteCode || tripCode;

  const [memberBudget, setMemberBudget] = useState<Member | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // ============ LOAD TRIP DATA ============
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
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Loading trip data from mock');
          response = MOCK_TRIP_DATA;
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log.api('Loading trip data from API');
          response = await tripAPI.getTripDetail(tripCode);
        }
        
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        const tripData = response.data;
        
        if (tripData?.inviteCode) {
          setInviteCode(tripData.inviteCode);
        } else if (tripData?.tripCode) {
          setInviteCode(tripData.tripCode);
        } else {
          setInviteCode(tripCode);
        }
        
        setTrip(tripData);
        
        const memberId = localStorage.getItem("memberId") || "";
        let member = tripData.members.find((m: Member) => m.id === memberId) || null;
        
        if (!member && tripData.members.length > 0) {
          member = tripData.members[0];
          log.info(`No memberId found, using first member: ${member.name}`);
          localStorage.setItem("memberId", member.id);
        }
        
        if (!member) {
          member = {
            id: "temp-member-" + Date.now(),
            name: "คุณ",
            gender: "ชาย",
            role: "member",
            availability: Array(8).fill(true),
            budget: {
              accommodation: 0,
              transport: 0,
              food: 0,
              other: 0,
              lastUpdated: 0
            }
          };
          localStorage.setItem("memberId", member.id);
        }
        
        setMemberBudget(member);
        setLoading(false);
      } catch (error) {
        log.error("Error loading trip:", error);
        setError("ไม่สามารถโหลดข้อมูลทริปได้");
        setLoading(false);
        setTimeout(() => navigate("/homepage"), 3000);
      }
    };
    
    loadTripData();
  }, [tripCode, navigate]);

  // ============ COMPUTED VALUES ============
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

  // ============ HANDLERS ============
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
  const back = () => { if (step > 1) setStep(step - 1); };

  // ============================================================================
// VotePage.tsx - PART 5B/7: STEP 3 - BUDGET (Part 1/2)
// ============================================================================

// ============ STEP 2: DATE VOTING ============
const StepVote = () => {
  const [dateRanges, setDateRanges] = useState<DateRange[]>(trip.dateRanges || []);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  
  // โหลดคะแนนโหวตของตัวเอง
  useEffect(() => {
    const myVote = trip.dateVotes?.find(v => v.memberId === memberBudget?.id);
    if (myVote) {
      setMyVotes(myVote.votes);
    }
  }, [trip.dateVotes, memberBudget]);

  // ฟังก์ชันเพิ่มช่วงวันที่
  const addDateRange = async () => {
    if (!newStartDate || !newEndDate) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
      return;
    }

    if (new Date(newStartDate) > new Date(newEndDate)) {
      alert("วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return;
    }

    const newRange: DateRange = {
      id: `range-${Date.now()}`,
      memberId: memberBudget?.id || "",
      memberName: memberBudget?.name || "Unknown",
      startDate: newStartDate,
      endDate: newEndDate,
      createdAt: Date.now()
    };

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.addDateRange(tripCode, newRange);
      }

      setDateRanges(prev => [...prev, newRange]);
      setTrip(prev => ({
        ...prev,
        dateRanges: [...(prev.dateRanges || []), newRange]
      }));

      setNewStartDate("");
      setNewEndDate("");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเพิ่มช่วงวันที่");
    }
  };

  // ฟังก์ชันลบช่วงวันที่
  const removeRange = async (rangeId: string) => {
    if (!confirm("ต้องการลบช่วงวันที่นี้?")) return;

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.removeDateRange(tripCode, rangeId);
      }

      setDateRanges(prev => prev.filter(r => r.id !== rangeId));
      setTrip(prev => ({
        ...prev,
        dateRanges: prev.dateRanges?.filter(r => r.id !== rangeId) || []
      }));
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบช่วงวันที่");
    }
  };

  // ฟังก์ชันโหวต
  const toggleVote = async (rangeId: string) => {
    const newVotes = { ...myVotes, [rangeId]: !myVotes[rangeId] };
    setMyVotes(newVotes);

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.submitDateVotes?.(tripCode, newVotes);
      }

      // อัปเดต trip.dateVotes
      setTrip(prev => {
        const existingVoteIndex = prev.dateVotes?.findIndex(v => v.memberId === memberBudget?.id);
        const newVote = {
          memberId: memberBudget?.id || "",
          memberName: memberBudget?.name || "",
          votes: newVotes,
          timestamp: Date.now()
        };

        if (existingVoteIndex !== undefined && existingVoteIndex >= 0) {
          const updated = [...(prev.dateVotes || [])];
          updated[existingVoteIndex] = newVote;
          return { ...prev, dateVotes: updated };
        } else {
          return { ...prev, dateVotes: [...(prev.dateVotes || []), newVote] };
        }
      });
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกคะแนนโหวต");
      setMyVotes(myVotes); // rollback
    }
  };

  // คำนวณคะแนนโหวต
  const getVoteCount = (rangeId: string) => {
    return trip.dateVotes?.filter(v => v.votes[rangeId]).length || 0;
  };

  return (
    <div className="space-y-6">
      {/* เพิ่มช่วงวันที่ */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          เพิ่มช่วงวันที่ที่คุณว่าง
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={addDateRange}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มช่วงวันที่
        </button>
      </div>

      {/* รายการช่วงวันที่ทั้งหมด */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📅 ช่วงวันที่ที่สมาชิกเสนอ
        </h3>

        {dateRanges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>ยังไม่มีช่วงวันที่</p>
            <p className="text-sm mt-1">เพิ่มช่วงวันที่ที่คุณว่างได้เลย!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dateRanges.map((range) => {
              const voteCount = getVoteCount(range.id);
              const hasVoted = myVotes[range.id] || false;
              const isMyRange = range.memberId === memberBudget?.id;

              return (
                <div
                  key={range.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    hasVoted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">
                          {range.memberName}
                        </span>
                        {isMyRange && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            คุณ
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(range.startDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                        {" - "}
                        {new Date(range.endDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {voteCount}/{trip.members?.length || 0} คนว่าง
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVote(range.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          hasVoted
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {hasVoted ? "✓ ว่าง" : "โหวต"}
                      </button>

                      {isMyRange && (
                        <button
                          onClick={() => removeRange(range.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* สรุปผลโหวต */}
      {dateRanges.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🏆 ช่วงวันที่ที่คนว่างมากที่สุด (Top 3)
          </h3>

          {dateRanges
            .map((range) => ({
              ...range,
              votes: getVoteCount(range.id)
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3)
            .map((range, idx) => (
              <div
                key={range.id}
                className={`p-4 mb-3 rounded-lg border-2 ${
                  idx === 0
                    ? "border-yellow-400 bg-yellow-50"
                    : idx === 1
                    ? "border-gray-400 bg-gray-50"
                    : "border-orange-400 bg-orange-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(range.startDate).toLocaleDateString("th-TH", {
                          month: "short",
                          day: "numeric"
                        })}
                        {" - "}
                        {new Date(range.endDate).toLocaleDateString("th-TH", {
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        เสนอโดย {range.memberName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {range.votes}
                    </p>
                    <p className="text-sm text-gray-600">
                      /{trip.members?.length || 0} คน
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

  // ============ STEP 3: BUDGET ============
  const StepBudget = () => {
    if (!memberBudget) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-gray-500">ไม่พบข้อมูลสมาชิก</p>
        </div>
      );
    }

    const [isSaving, setIsSaving] = useState(false);
    const [priorities, setPriorities] = useState<{
      accommodation: BudgetPriority;
      transport: BudgetPriority;
      food: BudgetPriority;
    }>(
      memberBudget.budgetPriorities || {
        accommodation: 2,
        transport: 2,
        food: 2
      }
    );

    // อัปเดต Priority
    const updatePriority = async (
      category: keyof typeof priorities,
      value: BudgetPriority
    ) => {
      const newPriorities = { ...priorities, [category]: value };
      setPriorities(newPriorities);

      try {
        if (CONFIG.USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 300));
        } else {
          await tripAPI.updateBudgetPriority?.(tripCode, memberBudget.id, newPriorities);
        }

        setMemberBudget(prev => prev ? {
          ...prev,
          budgetPriorities: newPriorities
        } : null);

        setTrip(prev => ({
          ...prev,
          members: prev.members?.map(m =>
            m.id === memberBudget.id ? { ...m, budgetPriorities: newPriorities } : m
          ) || []
        }));
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการบันทึก Priority");
        setPriorities(memberBudget.budgetPriorities || priorities);
      }
    };

    // อัปเดตงบประมาณ
    const updateBudget = async (
      key: keyof Member["budget"], 
      value: number
    ): Promise<void> => {
      if (isNaN(value) || value < 0) {
        alert("กรุณากรอกตัวเลขที่ถูกต้องและไม่ติดลบ");
        return;
      }

      const requiredCategories = ["accommodation", "transport", "food"];
      if (requiredCategories.includes(key) && value <= 0) {
        alert(`${BUDGET_CATEGORIES.find(c => c.key === key)?.label} ต้องมากกว่า 0 บาท`);
        return;
      }

      if (value > MAX_PER_CATEGORY) {
        alert(`จำนวนเงินต่อหมวดไม่ควรเกิน ฿${formatCurrency(MAX_PER_CATEGORY)}`);
        return;
      }

      const currentBudget = { ...memberBudget.budget };
      const newTotal = Object.keys(currentBudget).reduce((sum, k) => {
        if (k === 'lastUpdated') return sum;
        return sum + (k === key ? value : currentBudget[k as keyof typeof currentBudget] as number);
      }, 0);

      if (newTotal > MAX_TOTAL_BUDGET) {
        alert(`งบประมาณรวมต้องไม่เกิน ฿${formatCurrency(MAX_TOTAL_BUDGET)}`);
        return;
      }

      // Cooldown check
      const nowTs = Date.now();
      const lastUpdated = memberBudget.budget.lastUpdated ?? 0;
      const timeSinceLastUpdate = nowTs - lastUpdated;

      if (lastUpdated > 0 && timeSinceLastUpdate < EDIT_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((EDIT_COOLDOWN_MS - timeSinceLastUpdate) / 60000);
        alert(`กรุณารออีก ${minutesLeft} นาทีก่อนแก้ไขอีกครั้ง`);
        return;
      }

      const oldValue = memberBudget.budget[key];
      const oldLastUpdated = memberBudget.budget.lastUpdated;

      // Optimistic update
      const updatedMember = {
        ...memberBudget,
        budget: {
          ...memberBudget.budget,
          [key]: value,
          lastUpdated: nowTs
        }
      };

      setMemberBudget(updatedMember);

      setTrip(prev => ({
        ...prev,
        members: prev.members?.map(m =>
          m.id === memberBudget.id ? updatedMember : m
        ) || []
      }));

      setIsSaving(true);

      try {
        let response;

        if (CONFIG.USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 300));
          response = { success: true };
        } else {
          response = await tripAPI.updateMemberBudget(tripCode, memberBudget.id, {
            [key]: value
          });
        }

        if (response.success) {
          const categoryLabel = BUDGET_CATEGORIES.find(c => c.key === key)?.label || key;
          setHistory(prev => [
            `${memberBudget.name} แก้ไข${categoryLabel}เป็น ฿${formatCurrency(value)} เวลา ${new Date().toLocaleTimeString("th-TH")}`,
            ...prev
          ]);
        } else {
          throw new Error(response.message || 'ไม่สามารถบันทึกได้');
        }

      } catch (err) {
        alert("เกิดข้อผิดพลาดในการบันทึกงบประมาณ กลับไปใช้ค่าเดิม");
        
        // Rollback
        const rolledBackMember = {
          ...memberBudget,
          budget: {
            ...memberBudget.budget,
            [key]: oldValue,
            lastUpdated: oldLastUpdated
          }
        };

        setMemberBudget(rolledBackMember);

        setTrip(prev => ({
          ...prev,
          members: prev.members?.map(m =>
            m.id === memberBudget.id ? rolledBackMember : m
          ) || []
        }));
      } finally {
        setIsSaving(false);
      }
    };

    const getPriorityLabel = (priority: BudgetPriority): string => {
      switch (priority) {
        case 1: return "⭐⭐⭐ สำคัญมาก";
        case 2: return "⭐⭐ สำคัญปานกลาง";
        case 3: return "⭐ สำคัญน้อย";
      }
    };

    const getPriorityColor = (priority: BudgetPriority): string => {
      switch (priority) {
        case 1: return "bg-red-100 text-red-700 border-red-300";
        case 2: return "bg-yellow-100 text-yellow-700 border-yellow-300";
        case 3: return "bg-green-100 text-green-700 border-green-300";
      }
    };

// ============================================================================
// VotePage.tsx - PART 5C/7: STEP 3 - BUDGET (Part 2/2 - UI)
// ============================================================================

    // ต่อจาก Part 5B...

    return (
      <div className="space-y-6">
        {/* แก้ไขงบประมาณ */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💰 แก้ไขงบประมาณ</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">หมวดหมู่ (* บังคับ)</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATEGORIES.map(({ key, label, color }) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-gray-800">{label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        disabled={isSaving}
                        min={0}
                        step={100}
                        value={memberBudget.budget[key]}
                        className="w-full text-right border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                        onChange={e => updateBudget(key, Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                  <td className="px-4 py-3 text-gray-800">รวมทั้งหมด</td>
                  <td className="px-4 py-3 text-right text-blue-700 text-lg">
                    ฿{formatCurrency(totalBudget)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {isSaving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">กำลังบันทึก...</span>
            </div>
          )}
        </div>

        {/* Priority Voting */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            ⭐ ระดับความสำคัญของงบประมาณ
          </h3>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-sm text-blue-800">
              💡 <strong>คำแนะนำ:</strong> เลือกว่าคุณต้องการให้งบประมาณรวมของกลุ่ม
              จัดสรรไปที่หมวดไหนมากที่สุด
            </p>
          </div>

          <div className="space-y-4">
            {(['accommodation', 'transport', 'food'] as const).map((key) => {
              const category = BUDGET_CATEGORIES.find(c => c.key === key);
              if (!category) return null;

              return (
                <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-semibold text-gray-800">
                        {category.label}
                      </span>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getPriorityColor(priorities[key])}`}>
                      {getPriorityLabel(priorities[key])}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => updatePriority(key, priority as BudgetPriority)}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          priorities[key] === priority
                            ? getPriorityColor(priority as BudgetPriority) + " border-2"
                            : "bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {getPriorityLabel(priority as BudgetPriority)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* การกระจายงบประมาณ */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 การกระจายงบประมาณของสมาชิกทั้งหมด</h3>
          
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>จุดสีแดง = งบของเรา</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-5 h-[3px] bg-blue-500"></span>
              <span>เส้นสีน้ำเงิน = ค่ากลาง (Median)</span>
            </div>
          </div>  

          {BUDGET_CATEGORIES.map(({ key, label, color }) => (
            <RangeBar
              key={key}
              stats={budgetStats[key]}
              label={label}
              color={color}
              currentValue={memberBudget.budget[key]}
            />
          ))}
        </div>

        {/* ประวัติการแก้ไข */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📝 ประวัติการแก้ไข</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-48 overflow-y-auto border border-gray-200">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีประวัติการแก้ไข</p>
            ) : (
              <ul className="text-sm space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============ STEP 4: PLACE VOTING ============
  const StepPlace = () => {
    const provinces = [
      "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร",
      "ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท",
      "ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง",
      "ตราด","ตาก","นครนายก","นครปฐม","นครพนม",
      "นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส",
      "น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์",
      "ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา",
      "พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์",
      "แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน",
      "ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง",
      "ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย",
      "ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
      "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
      "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย",
      "หนองบัวลำภู","อ่างทอง","อุดรธานี","อุทัยธานี","อุตรดิตถ์",
      "อุบลราชธานี"
    ];

  // ✅ ปรับปรุง Step 4: Place Voting - แสดงกราฟตลอดเวลา

  const weights = [3, 2, 1];
  
  const initialProvinces = trip.voteResults?.provinces || [];
  const [globalScores, setGlobalScores] = useState<{ [key: string]: number }>(() => {
    const scores: { [key: string]: number } = {};
    initialProvinces.forEach(p => {
      scores[p.name] = p.score;
    });
    return scores;
  });
  
  const [myVote, setMyVote] = useState<(string | "")[]>(["", "", ""]);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false); // ✅ ตรวจสอบว่าเคยโหวตแล้วหรือยัง
  const [voteHistory, setVoteHistory] = useState<string[]>([]);

  // ✅ โหลดข้อมูลโหวตของตัวเอง
  useEffect(() => {
    const myVoteData = trip.provinceVotes?.find(v => v.memberId === memberBudget?.id);
    if (myVoteData && myVoteData.votes) {
      setMyVote(myVoteData.votes);
      setHasVoted(true);
    }
  }, [trip.provinceVotes, memberBudget]);

  const handleSelect = (index: number, value: string) => {
    if (myVote.includes(value)) return;
    const updated = [...myVote];
    updated[index] = value;
    setMyVote(updated);
  };

  const submitVotes = async () => {
    // Validation
    const uniqueVotes = new Set(myVote);
    if (uniqueVotes.size !== 3) {
      setError("กรุณาเลือกจังหวัดที่ต่างกัน 3 จังหวัด");
      return;
    }
    if (myVote.includes("")) {
      setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
      return;
    }
    setError("");

    const oldScores = { ...globalScores };
    const wasVoted = hasVoted;

    const newScores = { ...globalScores };

    // ถ้าเคยโหวตแล้ว ให้ลบคะแนนเดิมออก
    if (hasVoted) {
      myVote.forEach((province, index) => {
        if (province) {
          newScores[province] = (newScores[province] || 0) - weights[index];
          if (newScores[province] <= 0) delete newScores[province];
        }
      });
    }

    // เพิ่มคะแนนใหม่
    myVote.forEach((province, index) => {
      if (province) {
        newScores[province] = (newScores[province] || 0) + weights[index];
      }
    });

    setGlobalScores(newScores);
    setHasVoted(true);

    const logEntry = `คุณ: 🥇${myVote[0]} 🥈${myVote[1]} 🥉${myVote[2]} (${new Date().toLocaleTimeString('th-TH')})`;
    setVoteHistory(prev => [logEntry, ...prev]);

    try {
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        response = { success: true };
      } else {
        response = await tripAPI.submitProvinceVotes(tripCode, {
          votes: myVote as string[],
          scores: newScores
        });
      }
      
      if (response.success) {
        setTrip(prev => ({
          ...prev,
          voteResults: {
            ...(prev.voteResults || {}),
            provinces: Object.entries(newScores)
              .map(([name, score]) => ({ name, score: score as number }))
              .sort((a, b) => b.score - a.score),
            dates: prev.voteResults?.dates || []
          }
        }));
        
        log.success("บันทึกผลโหวตสำเร็จ");
      }
    } catch (error: any) {
      log.error("Error saving votes:", error);
      alert("เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถบันทึกผลโหวต"));
      
      setGlobalScores(oldScores);
      setHasVoted(wasVoted);
      setVoteHistory(prev => prev.slice(1));
    }
  };

  const sortedProvinces = Object.entries(globalScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // ✅ แสดง Top 10 แทน Top 3

  return (
    <div className="space-y-6">
      {/* ส่วนโหวต */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          🗳️ เลือกจังหวัดที่อยากไป (อันดับ 1–3)
        </h2>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="font-semibold text-blue-900">วิธีคำนวณคะแนน (Borda Count):</p>
          <ul className="mt-2 space-y-1 text-blue-800 text-sm">
            <li>• อันดับ 1 = 3 คะแนน</li>
            <li>• อันดับ 2 = 2 คะแนน</li>
            <li>• อันดับ 3 = 1 คะแนน</li>
          </ul>
        </div>

        {/* ✅ แสดงสถานะการโหวต */}
        {hasVoted && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-800">
              ✓ คุณโหวตแล้ว: 🥇 {myVote[0]} • 🥈 {myVote[1]} • 🥉 {myVote[2]}
            </p>
            <p className="text-green-700 text-sm mt-1">
              คุณสามารถแก้ไขโหวตได้ตลอดเวลา
            </p>
          </div>
        )}

        {/* Dropdowns */}
        {[0, 1, 2].map(i => (
          <div key={i} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} อันดับ {i + 1} ({weights[i]} คะแนน):
            </label>
            <select
              value={myVote[i]}
              onChange={e => handleSelect(i, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
            >
              <option value="">-- เลือกจังหวัด --</option>
              {provinces.map(p => (
                <option 
                  key={p} 
                  value={p} 
                  disabled={myVote.includes(p) && myVote[i] !== p}
                >
                  {p}
                </option>
              ))}
            </select>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={submitVotes}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
        >
          {hasVoted ? "แก้ไขโหวต" : "ยืนยันโหวต"}
        </button>
      </div>

      {/* ✅ แสดงผลโหวตตลอดเวลา (ไม่จำเป็นต้องรอจนกว่าจะโหวต) */}
      {sortedProvinces.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              🏆 ผลโหวตปัจจุบัน (Real-time)
            </h3>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-800 text-sm">
              <strong>📊 อัปเดตแบบเรียลไทม์:</strong> ผลโหวตนี้แสดงคะแนนล่าสุดจากสมาชิกทั้งหมด
              {hasVoted && " (รวมคะแนนของคุณด้วย)"}
            </p>
          </div>

          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {sortedProvinces.slice(0, 3).map(([name, value], index) => (
              <div
                key={name}
                className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' :
                  index === 1 ? 'border-gray-400 bg-gray-50' :
                  'border-orange-400 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <div>
                      <p className="font-bold text-lg text-gray-800">{name}</p>
                      <p className="text-sm text-gray-600">อันดับ {index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-600">คะแนน</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedProvinces.map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                interval={0}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tie Warning */}
          {sortedProvinces.length >= 2 && sortedProvinces[0][1] === sortedProvinces[1][1] && (
            <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="font-semibold text-amber-900">⚠️ คะแนนเสมอกัน!</p>
              <p className="text-amber-800 text-sm mt-1">
                {sortedProvinces[0][0]} และ {sortedProvinces[1][0]} มีคะแนนเท่ากัน! 
                แนะนำให้สมาชิกที่ยังไม่ได้โหวตเข้ามาโหวตเพิ่ม
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ แสดง Message เมื่อยังไม่มีใครโหวต */}
      {sortedProvinces.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <div className="text-gray-400 mb-3">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-lg font-semibold text-gray-600 mb-2">
            ยังไม่มีใครโหวต
          </p>
          <p className="text-sm text-gray-500">
            เป็นคนแรกที่เลือกจังหวัดที่อยากไปกัน!
          </p>
        </div>
      )}

      {/* Vote History */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📝 ประวัติการโหวต</h3>
        <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
          {voteHistory.length > 0 ? (
            voteHistory.map((entry, idx) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">{entry}</p>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติการโหวต</p>
          )}
        </div>
      </div>
    </div>
  );
};

  // ============ STEP 5: SUMMARY ============

  const StepSummary = () => {
    const [showPreview, setShowPreview] = useState(false);

    // สถิติสมาชิก
    const memberStats = {
      total: trip.members?.length || 0,
      completedBudget: trip.members?.filter(m => 
        m.budget.accommodation > 0 && 
        m.budget.transport > 0 && 
        m.budget.food > 0
      ).length || 0,
      votedProvince: trip.provinceVotes?.length || 0,
      votedDate: trip.dateVotes?.length || 0
    };

    const allDataComplete = 
      memberStats.completedBudget === memberStats.total &&
      memberStats.votedProvince === memberStats.total &&
      memberStats.votedDate === memberStats.total;

    const handleCloseVoting = async () => {
      // ตรวจสอบความครบถ้วน
      if (!allDataComplete) {
        alert(`⚠️ ข้อมูลยังไม่ครบ!\n\n` +
          `งบประมาณ: ${memberStats.completedBudget}/${memberStats.total} คน\n` +
          `โหวตจังหวัด: ${memberStats.votedProvince}/${memberStats.total} คน\n` +
          `โหวตวันที่: ${memberStats.votedDate}/${memberStats.total} คน\n\n` +
          `กรุณาให้ทุกคนกรอกข้อมูลให้ครบก่อนปิดการโหวต`
        );
        return;
      }

      if (!confirm(
        "ต้องการปิดการโหวตและบันทึกผลหรือไม่?\n\n" +
        "⚠️ เมื่อปิดแล้ว สมาชิกจะไม่สามารถแก้ไขข้อมูลได้อีก"
      )) {
        return;
      }
      
      try {
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Closing trip (mock)');
          await new Promise(resolve => setTimeout(resolve, 500));
          response = { success: true };
        } else {
          log.api('Closing trip via API');
          response = await tripAPI.closeTrip(tripCode);
        }
        
        if (response.success) {
          alert("✓ ปิดการโหวตเรียบร้อย! กำลังนำไปหน้าสรุปผล...");
          navigate(`/summaryPage/${tripCode}`);
        } else {
          throw new Error(response.message || 'ไม่สามารถปิดการโหวตได้');
        }
      } catch (error: any) {
        log.error("Error closing trip:", error);
        alert("เกิดข้อผิดพลาดในการปิดการโหวต");
      }
    };

    // คำนวณ Top 3 วันที่
    const topDates = (trip.dateRanges || [])
      .map(range => ({
        ...range,
        votes: trip.dateVotes?.filter(v => v.votes[range.id]).length || 0
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);

    // คำนวณ Top 3 จังหวัด
    const topProvinces = (trip.voteResults?.provinces || []).slice(0, 3);

    // คำนวณงบประมาณเฉลี่ย
    const avgBudget = {
      accommodation: 0,
      transport: 0,
      food: 0,
      other: 0,
      total: 0
    };

    if (trip.members && trip.members.length > 0) {
      trip.members.forEach(m => {
        avgBudget.accommodation += m.budget.accommodation;
        avgBudget.transport += m.budget.transport;
        avgBudget.food += m.budget.food;
        avgBudget.other += m.budget.other;
      });

      Object.keys(avgBudget).forEach(key => {
        avgBudget[key as keyof typeof avgBudget] /= trip.members!.length;
      });

      avgBudget.total = avgBudget.accommodation + avgBudget.transport + avgBudget.food + avgBudget.other;
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            ✅ พร้อมปิดการโหวตหรือยัง?
          </h2>
          
          {/* สถานะความครบถ้วน */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 ${
              memberStats.completedBudget === memberStats.total
                ? 'border-green-500 bg-green-50'
                : 'border-amber-500 bg-amber-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">งบประมาณ</div>
                  <div className="text-2xl font-bold">
                    {memberStats.completedBudget}/{memberStats.total}
                  </div>
                </div>
                {memberStats.completedBudget === memberStats.total ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              memberStats.votedProvince === memberStats.total
                ? 'border-green-500 bg-green-50'
                : 'border-amber-500 bg-amber-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">โหวตจังหวัด</div>
                  <div className="text-2xl font-bold">
                    {memberStats.votedProvince}/{memberStats.total}
                  </div>
                </div>
                {memberStats.votedProvince === memberStats.total ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              memberStats.votedDate === memberStats.total
                ? 'border-green-500 bg-green-50'
                : 'border-amber-500 bg-amber-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">โหวตวันที่</div>
                  <div className="text-2xl font-bold">
                    {memberStats.votedDate}/{memberStats.total}
                  </div>
                </div>
                {memberStats.votedDate === memberStats.total ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>
            </div>
          </div>

          {/* คำเตือน */}
          {!allDataComplete && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
              <p className="font-semibold text-amber-900 mb-2">⚠️ ข้อมูลยังไม่ครบ!</p>
              <p className="text-amber-800 text-sm">
                กรุณาให้สมาชิกที่ยังไม่ได้กรอกข้อมูลเข้ามากรอกให้ครบก่อนปิดการโหวต
              </p>
            </div>
          )}

          {allDataComplete && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <p className="font-semibold text-green-900 mb-2">✓ ข้อมูลครบแล้ว!</p>
              <p className="text-green-800 text-sm">
                สมาชิกทุกคนกรอกข้อมูลครบถ้วนแล้ว สามารถปิดการโหวตและดูผลสรุปได้
              </p>
            </div>
          )}

          {/* ปุ่ม Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full mb-4 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            {showPreview ? "ซ่อน" : "แสดง"} Preview ผลสรุป
            {showPreview ? "↑" : "↓"}
          </button>

          {/* ปุ่มปิดการโหวต */}
          <button
            onClick={handleCloseVoting}
            disabled={!allDataComplete}
            className={`w-full px-6 py-4 rounded-lg font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${
              allDataComplete
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="text-xl">✓</span>
            ปิดการโหวตและดูผลสรุป
          </button>

          {!allDataComplete && (
            <p className="text-center text-gray-500 text-sm mt-2">
              ต้องให้สมาชิกทุกคนกรอกข้อมูลครบก่อนถึงจะปิดการโหวตได้
            </p>
          )}
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-6">
            {/* Top 3 วันที่ */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📅 Top 3 วันที่ที่ทุกคนว่าง
              </h3>
              {topDates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topDates.map((date, idx) => (
                    <div
                      key={date.id}
                      className={`p-4 rounded-lg border-2 ${
                        idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                        idx === 1 ? 'border-gray-400 bg-gray-50' :
                        'border-orange-400 bg-orange-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {new Date(date.startDate).toLocaleDateString('th-TH')}
                          {' - '}
                          {new Date(date.endDate).toLocaleDateString('th-TH')}
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                          {date.votes}/{memberStats.total} คน
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">ยังไม่มีข้อมูลวันที่</p>
              )}
            </div>

            {/* Top 3 จังหวัด */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🗺️ Top 3 จังหวัดยอดนิยม
              </h3>
              {topProvinces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topProvinces.map((province, idx) => (
                    <div
                      key={province.name}
                      className={`p-4 rounded-lg border-2 ${
                        idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                        idx === 1 ? 'border-gray-400 bg-gray-50' :
                        'border-orange-400 bg-orange-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="text-lg font-bold text-gray-800 mb-1">
                          {province.name}
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          {province.score} คะแนน
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">ยังไม่มีข้อมูลจังหวัด</p>
              )}
            </div>

            {/* งบประมาณเฉลี่ย */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                💰 งบประมาณเฉลี่ยต่อคน
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">ค่าที่พัก</span>
                  <span className="font-bold text-blue-600">
                    ฿{formatCurrency(Math.round(avgBudget.accommodation))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">ค่าเดินทาง</span>
                  <span className="font-bold text-purple-600">
                    ฿{formatCurrency(Math.round(avgBudget.transport))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">ค่าอาหาร</span>
                  <span className="font-bold text-green-600">
                    ฿{formatCurrency(Math.round(avgBudget.food))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">เงินสำรอง</span>
                  <span className="font-bold text-amber-600">
                    ฿{formatCurrency(Math.round(avgBudget.other))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
                  <span className="font-bold">รวมทั้งหมด</span>
                  <span className="text-2xl font-bold">
                    ฿{formatCurrency(Math.round(avgBudget.total))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============ OWNER CONTROLS ============
const OwnerControls = () => {
  const isOwner = memberBudget?.role === 'owner';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);

  if (!isOwner) return null;

  const handleDeleteTrip = async () => {
    if (!confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้?\n\nการลบจะไม่สามารถกู้คืนได้")) {
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 500));
      } else {
        await tripAPI.deleteTrip(tripCode);
      }

      alert("✓ ลบทริปเรียบร้อยแล้ว");
      navigate("/homepage");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบทริป");
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`ต้องการลบ "${memberName}" ออกจากทริป?`)) {
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.deleteMember(tripCode, memberId);
      }

      setTrip(prev => ({
        ...prev,
        members: prev.members?.filter(m => m.id !== memberId) || []
      }));

      alert(`✓ ลบ "${memberName}" ออกจากทริปแล้ว`);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบสมาชิก");
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            👑 เจ้าของทริป
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            ตัวเลือกสำหรับเจ้าของ
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setShowMemberList(!showMemberList)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
        >
          <Users className="w-5 h-5" />
          จัดการสมาชิก ({trip.members?.length || 0})
        </button>

        <button
          onClick={handleDeleteTrip}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
        >
          <X className="w-5 h-5" />
          ลบทริปนี้
        </button>
      </div>

      {/* Member List Modal */}
      {showMemberList && (
        <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">รายชื่อสมาชิก</h4>
          <div className="space-y-2">
            {trip.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'owner' ? '👑 เจ้าของ' : 'สมาชิก'}
                    </p>
                  </div>
                </div>

                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

  const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
        <OwnerControls />
        
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

        <div className="mb-8">
          {step === 2 && <StepVote />}
          {step === 3 && <StepBudget />}
          {step === 4 && <StepPlace />}
          {step === 5 && <StepSummary />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={back}
            disabled={step === 1}
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