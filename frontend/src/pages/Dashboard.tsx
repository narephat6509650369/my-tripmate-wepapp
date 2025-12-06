import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check } from "lucide-react";
import { useEffect } from "react";
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
    navigate("/");
  };
  const handleCreateTrip = () => console.log("สร้างทริปใหม่");
  const handleJoinTrip = (code: string) => {
    if (!code) return alert("กรุณากรอกเลขห้อง");
    console.log("เข้าร่วมทริปด้วยเลขห้อง:", code);
    setRoomCode("");
  };

  // ✅ โหลดข้อมูลจริงจาก localStorage
  const [dashboardData, setDashboardData] = useState<any[]>([]);

  useEffect(() => {
    const loadTrips = () => {
      const trips = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('trip_')) {
          const tripData = JSON.parse(localStorage.getItem(key) || '{}');
          const filled = tripData.members?.filter((m: any) => 
            m.budget?.accommodation > 0 && 
            m.budget?.transport > 0 && 
            m.budget?.food > 0
          ).length || 0;
          
          trips.push({
            name: tripData.name,
            joined: filled,
            notFilled: (tripData.members?.length || 0) - filled
          });
        }
      }
      setDashboardData(trips);
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
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "overview" ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-800 hover:bg-blue-300"
            }`}
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
                    fill={COLORS[index % COLORS.length]}  // ใช้สีจาก COLORS ที่กำหนดไว้
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
      </main>
    </div>
  );
};

export default Dashboard;
