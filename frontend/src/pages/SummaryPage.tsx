import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Calendar, Users, DollarSign, MapPin, Sparkles, Check, X, Loader2 } from "lucide-react";
import Header from "../components/Header";
import { tripAPI } from "../services/api";
import { CONFIG, log } from '../config/app.config';
import { getMockSummaryData, Member, TripData } from "../data/mockData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก', color: '#3b82f6' },
  { key: 'transport' as const, label: 'ค่าเดินทาง', color: '#8b5cf6' },
  { key: 'food' as const, label: 'ค่าอาหาร', color: '#10b981' },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b' }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH').format(amount);
};

const getMedian = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
};

const SummaryPage: React.FC = () => {
  const { tripCode } = useParams<{ tripCode: string }>();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false); // ✅ เพิ่ม state สำหรับ toggle

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/");
  };

  // โหลดข้อมูลทริป
  useEffect(() => {
    const loadTripSummary = async () => {
      if (!tripCode) {
        alert("ไม่พบรหัสทริป");
        navigate("/homepage");
        return;
      }

      try {
        setLoading(true);
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Loading trip summary from mock');
          response = getMockSummaryData(); 
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log.api('Loading trip summary from API');
          response = await tripAPI.getTripDetail(tripCode);
        }

        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        setTripData(response.data);
        log.success("โหลดข้อมูลสรุปผล:", response.data);
      } catch (error) {
        log.error("Error loading trip:", error);
        alert("ไม่สามารถโหลดข้อมูลทริปได้");
        navigate("/homepage");
      } finally {
        setLoading(false);
      }
    };

    loadTripSummary();
  }, [tripCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลสรุปผล...</p>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">ไม่พบข้อมูลทริป</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (!tripData.isCompleted || !tripData.closedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">ทริปนี้ยังไม่ได้ปิดการโหวต</p>
          <button
            onClick={() => navigate(`/votepage/${tripCode}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            ไปหน้าโหวต
          </button>
        </div>
      </div>
    );
  }

  const members = tripData.members || [];
  const voteResults = tripData.voteResults || { provinces: [], dates: [] };

  if (members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">ไม่พบข้อมูลสมาชิกในทริป</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const dateHeaders = ["1 พย", "2 พย", "5 พย", "6 พย", "10 พย", "11 พย", "17 พย", "18 พย"];
  
  const dateAvailability = dateHeaders.map((date: string, idx: number) => ({
    date,
    available: members.filter((m: Member) => m.availability?.[idx] === true).length, 
    total: members.length
  })).sort((a, b) => b.available - a.available);

  const budgetStats = BUDGET_CATEGORIES.map(({ key, label, color }) => {
    const values = members.map((m: Member) => m.budget[key]);
    const median = getMedian(values);
    const total = values.reduce((a: number, b: number) => a + b, 0);
    return { key, label, color, median, total, values };
  });

  const totalMedian = budgetStats.reduce((sum, stat) => sum + stat.median, 0);
  const topProvinces = voteResults?.provinces?.slice(0, 3) || [];

  const generateAIPrompt = () => {
    const maleCount = members.filter(m => m.gender === "ชาย").length;
    const femaleCount = members.filter(m => m.gender === "หญิง").length;
    const topDate = dateAvailability[0];
    const duration = `${tripData.days} วัน`;

    // ✅ คำนวณ Priority เฉลี่ย
    const calculateAvgPriority = () => {
      const membersWithPriorities = members.filter(m => m.budgetPriorities);
      
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
    };

    const avgPriorities = calculateAvgPriority();

    // ✅ ฟังก์ชันแปลง Priority เป็น Text
    const getPriorityText = (priority: number): string => {
      if (priority <= 1.5) return "⭐⭐⭐ สำคัญมาก";
      if (priority <= 2.5) return "⭐⭐ ปานกลาง";
      return "⭐ สำคัญน้อย";
    };

    // ✅ หา Priority สูงสุด
    const getTopPriority = () => {
      if (!avgPriorities) return null;
      
      const priorities = [
        { name: 'ที่พัก', value: avgPriorities.accommodation },
        { name: 'เดินทาง', value: avgPriorities.transport },
        { name: 'อาหาร', value: avgPriorities.food }
      ];
      
      priorities.sort((a, b) => a.value - b.value);
      
      return priorities;
    };

    const topPriorities = getTopPriority();

    const prompt = `สวัสดีค่ะ! ฉันกำลังวางแผนทริปท่องเที่ยวกับเพื่อน ๆ และต้องการคำแนะนำจากคุณ

  📊 **ข้อมูลสรุปทริปของเรา:**

  🎯 **ชื่อทริป:** ${tripData.name}
  📝 **รายละเอียด:** ${tripData.detail || 'ไม่มีรายละเอียด'}

  👥 **สมาชิก:** ${members.length} คน${maleCount > 0 ? ` (ชาย ${maleCount} คน` : ''}${femaleCount > 0 ? `, หญิง ${femaleCount} คน)` : ')'}

  📅 **วันที่ที่เหมาะสมที่สุด:**
  - ${topDate.date} (${topDate.available}/${topDate.total} คน ว่าง - ${Math.round((topDate.available / topDate.total) * 100)}%)
  ${dateAvailability.slice(1, 3).map((d, i) => `- อันดับ ${i + 2}: ${d.date} (${d.available}/${d.total} คน)`).join('\n')}

  ⏱️ **ระยะเวลา:** ${duration}

  💰 **งบประมาณ (ค่ากลางต่อคน):**
  - ค่าที่พัก: ฿${formatCurrency(Math.round(budgetStats[0].median))}${avgPriorities ? ` (${getPriorityText(avgPriorities.accommodation)})` : ''}
  - ค่าเดินทาง: ฿${formatCurrency(Math.round(budgetStats[1].median))}${avgPriorities ? ` (${getPriorityText(avgPriorities.transport)})` : ''}
  - ค่าอาหาร: ฿${formatCurrency(Math.round(budgetStats[2].median))}${avgPriorities ? ` (${getPriorityText(avgPriorities.food)})` : ''}
  - เงินสำรอง: ฿${formatCurrency(Math.round(budgetStats[3].median))}
  - **รวมต่อคน: ฿${formatCurrency(Math.round(totalMedian))}**
  - **งบรวมทั้งกลุ่ม: ฿${formatCurrency(Math.round(totalMedian * members.length))}**
  ${avgPriorities && topPriorities ? `
  🎯 **ความสำคัญของกลุ่ม (จากการโหวต ${avgPriorities.count}/${members.length} คน):**
  ${topPriorities.map((p, i) => `${i + 1}. ${p.name}: ${getPriorityText(p.value)}`).join('\n')}

  💡 **คำแนะนำจากความสำคัญ:**
  - กลุ่มเน้น${topPriorities[0].name}มากที่สุด → ควรเลือก${topPriorities[0].name}คุณภาพดี
  - ${topPriorities[2].name}สำคัญน้อยที่สุด → สามารถประหยัดได้
  ` : ''}
  📍 **จังหวัดที่สนใจ (จากการโหวต Borda Count):**
  ${topProvinces.length > 0 
    ? topProvinces.map((p, i) => `${i + 1}. ${p.name} (${p.score} คะแนน)`).join('\n')
    : 'ยังไม่มีการโหวตจังหวัด'
  }

  ❓ **คำถาม:**
  1. จากข้อมูลด้านบน ${topProvinces[0]?.name || 'จังหวัดไหน'}เหมาะสมที่สุดสำหรับกลุ่มเรา?${avgPriorities && topPriorities ? ` (พิจารณาจากความสำคัญ: ${topPriorities[0].name} > ${topPriorities[1].name} > ${topPriorities[2].name})` : ''}
  2. มีกิจกรรมหรือสถานที่ท่องเที่ยวไหนที่แนะนำสำหรับกลุ่ม ${members.length} คนบ้าง?
  3. ช่วยแนะนำ${topPriorities && topPriorities[0].name === 'ที่พัก' ? '**ที่พักคุณภาพดี**' : 'ที่พัก'}ในช่วงงบ ฿${formatCurrency(Math.round(budgetStats[0].median))}/คน/คืน${avgPriorities && topPriorities && topPriorities[0].name === 'ที่พัก' ? ' (กลุ่มเน้นที่พักมาก)' : ''}
  4. แนะนำวิธีการเดินทาง${avgPriorities && topPriorities && topPriorities[0].name === 'เดินทาง' ? '**ที่สะดวกสบาย**' : ''}และประมาณค่าใช้จ่าย
  5. งบประมาณรวม ฿${formatCurrency(Math.round(totalMedian * members.length))} เหมาะสมกับการท่องเที่ยวไหม?${avgPriorities && topPriorities ? ` (พิจารณาว่ากลุ่มเน้น${topPriorities[0].name})` : ''}
  6. ช่วยแนะนำแผนการเดินทาง ${duration} แบบละเอียดได้ไหม?${avgPriorities && topPriorities && topPriorities[2].name === 'อาหาร' ? ' (อาหารประหยัดได้)' : avgPriorities && topPriorities && topPriorities[0].name === 'อาหาร' ? ' (แนะนำร้านอาหารดีๆ)' : ''}

  ขอบคุณมากค่ะ! 🙏

  ---
  *หมายเหตุ: 
  - งบประมาณเป็นค่ากลาง (median) จากการโหวตของสมาชิก${avgPriorities ? `
  - ความสำคัญคำนวณจากการโหวต ${avgPriorities.count}/${members.length} คน
  - ⭐⭐⭐ = สำคัญมาก, ⭐⭐ = ปานกลาง, ⭐ = สำคัญน้อย` : ''}*`;

    return prompt;
  }; 
  const handleCopyPrompt = () => {
    const prompt = generateAIPrompt();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />
      <div className="py-6 px-4 max-w-6xl mx-auto">
        
        {/* ✅ Header - Compact */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              📊 สรุปผลการวางแผนทริป
            </h1>
            <button
              onClick={() => navigate("/homepage")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition text-sm"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="font-mono bg-blue-100 px-3 py-1.5 rounded-lg text-blue-700 font-semibold">
              {tripCode}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {members.length} คน
            </span>
          </div>
        </div>

        {/* ✅ วันที่ - Compact */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">วันที่แนะนำ</h2>
            </div>
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showTable ? 'ซ่อนตาราง' : 'ดูตารางเต็ม'} →
            </button>
          </div>

          {/* Top 3 Dates - Compact */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {dateAvailability.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 text-center ${
                  idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                  idx === 1 ? 'border-gray-300 bg-gray-50' :
                  'border-orange-300 bg-orange-50'
                }`}
              >
                <div className="text-2xl mb-1">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {item.date}
                </div>
                <div className="text-sm text-gray-600">
                  {item.available}/{item.total} คน
                </div>
                <div className="text-xs text-gray-500">
                  ({Math.round((item.available / item.total) * 100)}%)
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Collapsible Table */}
          {showTable && (
            <div className="overflow-x-auto mt-4 border-t pt-4">
              <table className="w-full border-collapse min-w-[600px] text-sm">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <tr>
                    <th className="py-2 px-3 border text-left">สมาชิก</th>
                    {dateHeaders.map((date, idx) => (
                      <th key={idx} className="py-2 px-2 border text-center">
                        <div className="text-xs">{date}</div>
                        <div className="text-[10px] opacity-80">
                          {members.filter(m => m.availability?.[idx] === true).length}/{members.length}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      <td className="py-2 px-3 border text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          member.gender === "ชาย" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                        }`}>
                          {member.name}
                        </span>
                      </td>
                      {(member.availability || []).map((available, i) => (
                        <td key={i} className="py-2 border text-center">
                          {available ? (
                            <Check className="text-green-600 w-4 h-4 mx-auto" />
                          ) : (
                            <X className="text-red-600 w-4 h-4 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ งบประมาณ - Compact (ลบ Pie Chart ออก) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">งบประมาณ</h2>
          </div>

          {/* ✅ Budget Stats Only - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {budgetStats.map(({ label, median, color }) => (
              <div key={label} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-lg font-bold" style={{ color }}>
                  ฿{formatCurrency(Math.round(median))}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg flex justify-between items-center">
            <span className="font-bold">รวมต่อคน</span>
            <span className="text-2xl font-bold">฿{formatCurrency(Math.round(totalMedian))}</span>
          </div>

          {/* ✅ Bar Chart - Compact */}
          <div className="mt-4">
            <h3 className="text-sm font-bold mb-3 text-gray-700">งบแต่ละสมาชิก</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={members.map(m => ({
                name: m.name.length > 8 ? m.name.slice(0, 8) + '...' : m.name,
                ค่าที่พัก: m.budget.accommodation,
                ค่าเดินทาง: m.budget.transport,
                ค่าอาหาร: m.budget.food,
                เงินสำรอง: m.budget.other
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value) => `฿${formatCurrency(Number(value))}`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ค่าที่พัก" fill="#3b82f6" />
                <Bar dataKey="ค่าเดินทาง" fill="#8b5cf6" />
                <Bar dataKey="ค่าอาหาร" fill="#10b981" />
                <Bar dataKey="เงินสำรอง" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ จังหวัด - Compact (ลบ Bar Chart ออก) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-800">จังหวัดยอดนิยม</h2>
          </div>

          {topProvinces.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {topProvinces.map((province, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 text-center ${
                    idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                    idx === 1 ? 'border-gray-300 bg-gray-50' :
                    'border-orange-300 bg-orange-50'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">อันดับ {idx + 1}</div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {province.name}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {province.score}
                  </div>
                  <div className="text-xs text-gray-500">คะแนน</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>ยังไม่มีข้อมูลการโหวตจังหวัด</p>
            </div>
          )}
        </div>

        {/* ✅ AI Prompt - Compact */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-xl font-bold">ถามคำแนะนำจาก AI</h2>
          </div>
          
          <p className="mb-4 text-sm text-purple-100">
            คัดลอกข้อมูลสรุปทริป แล้วนำไปถาม ChatGPT, Claude หรือ AI อื่นๆ!
          </p>

          <button
            onClick={handleCopyPrompt}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              copied 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>คัดลอกแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>คัดลอกข้อมูล</span>
              </>
            )}
          </button>

          <div className="mt-3 p-3 bg-white/10 rounded-lg text-xs text-purple-100">
            💡 หลังคัดลอก ไปวางในช่องแชทของ AI เพื่อรับคำแนะนำ!
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>สร้างโดย TripMate | ขอให้มีความสุขกับการท่องเที่ยว! 🎉</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;