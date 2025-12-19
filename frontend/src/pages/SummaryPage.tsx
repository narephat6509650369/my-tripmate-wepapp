import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Calendar, Users, DollarSign, MapPin, Sparkles, Check, X, Loader2 } from "lucide-react";
import Header from "../components/Header";
import { tripAPI } from "../services/api";
import { CONFIG, log } from '../config/app.config';
import { MOCK_SUMMARY_DATA, Member, TripData } from "../data/mockData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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
          response = MOCK_SUMMARY_DATA;
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

  // ✅ เพิ่มการตรวจสอบว่า trip ถูกปิดแล้วหรือยัง
  if (!tripData.isCompleted || !tripData.closedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">ทริปนี้ยังไม่ได้ปิดการโหวต</p>
          <button
            onClick={() => navigate(`/vote/${tripCode}`)}
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

  // ✅ เพิ่มการตรวจสอบว่ามีสมาชิกหรือไม่
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
  
  // คำนวณวันที่ที่ตรงกันมากที่สุด
  const dateAvailability = dateHeaders.map((date: string, idx: number) => ({
    date,
    available: members.filter((m: Member) => m.availability?.[idx]).length,
    total: members.length
  })).sort((a, b) => b.available - a.available);

  // คำนวณสถิติงบประมาณ
  const budgetStats = BUDGET_CATEGORIES.map(({ key, label, color }) => {
    const values = members.map((m: Member) => m.budget[key]);
    const median = getMedian(values);
    const total = values.reduce((a: number, b: number) => a + b, 0);
    return { key, label, color, median, total, values };
  });

  const totalMedian = budgetStats.reduce((sum, stat) => sum + stat.median, 0);
  const totalBudget = budgetStats.reduce((sum, stat) => sum + stat.total, 0);

  // ข้อมูลสำหรับกราฟวงกลม
  const pieData = budgetStats.map(({ label, total, color }) => ({
    name: label,
    value: total,
    color
  }));

  // Top 3 จังหวัด
  const topProvinces = voteResults?.provinces?.slice(0, 3) || [];

  // ✅ ปรับปรุง AI Prompt Generation
  const generateAIPrompt = () => {
    const maleCount = members.filter(m => m.gender === "ชาย").length;
    const femaleCount = members.filter(m => m.gender === "หญิง").length;
    const topDate = dateAvailability[0];
    const duration = `${tripData.days} วัน`;

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
- ค่าที่พัก: ฿${formatCurrency(Math.round(budgetStats[0].median))}
- ค่าเดินทาง: ฿${formatCurrency(Math.round(budgetStats[1].median))}
- ค่าอาหาร: ฿${formatCurrency(Math.round(budgetStats[2].median))}
- เงินสำรอง: ฿${formatCurrency(Math.round(budgetStats[3].median))}
- **รวมต่อคน: ฿${formatCurrency(Math.round(totalMedian))}**
- **งบรวมทั้งกลุ่ม: ฿${formatCurrency(Math.round(totalMedian * members.length))}**

📍 **จังหวัดที่สนใจ (จากการโหวต):**
${topProvinces.length > 0 
  ? topProvinces.map((p, i) => `${i + 1}. ${p.name} (${p.score} คะแนน)`).join('\n')
  : 'ยังไม่มีการโหวตจังหวัด'
}

❓ **คำถาม:**
1. จากข้อมูลด้านบน จังหวัดไหนที่เหมาะสมที่สุดสำหรับกลุ่มเรา? (พิจารณาจากงบประมาณ, จำนวนคน, และความนิยม)
2. มีกิจกรรมหรือสถานที่ท่องเที่ยวไหนที่แนะนำสำหรับกลุ่ม ${members.length} คนบ้าง?
3. ช่วยแนะนำที่พักที่เหมาะสมในช่วงงบ ฿${formatCurrency(Math.round(budgetStats[0].median))}/คน/คืน
4. แนะนำวิธีการเดินทางและประมาณค่าใช้จ่ายที่เหมาะสม
5. งบประมาณรวม ฿${formatCurrency(Math.round(totalMedian * members.length))} เหมาะสมกับการท่องเที่ยวไหม? ควรปรับเพิ่ม/ลดไหม?
6. ช่วยแนะนำแผนการเดินทาง ${duration} แบบละเอียดได้ไหม? (รวมถึงเวลา, สถานที่, และร้านอาหารแนะนำ)

ขอบคุณมากค่ะ! 🙏

---
*หมายเหตุ: งบประมาณข้างต้นเป็นค่ากลาง (median) จากการโหวตของสมาชิก*`;

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
      <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📊 สรุปผลการวางแผนทริป
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-gray-600 flex-wrap">
            <span className="font-mono bg-blue-100 px-4 py-2 rounded-lg text-blue-700 font-semibold">
              รหัสทริป: {tripCode}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {members.length} สมาชิก
            </span>
            <button
              onClick={() => navigate("/homepage")}
              className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>

        {/* วันที่ความว่าง */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-800">📅 วันที่ที่ทุกคนว่าง</h2>
          </div>

          {/* ตารางความว่าง */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-4 border text-left">สมาชิก</th>
                  {dateHeaders.map((date, idx) => (
                    <th key={idx} className="py-3 px-2 border text-center">
                      <div>{date}</div>
                      <div className="text-xs opacity-90">
                        {members.filter(m => m.availability[idx]).length}/{members.length}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={idx} className="hover:bg-blue-50">
                    <td className="py-3 px-4 border font-medium">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        member.gender === "ชาย" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                      }`}>
                        {member.name}
                      </span>
                    </td>
                    {member.availability.map((available, i) => (
                      <td key={i} className="py-3 border text-center">
                        <div className="flex justify-center">
                          {available ? (
                            <Check className="text-green-600 w-5 h-5" />
                          ) : (
                            <X className="text-red-600 w-5 h-5" />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top 3 วันที่ */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">🏆 Top 3 วันที่ทุกคนว่างมากที่สุด</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dateAvailability.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl border-4 ${
                    idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                    idx === 1 ? 'border-gray-400 bg-gray-50' :
                    'border-orange-400 bg-orange-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      {item.date}
                    </div>
                    <div className="text-lg text-gray-600">
                      {item.available}/{item.total} คน
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ({Math.round((item.available / item.total) * 100)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* งบประมาณ */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">💰 สรุปงบประมาณ</h2>
          </div>

          {/* กราฟแท่งงบประมาณ */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-700">งบประมาณแต่ละสมาชิก</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={members.map(m => ({
                name: m.name,
                ค่าที่พัก: m.budget.accommodation,
                ค่าเดินทาง: m.budget.transport,
                ค่าอาหาร: m.budget.food,
                เงินสำรอง: m.budget.other
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${formatCurrency(Number(value))}`} />
                <Legend />
                <Bar dataKey="ค่าที่พัก" fill="#3b82f6" />
                <Bar dataKey="ค่าเดินทาง" fill="#8b5cf6" />
                <Bar dataKey="ค่าอาหาร" fill="#10b981" />
                <Bar dataKey="เงินสำรอง" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* กราฟวงกลมสัดส่วนงบประมาณ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-700">สัดส่วนงบประมาณรวม</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${formatCurrency(Number(value))}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* การ์ดสรุปค่า Median */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-700">ค่ากลาง (Median) แนะนำ</h3>
              <div className="space-y-3">
                {budgetStats.map(({ label, median, color }) => (
                  <div key={label} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color }}>
                      ฿{formatCurrency(Math.round(median))}
                    </span>
                  </div>
                ))}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-lg">รวมทั้งหมด</span>
                  <span className="text-2xl font-bold">฿{formatCurrency(Math.round(totalMedian))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* จังหวัด */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-gray-800">🗺️ จังหวัดที่ได้รับความนิยม</h2>
          </div>

          {topProvinces.length > 0 ? (
            <>
              {/* Top 3 การ์ด */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {topProvinces.map((province, idx) => (
                  <div
                    key={idx}
                    className={`p-8 rounded-xl border-4 ${
                      idx === 0 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' :
                      idx === 1 ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100' :
                      'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">อันดับ {idx + 1}</div>
                      <div className="text-3xl font-bold text-gray-800 mb-3">
                        {province.name}
                      </div>
                      <div className="text-4xl font-bold text-blue-600">
                        {province.score} คะแนน
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* กราฟแท่งจังหวัด */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-700">กราฟคะแนนโหวต</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={voteResults?.provinces || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>ยังไม่มีข้อมูลการโหวตจังหวัด</p>
            </div>
          )}
        </div>

        {/* AI Prompt */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl font-bold">🤖 ถามคำแนะนำจาก AI</h2>
          </div>
          
          <p className="mb-6 text-purple-100">
            คลิกปุ่มด้านล่างเพื่อคัดลอกข้อมูลสรุปทริปของคุณ แล้วนำไปถาม ChatGPT, Claude หรือ AI อื่นๆ เพื่อรับคำแนะนำการวางแผนทริป!
          </p>

          <button
            onClick={handleCopyPrompt}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              copied 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>คัดลอกแล้ว! นำไปถาม AI ได้เลย</span>
              </>
            ) : (
              <>
                <Copy className="w-6 h-6" />
                <span>คัดลอกข้อมูลเพื่อถาม AI</span>
              </>
            )}
          </button>

          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className="text-sm text-purple-100">
              💡 <strong>เคล็ดลับ:</strong> หลังจากคัดลอก ให้ไปวางในช่องแชทของ AI ที่คุณชอบ 
              แล้ว AI จะช่วยแนะนำสถานที่ท่องเที่ยว กิจกรรม และแผนการเดินทางที่เหมาะกับกลุ่มของคุณ!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>สร้างโดย Trip Planner System | ขอให้มีความสุขกับการท่องเที่ยว! 🎉</p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SummaryPage;