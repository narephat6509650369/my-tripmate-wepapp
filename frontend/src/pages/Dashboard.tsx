import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check } from "lucide-react";
import { useEffect } from "react";
import { tripAPI } from "../services/api";
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


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("stats");
  const [roomCode, setRoomCode] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId"); 
    navigate("/");
  };

  const handleCreateTrip = () => {
    navigate("/homepage"); // ไปหน้า homepage เพื่อสร้างทริป
  };

  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }
    
    try {
      const response = await tripAPI.joinTrip(cleanCode);
      
      if (response.success) {
        alert('เข้าร่วมทริปสำเร็จ!');
        navigate(`/votePage/${response.data.tripId}`);
        setRoomCode("");
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      console.error('Error joining trip:', error);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    }
  };

  // โหลดข้อมูลจริงจาก localStorage
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        const response = await tripAPI.getMyTrips();
        
        // ตรวจสอบ response
        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to load trips');
        }
        
        // ตรวจสอบ data
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid data format from server');
        }
        
        const formattedData = response.data.map((trip: any) => {
          const filled = trip.members?.filter((m: any) => 
            m.budget?.accommodation > 0 && 
            m.budget?.transport > 0 && 
            m.budget?.food > 0
          ).length || 0;
          
          return {
            name: trip.name,
            joined: filled,
            notFilled: (trip.members?.length || 0) - filled
          };
        });
        
        setDashboardData(formattedData);
      } catch (error) {
        console.error('Error loading trips:', error);
        
        // แสดง error message
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'ไม่สามารถโหลดข้อมูล Dashboard ได้';
        
        alert(`เกิดข้อผิดพลาด: ${errorMessage}\nกรุณาลองใหม่อีกครั้ง`);
        
        // ตั้งค่าเป็น array ว่าง
        setDashboardData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrips();
  }, []);

  const totalJoined = dashboardData.reduce((sum, t) => sum + t.joined, 0);
  const totalNotFilled = dashboardData.reduce((sum, t) => sum + t.notFilled, 0);
  const pieData = [
    { name: "กรอกแล้ว", value: totalJoined },
    { name: "ยังไม่กรอก", value: totalNotFilled },
  ];
  const COLORS = ["#4f46e5", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
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
              activeTab === "stats" ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-800 hover:bg-blue-300"
            }`}
          >
            Dashboard
          </button>
        </div>

      {/* สร้างทริป / เข้าร่วม */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={handleCreateTrip}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>

          <div className="md:flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
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
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition"
            >
              <Check className="w-5 h-5" />
              เข้าร่วม
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "stats" && (
              <>
                <h2 className="text-xl font-semibold mb-2 text-blue-900">รายละเอียดแต่ละทริป</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="joined" stackId="a" fill="#4f46e5" name="กรอกแล้ว" />
                    <Bar dataKey="notFilled" stackId="a" fill="#f59e0b" name="ยังไม่กรอก" />
                  </BarChart>
                </ResponsiveContainer>

                <h2 className="text-xl font-semibold mt-10 mb-2 text-blue-900">สัดส่วนผู้เข้าร่วมทั้งหมด</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry: typeof pieData[number], index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
            
            {activeTab === "overview" && (
              <div className="text-blue-900 text-center py-10">
                <p>รายการทริปทั้งหมดจะแสดงที่นี่</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
