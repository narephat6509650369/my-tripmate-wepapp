import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { tripAPI } from "../services/api";
import { CONFIG, log } from "../config/config";
import { MOCK_MY_TRIPS, MOCK_JOIN_TRIP_RESPONSE, TripData } from "../data/mockData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";


interface DashboardData {
  name: string;
  joined: number;
  notFilled: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("stats");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("memberId");
    navigate("/");
  };

  const handleCreateTrip = () => {
    navigate("/homepage");
  };

  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }

    const codePattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
    if (!codePattern.test(cleanCode)) {
      alert("รูปแบบรหัสห้องไม่ถูกต้อง\nกรุณากรอกในรูปแบบ XXXX-XXXX-XXXX-XXXX");
      return;
    }
    
    try {
      setLoading(true);
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Joining trip (mock)');
        response = MOCK_JOIN_TRIP_RESPONSE;
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        log.api('Joining trip via API');
        response = await tripAPI.joinTrip(cleanCode);
      }
      
      if (response.success && response.data) {
        alert('เข้าร่วมทริปสำเร็จ!');
        navigate(`/votePage/${response.data.tripCode || cleanCode}`);
        setRoomCode("");
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      log.error('Error joining trip:', error);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Loading trips from mock');
          response = MOCK_MY_TRIPS;
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log.api('Loading trips from API');
          response = await tripAPI.getMyTrips();
        }

        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to load trips');
        }
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid data format from server');
        }

        if (response.data.length === 0) {
          log.info('No trips found');
          setDashboardData([]);
          setLoading(false);
          return;
        }
        
        const formattedData = response.data.map((trip: TripData) => {
          const members = trip.members || [];
          
          const filled = members.filter(m => 
            m.budget?.accommodation > 0 && 
            m.budget?.transport > 0 && 
            m.budget?.food > 0
          ).length;
          
          return {
            name: trip.name || 'ไม่มีชื่อ',
            joined: filled,
            notFilled: members.length - filled
          };
        });
        
        setDashboardData(formattedData);
        log.success('Loaded trips successfully:', formattedData);
      } catch (error) {
        log.error('Error loading trips:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'ไม่สามารถโหลดข้อมูล Dashboard ได้';
        
        setError(errorMessage);
        setDashboardData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrips();
  }, []);

  const totalJoined = dashboardData.reduce((sum, t) => sum + t.joined, 0);
  const totalNotFilled = dashboardData.reduce((sum, t) => sum + t.notFilled, 0);
  const totalMembers = totalJoined + totalNotFilled;
  
  const pieData = [
    { name: "กรอกแล้ว", value: totalJoined },
    { name: "ยังไม่กรอก", value: totalNotFilled },
  ];
  
  const COLORS = ["#4f46e5", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header onLogout={handleLogout} />
      {/* ✅ เพิ่ม: แสดงแถบแจ้งเตือนเมื่ออยู่ใน Mock Mode */}
      {CONFIG.USE_MOCK_DATA && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-center text-sm">
          <strong>⚠️ โหมดทดสอบ:</strong> กำลังใช้ข้อมูลจำลอง (Mock Data) 
          - เปลี่ยนเป็น <code>USE_MOCK_DATA: false</code> ใน config.ts เพื่อใช้ API จริง
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate("/homepage")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-200 text-blue-800 hover:bg-blue-300"
          >
            ทริปทั้งหมด
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "stats" 
                ? "bg-blue-600 text-white shadow-lg" 
                : "bg-blue-200 text-blue-800 hover:bg-blue-300"
            }`}
          >
            Dashboard
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={handleCreateTrip}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>

          <div className="md:flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
              className="flex-1 border-2 border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase transition"
              value={roomCode}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9-]/g, '');
                
                if (!value.includes('-')) {
                  value = value.replace(/(.{4})/g, '$1-').slice(0, -1);
                }
                
                setRoomCode(value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                let pastedText = e.clipboardData.getData("text").toUpperCase().replace(/[^A-HJ-NP-Z2-9-]/g, '');
                
                if (!pastedText.includes('-')) {
                  pastedText = pastedText.replace(/(.{4})/g, '$1-').slice(0, -1);
                }
                
                setRoomCode(pastedText.slice(0, 19));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && roomCode) {
                  handleJoinTrip(roomCode);
                }
              }}
              disabled={loading}
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              disabled={loading || !roomCode}
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              เข้าร่วม
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <>
            {activeTab === "stats" && (
              <>
                {dashboardData.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      ยังไม่มีทริป
                    </h3>
                    <p className="text-gray-500 mb-6">
                      เริ่มต้นสร้างทริปแรกของคุณหรือเข้าร่วมทริปที่มีอยู่
                    </p>
                    <button
                      onClick={handleCreateTrip}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                    >
                      <Plus className="w-5 h-5" />
                      สร้างทริปใหม่
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">จำนวนทริป</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {dashboardData.length}
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">กรอกข้อมูลแล้ว</p>
                            <p className="text-3xl font-bold text-green-600">
                              {totalJoined}
                            </p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <Check className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">ยังไม่กรอก</p>
                            <p className="text-3xl font-bold text-orange-600">
                              {totalNotFilled}
                            </p>
                          </div>
                          <div className="bg-orange-100 p-3 rounded-full">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        รายละเอียดแต่ละทริป
                      </h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboardData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="joined" stackId="a" fill="#4f46e5" name="กรอกแล้ว" />
                          <Bar dataKey="notFilled" stackId="a" fill="#f59e0b" name="ยังไม่กรอก" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        สัดส่วนผู้เข้าร่วมทั้งหมด
                      </h2>

                      {totalMembers > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={(entry: any) => {
                                  const percent = entry.percent || 0;
                                  return `${entry.name}: ${entry.value} (${(percent * 100).toFixed(1)}%)`;
                                }}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="mt-4 flex justify-center gap-8">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                              <span className="text-sm text-gray-700">
                                กรอกแล้ว: {totalJoined} คน ({totalMembers > 0 ? ((totalJoined / totalMembers) * 100).toFixed(1) : 0}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                              <span className="text-sm text-gray-700">
                                ยังไม่กรอก: {totalNotFilled} คน ({totalMembers > 0 ? ((totalNotFilled / totalMembers) * 100).toFixed(1) : 0}%)
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <p>ยังไม่มีสมาชิกในทริป</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            
            {activeTab === "overview" && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-blue-900">
                  <svg className="w-20 h-20 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-lg">รายการทริปทั้งหมดจะแสดงที่นี่</p>
                  <p className="text-sm text-gray-500 mt-2">ฟีเจอร์นี้กำลังพัฒนา</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;