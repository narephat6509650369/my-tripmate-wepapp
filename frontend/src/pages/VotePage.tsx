import React, { useState, useEffect, useMemo } from "react"; 
import { Check, X, Copy, Plus, Info } from "lucide-react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

// ---------------- Interfaces ----------------
interface Member {
  id: string;
  name: string;
  gender: "ชาย" | "หญิง";
  availability: boolean[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
    lastUpdated: number;
  };
}

interface TripData {
  members: Member[];
  voteOptions: string[];
  selectedDate: string | null;
}

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

// ---------------- Constants ----------------
const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

const MAX_TOTAL_BUDGET = 1000000;
const EDIT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// ---------------- Helper Functions ----------------
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH').format(amount);
};

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

const formatThaiDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const thaiYear = date.getFullYear() + 543;
  return `${date.getDate()}/${date.getMonth() + 1}/${thaiYear}`;
};

// ---------------- RangeBar Component ----------------
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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={widthPx} height={60} className="mx-auto">
          {/* Background line */}
          <line 
            x1={xMin} x2={xMax} y1={30} y2={30} 
            stroke="#e0e7ff" strokeWidth={8} strokeLinecap="round"
          />
          
          {/* IQR box */}
          <rect 
            x={xQ1} y={15} 
            width={Math.max(1, xQ3 - xQ1)} height={30} 
            fill={color} fillOpacity={0.2} rx={6}
          />
          
          {/* Median line */}
          <line 
            x1={xMed} x2={xMed} y1={10} y2={50} 
            stroke={color} strokeWidth={3}
          />
          
          {/* Current value indicator */}
          {xCurrent !== null && (
            <circle 
              cx={xCurrent} cy={30} r={6} 
              fill="#ef4444" stroke="white" strokeWidth={2}
            />
          )}
          
          {/* Min/Max markers */}
          <circle cx={xMin} cy={30} r={4} fill={color} />
          <circle cx={xMax} cy={30} r={4} fill={color} />
          
          {/* Median label */}
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
      
      <div className="mt-2 text-xs text-gray-600 space-y-1">
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

// ---------------- Main Component ----------------
const VotePage: React.FC = () => {
  const tripCode = "178536A";
  const [step, setStep] = useState(2);
  const [copied, setCopied] = useState<string | null>(null);

  const navigate = useNavigate();

  const goHome = () => {
    navigate("/homepage");
  };

  // Mock data
  const mockMembers: Member[] = [
    { 
      id: "1", name: "สมชาย", gender: "ชาย", 
      availability: [true, true, false, true, false, true, true, false], 
      budget: { accommodation: 1500, transport: 200, food: 2300, other: 0, lastUpdated: 0 } 
    },
    { 
      id: "2", name: "สมหญิง", gender: "หญิง", 
      availability: [false, true, true, false, true, true, false, true], 
      budget: { accommodation: 1200, transport: 150, food: 2000, other: 0, lastUpdated: 0 } 
    },
    { 
      id: "3", name: "สมศรี", gender: "หญิง", 
      availability: [true, true, true, true, true, true, true, true], 
      budget: { accommodation: 1800, transport: 300, food: 2500, other: 500, lastUpdated: 0 } 
    },
  ];

  const [trip, setTrip] = useState<TripData>({ 
    members: mockMembers, 
    voteOptions: [], 
    selectedDate: null 
  });

  const [memberBudget, setMemberBudget] = useState<Member>(mockMembers[0]);
  const [history, setHistory] = useState<string[]>([]);

  const debouncedMember = useDebounce(memberBudget, 1000);

  // Calculate aggregate statistics
  const budgetStats = useMemo(() => {
    const result: Record<string, BudgetStats> = {};
    BUDGET_CATEGORIES.forEach(({ key }) => {
      const values = trip.members.map(m => m.budget[key]);
      result[key] = getSummary(values);
    });
    return result;
  }, [trip.members, debouncedMember]);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return BUDGET_CATEGORIES.reduce((sum, { key }) => sum + memberBudget.budget[key], 0);
  }, [memberBudget]);

  // Copy handlers
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Navigation
  const next = () => { if (step < 5) setStep(step + 1); };
  const back = () => { if (step > 1) setStep(step - 1); };

  // ---------------- Vote Step ----------------
  const StepVote = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [dates, setDates] = useState<string[]>(["5/11/2568", "6/11/2568", "18/11/2568"]);
    const dateHeaders = ["1 พย", "2 พย", "5 พย", "6 พย", "10 พย", "11 พย", "17 พย", "18 พย"];

    const addVoteDate = () => {
      if (!selectedDate) return;
      const formatted = formatThaiDate(selectedDate);
      if (!dates.includes(formatted)) {
        setDates(prev => [...prev, formatted]);
      }
      setSelectedDate("");
    };

    const availableCount = dateHeaders.map((_, colIdx) => 
      trip.members.filter(m => m.availability[colIdx]).length
    );

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">ตารางความว่าง</h2>
          <Info className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-center">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="py-3 px-4 border-b-2 border-blue-400 text-left sticky left-0 bg-blue-500">
                  ชื่อสมาชิก
                </th>
                {dateHeaders.map((d, idx) => (
                  <th key={d} className="py-3 px-2 border-b-2 border-blue-400">
                    <div>{d}</div>
                    <div className="text-xs font-normal opacity-90">
                      ({availableCount[idx]}/{trip.members.length})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trip.members.map((m, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 border-b border-gray-200 text-left sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        m.gender === "ชาย" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-pink-100 text-pink-700"
                      }`}>
                        {m.gender}
                      </span>
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </td>
                  {m.availability.map((a, i) => (
                    <td key={i} className="py-3 border-b border-gray-200">
                      <div className="flex justify-center">
                        <div className={`${
                          a ? "bg-green-100" : "bg-red-100"
                        } rounded-full p-1.5`}>
                          {a ? (
                            <Check className="text-green-600 w-5 h-5" />
                          ) : (
                            <X className="text-red-600 w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            เพิ่มวันที่โหวต
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="date" 
              className="border-2 border-blue-300 rounded-lg px-4 py-3 flex-1 focus:border-blue-500 focus:outline-none" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button 
              onClick={addVoteDate} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDate}
            >
              เพิ่มโหวต
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {dates.map((d, i) => (
              <span 
                key={i} 
                className="px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded-full text-blue-900 font-medium transition-colors cursor-pointer"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ---------------- Budget Step ----------------
  const StepBudget = () => {
    const updateBudget = (key: keyof Member["budget"], value: number) => {

      if (["accommodation", "transport", "food"].includes(key) && value === 0) {
      alert("กรุณากรอกจำนวนเงินในหมวดนี้ (ห้ามเว้นว่าง)");
      return;
    }

      if (!memberBudget) return;

      // Validation
      if (value < 0) {
        alert("จำนวนเงินต้องมากกว่าหรือเท่ากับ 0");
        return;
      }

      const newBudget = { ...memberBudget.budget, [key]: value };
      const sum = BUDGET_CATEGORIES.reduce((acc, { key: k }) => acc + newBudget[k], 0);

      if (sum > MAX_TOTAL_BUDGET) {
        alert(`งบประมาณรวมต้องไม่เกิน ฿${formatCurrency(MAX_TOTAL_BUDGET)}`);
        return;
      }

      const nowTs = Date.now();
      const timeSinceLastUpdate = nowTs - newBudget.lastUpdated;
      
      if (newBudget.lastUpdated > 0 && timeSinceLastUpdate < EDIT_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((EDIT_COOLDOWN_MS - timeSinceLastUpdate) / 60000);
        alert(`กรุณารออีก ${minutesLeft} นาทีก่อนแก้ไขอีกครั้ง`);
        return;
      }

      const updatedBudget = { ...newBudget, lastUpdated: nowTs };
      setMemberBudget(prev => prev ? { ...prev, budget: updatedBudget } : prev);
      
      const categoryLabel = BUDGET_CATEGORIES.find(c => c.key === key)?.label || key;
      setHistory(prev => [
        `${memberBudget.name} แก้ไข${categoryLabel}เป็น ฿${formatCurrency(value)} เวลา ${new Date().toLocaleTimeString('th-TH')}`,
        ...prev
      ]);

      setTrip(prev => ({
        ...prev,
        members: prev.members.map(m => 
          m.id === memberBudget.id ? { ...m, budget: updatedBudget } : m
        )
      }));
    };

    return (
      <div className="space-y-6">
        {/* Budget Comparison Charts */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">การกระจายงบประมาณของสมาชิกทั้งหมด</h3>
          
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>จุดสีแดง = งบของเรา</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-[3px] bg-blue-500"></span>
              <span>เส้นสีน้ำเงิน = ค่ากึ่งกลาง (Median) ของสมาชิกทั้งหมด</span>
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

        {/* Budget Input Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">แก้ไขงบประมาณ</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border text-left font-semibold text-gray-700">หมวดหมู่ (* บังคับ)</th>
                  <th className="py-3 px-4 border text-right font-semibold text-gray-700">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATEGORIES.map(({ key, label, color }) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium">{label}</span>
                      </div>
                    </td>
                    <td className="border px-4 py-3">
                      <input 
                        type="number" 
                        min={0}
                        step={100}
                        value={memberBudget.budget[key]}
                        className="w-full text-right border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                        onChange={e => updateBudget(key, Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td className="border px-4 py-3">รวมทั้งหมด</td>
                  <td className="border px-4 py-3 text-right text-blue-700">
                    ฿{formatCurrency(totalBudget)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* History Log */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-3">ประวัติการแก้ไข</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-48 overflow-y-auto">
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

  // Step configuration
  const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Header /> 

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            ← กลับไปหน้าหลัก
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                copied === 'code' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(tripCode, 'code')}
            >
              {tripCode}
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
        {/* Step Progress Indicator */}
        <div className="mb-12">
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
            {/* Progress bar fill */}
            <div 
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
            
            {/* Step circles */}
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
          {step === 2 && <StepVote />}
          {step === 3 && <StepBudget />}
        </div>

        {/* Navigation Buttons */}
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
