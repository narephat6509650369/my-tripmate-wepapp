  import React, { useState, useEffect, useMemo } from "react"; 
  import { Check, X, Copy, Plus, Info } from "lucide-react";
  import Header from "../components/Header";
  import { useNavigate, useParams } from "react-router-dom";
  import { tripAPI } from "../services/api";
 
  import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } from "recharts";

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
    const { tripCode: urlTripCode } = useParams<{ tripCode: string }>();
    const tripCode = urlTripCode || "UNKNOWN";

    const [step, setStep] = useState(2);
    const [copied, setCopied] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleLogout = () => {
      localStorage.removeItem("jwtToken");
      navigate("/");
    };

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

    // โหลดข้อมูลทริปและตรวจสอบ
    useEffect(() => {
      const loadTripData = async () => {
        if (tripCode === "UNKNOWN") {
          alert("ไม่พบรหัสทริป");
          navigate("/homepage");
          return;
        }

        try {
          // เรียก API แทน localStorage
          const response = await tripAPI.getTripDetail(tripCode);
          
          if (!response || !response.success) {
            throw new Error('ไม่พบข้อมูลทริป');
          }

          const tripData = response.data;
          
          setTrip({
            members: tripData.members || [],
            voteOptions: tripData.voteOptions || [],
            selectedDate: tripData.selectedDate || null
          });
          
          if (tripData.isCompleted) {
            alert("ทริปนี้ปิดการโหวตแล้ว กำลังนำไปหน้าสรุปผล...");
            navigate(`/summaryPage/${tripCode}`);
            return;
          }
        } catch (error) {
          console.error("Error loading trip:", error);
          alert("ไม่สามารถโหลดข้อมูลทริปได้");
          navigate("/homepage");
        }
      };
      
      loadTripData();
    }, [tripCode, navigate]);

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

          <div className="overflow-x-auto relative">
            <table className="w-full min-w-[700px] border-collapse">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-4 border-b-2 border-blue-400 text-left sticky left-0 bg-blue-500 z-20">
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
                    <td className="py-3 px-4 border-b border-gray-200 text-left sticky left-0 bg-white z-10">
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

      // เช็คให้ครอบคลุมมากขึ้น
      if (["accommodation", "transport", "food"].includes(key)) {
        if (value === 0 || isNaN(value)) {
          alert(`กรุณากรอกจำนวนเงินใน${BUDGET_CATEGORIES.find(c => c.key === key)?.label || key}`);
          return;
        }
      }

      // เพิ่มการตรวจสอบค่าสูงสุดต่อหมวด
      const MAX_PER_CATEGORY = 100000; // ตัวอย่าง
        if (value > MAX_PER_CATEGORY) {
          alert(`จำนวนเงินต่อหมวดไม่ควรเกิน ฿${formatCurrency(MAX_PER_CATEGORY)}`);
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

    // ---------------- STEP 4: PLACE VOTING ----------------
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

      const weights = [3, 2, 1];
      const [globalScores, setGlobalScores] = useState<{ [key: string]: number }>({});
      const [dateVotes, setDateVotes] = useState<{ [key: string]: number }>({});
      const [myVote, setMyVote] = useState<(string | "")[]>(["", "", ""]);
      const [error, setError] = useState("");
      const [submitted, setSubmitted] = useState(false);
      const [voteHistory, setVoteHistory] = useState<string[]>([]);

      const handleSelect = (index: number, value: string) => {
        if (myVote.includes(value)) return;
        const updated = [...myVote];
        updated[index] = value;
        setMyVote(updated);
      };

      const submitDateVote = (selectedDate: string) => {
        setDateVotes(prev => ({
          ...prev,
          [selectedDate]: (prev[selectedDate] || 0) + 1
        }));
      };

      const submitVotes = async () => {  // ← เพิ่ม async
        if (myVote.includes("")) {
          setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
          return;
        }
        setError("");

        const newScores = { ...globalScores };

        if (submitted) {
          myVote.forEach((province, index) => {
            newScores[province] = (newScores[province] || 0) - weights[index];
            if (newScores[province] <= 0) delete newScores[province];
          });
        }

        myVote.forEach((province, index) => {
          newScores[province] = (newScores[province] || 0) + weights[index];
        });

        setGlobalScores(newScores);
        setSubmitted(true);

        const logEntry = `คุณ: 🥇${myVote[0]} 🥈${myVote[1]} 🥉${myVote[2]}`;
        setVoteHistory(prev => [logEntry, ...prev]);

        // ส่งผลโหวตไปยัง Backend
        try {
          const response = await tripAPI.submitProvinceVotes(tripCode, {
            votes: myVote,
            scores: newScores
          });
          
          if (response.success) {
            console.log("บันทึกผลโหวตสำเร็จ");
          }
        } catch (error) {
          console.error("Error saving votes:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกผลโหวต");
        }
      };

      const sortedProvinces = Object.entries(globalScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            เลือกจังหวัดที่อยากไป (อันดับ 1–3)
          </h2>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="font-semibold text-blue-900">วิธีคำนวณคะแนน (Borda Count):</p>
            <ul className="mt-2 space-y-1 text-blue-800">
              <li>• อันดับ 1 = 3 คะแนน</li>
              <li>• อันดับ 2 = 2 คะแนน</li>
              <li>• อันดับ 3 = 1 คะแนน</li>
            </ul>
          </div>

          {[0,1,2].map(i => (
            <div key={i} className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {i===0?'🥇':i===1?'🥈':'🥉'} อันดับ {i+1} ({weights[i]} คะแนน):
              </label>
              <select
                value={myVote[i]}
                onChange={e => handleSelect(i, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="">-- เลือกจังหวัด --</option>
                {provinces.map(p => (
                  <option key={p} value={p} disabled={myVote.includes(p) && myVote[i] !== p}>{p}</option>
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
            {submitted ? "แก้ไขโหวต" : "ยืนยันโหวต"}
          </button>

          <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800 flex items-center">
            <span className="mr-2">🏆</span> Top 3 จังหวัด
          </h3>

          {sortedProvinces.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {sortedProvinces.map(([name, value], index) => (
                  <div
                    key={name}
                    className={`p-4 rounded-lg border-2 ${
                      index===0 ? 'border-yellow-400 bg-yellow-50' :
                      index===1 ? 'border-gray-400 bg-gray-50' :
                      'border-orange-400 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{index===0?'🥇':index===1?'🥈':'🥉'}</span>
                        <div>
                          <p className="font-bold text-lg text-gray-800">{name}</p>
                          <p className="text-sm text-gray-600">อันดับ {index+1}</p>
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

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedProvinces.map(([name,value])=>({name,value}))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>

              {sortedProvinces.length >= 2 &&
                sortedProvinces[0][1] === sortedProvinces[1][1] && (
                  <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="font-semibold text-amber-900">⚠️ คะแนนเสมอกัน!</p>
                    <p className="text-amber-800 text-sm mt-1">คะแนนอันดับ 1 เสมอกัน! แนะนำให้โหวตเพิ่ม</p>
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">ยังไม่มีการโหวต</p>
              <p className="text-sm mt-2">กรุณาเลือกจังหวัดและกดยืนยันโหวต</p>
            </div>
          )}

          {/* Log History */}
          <div className="mt-6">
            <h4 className="font-bold mb-2 text-gray-700">ประวัติการโหวต</h4>
            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
              {voteHistory.length > 0 ? voteHistory.map((entry, idx)=>(
                <p key={idx} className="text-sm text-gray-800">{entry}</p>
              )) : (
                <p className="text-gray-400 text-sm">ยังไม่มีประวัติการโหวต</p>
              )}
            </div>
          </div>
        </div>
      );
    };

    // ---------------- STEP 5: SUMMARY ----------------
    const StepSummary = () => {
      const handleCloseVoting = async () => {  // ← เพิ่ม async
      // เช็คงบประมาณก่อน
      const incompleteBudgets = trip.members.filter(m => 
        m.budget.accommodation === 0 || 
        m.budget.transport === 0 || 
        m.budget.food === 0
      );

      if (incompleteBudgets.length > 0) {
        alert(`ยังมีสมาชิก ${incompleteBudgets.length} คนที่ยังกรอกงบประมาณไม่ครบ!\n\nกรุณาให้ทุกคนกรอกข้อมูลให้ครบก่อน`);
        return;
      }

      if (!confirm("ต้องการปิดการโหวตและบันทึกผลหรือไม่?\n\nเมื่อปิดแล้ว สมาชิกจะไม่สามารถแก้ไขข้อมูลได้อีก")) {
        return;
      }
      
      try {
        const response = await tripAPI.closeTrip(tripCode);
        
        if (response.success) {
          alert("ปิดการโหวตเรียบร้อย! กำลังนำไปหน้าสรุปผล...");
          navigate(`/summaryPage/${tripCode}`);
        } else {
          throw new Error(response.message || 'ไม่สามารถปิดการโหวตได้');
        }
      } catch (error) {
        console.error("Error closing trip:", error);
        alert("เกิดข้อผิดพลาดในการปิดการโหวต");
      }
    };

      return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">พร้อมปิดการโหวตหรือยัง?</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="font-semibold text-blue-900 mb-2">📋 สิ่งที่ควรตรวจสอบก่อนปิดการโหวต:</p>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✓ สมาชิกกรอกข้อมูลความว่างครบแล้ว (Step 2)</li>
              <li>✓ สมาชิกกรอกงบประมาณครบแล้ว (Step 3)</li>
              <li>✓ สมาชิกโหวตเลือกจังหวัดครบแล้ว (Step 4)</li>
            </ul>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
            <p className="font-semibold text-amber-900 mb-2">⚠️ คำเตือน:</p>
            <p className="text-amber-800 text-sm">
              เมื่อปิดการโหวตแล้ว สมาชิกจะไม่สามารถแก้ไขข้อมูลได้อีก 
              และระบบจะสร้างหน้าสรุปผลให้อัตโนมัติ
            </p>
          </div>

          <button
            onClick={handleCloseVoting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
          >
            <span className="text-xl">✓</span>
            ปิดการโหวตและดูผลสรุป
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            หรือกลับไปแก้ไขข้อมูลในขั้นตอนก่อนหน้า
          </p>
        </div>
      );
    };

    // Step configuration
    const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <Header onLogout={handleLogout} />
        {/* Trip Code and Share */}
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
                onClick={() => handleCopy(tripCode, 'code')}
                title="คลิกเพื่อคัดลอกรหัสห้อง"
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
            {step === 4 && <StepPlace />}
            {step === 5 && <StepSummary />}
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