// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, Loader2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { tripAPI } from '../services/tripService';
import { formatInviteCode, validateInviteCode } from '../utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface DashboardStats {
  myTrips: {
    total: number;
    ongoing: number;
    completed: number;
  };
  joinedTrips: {
    total: number;
    ongoing: number;
    completed: number;
    myStatus: {
      completed: number;
      pending: number;
    };
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [joiningTrip, setJoiningTrip] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getMyTrips();
      
      if (!response.success || !response.data) {
        throw new Error('Failed to load trips');
      }

      const { owned, joined } = response.data;

      // คำนวณสถิติทริปที่สร้าง
      const myOngoing = owned.filter(t => 
        t.status === 'planning' || t.status === 'voting'
      ).length;
      const myCompleted = owned.filter(t => 
        t.status === 'completed' || t.status === 'archived'
      ).length;

      // คำนวณสถิติทริปที่เข้าร่วม
      const joinedOngoing = joined.filter(t => 
        t.status === 'planning' || t.status === 'voting'
      ).length;
      const joinedCompleted = joined.filter(t => 
        t.status === 'completed' || t.status === 'archived'
      ).length;

      // TODO: ดึงข้อมูล "สถานะของคุณ" จาก API (ตอนนี้ใช้ mock)
      const myStatusCompleted = Math.floor(joinedOngoing * 0.6);
      const myStatusPending = joinedOngoing - myStatusCompleted;

      setStats({
        myTrips: {
          total: owned.length,
          ongoing: myOngoing,
          completed: myCompleted
        },
        joinedTrips: {
          total: joined.length,
          ongoing: joinedOngoing,
          completed: joinedCompleted,
          myStatus: {
            completed: myStatusCompleted,
            pending: myStatusPending
          }
        }
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }

    if (!validateInviteCode(cleanCode)) {
      alert("รูปแบบรหัสห้องไม่ถูกต้อง\nกรุณากรอกในรูปแบบ XXXX-XXXX-XXXX-XXXX");
      return;
    }
    
    try {
      setJoiningTrip(true);
      const response = await tripAPI.joinTrip(cleanCode);
      
      if (response.success && response.data) {
        alert('เข้าร่วมทริปสำเร็จ!');
        navigate(`/votepage/${response.data.trip_id}`);
        setRoomCode("");
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      console.error('Error joining trip:', error);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    } finally {
      setJoiningTrip(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  // Data สำหรับ Pie Charts
  const myTripsChartData = [
    { name: 'กำลังดำเนินการ', value: stats.myTrips.ongoing, color: '#10b981' },
    { name: 'เสร็จสิ้น', value: stats.myTrips.completed, color: '#6b7280' }
  ];

  const joinedTripsChartData = [
    { name: 'กำลังดำเนินการ', value: stats.joinedTrips.ongoing, color: '#10b981' },
    { name: 'เสร็จสิ้น', value: stats.joinedTrips.completed, color: '#6b7280' }
  ];

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
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-600 text-white"
          >
            Dashboard
          </button>
        </div>

        {/* สร้างทริป / เข้าร่วม */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={() => navigate("/homepage")}
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
              onChange={(e) => setRoomCode(formatInviteCode(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                setRoomCode(formatInviteCode(pastedText));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && roomCode) {
                  handleJoinTrip(roomCode);
                }
              }}
              disabled={joiningTrip}
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              disabled={joiningTrip || !roomCode}
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joiningTrip ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              เข้าร่วม
            </button>
          </div>
        </div>

        {/* Section ทริป */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px] overflow-y-auto">
          
          {/* ════════════════════════════════════════════════════ */}
          {/* Section 1: ทริปที่ฉันสร้าง */}
          {/* ════════════════════════════════════════════════════ */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">สร้างโดยฉัน</h2>
            
            {stats.myTrips.total === 0 ? (
              <div className="bg-blue-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">ยังไม่มีทริป</p>
                <p className="text-sm text-gray-400 mt-2">สร้างทริปใหม่เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* สรุปภาพรวม */}
                <div className="bg-blue-100 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">สรุปภาพรวม</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">ทั้งหมด</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.myTrips.total}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">กำลังดำเนินการ</p>
                      <p className="text-2xl font-bold text-green-600">{stats.myTrips.ongoing}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">เสร็จสิ้น</p>
                      <p className="text-2xl font-bold text-gray-600">{stats.myTrips.completed}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-blue-100 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 สัดส่วนทริป</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={myTripsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {myTripsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-blue-900">
                        กำลังดำเนินการ ({stats.myTrips.ongoing} ทริป)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="text-sm text-blue-900">
                        เสร็จสิ้น ({stats.myTrips.completed} ทริป)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════ */}
          {/* Section 2: ทริปที่ถูกเชิญเข้าร่วม */}
          {/* ════════════════════════════════════════════════════ */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">ถูกเชิญเข้าร่วม</h2>
            
            {stats.joinedTrips.total === 0 ? (
              <div className="bg-blue-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">ยังไม่มีทริป</p>
                <p className="text-sm text-gray-400 mt-2">รอคำเชิญจากเพื่อน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* สรุปภาพรวม */}
                <div className="bg-blue-100 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">สรุปภาพรวม</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">ทั้งหมด</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.joinedTrips.total}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">กำลังดำเนินการ</p>
                      <p className="text-2xl font-bold text-green-600">{stats.joinedTrips.ongoing}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">เสร็จสิ้น</p>
                      <p className="text-2xl font-bold text-gray-600">{stats.joinedTrips.completed}</p>
                      <p className="text-xs text-gray-500 mt-1">ทริป</p>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-blue-100 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 สัดส่วนทริป</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={joinedTripsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {joinedTripsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-blue-900">
                        กำลังดำเนินการ ({stats.joinedTrips.ongoing} ทริป)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="text-sm text-blue-900">
                        เสร็จสิ้น ({stats.joinedTrips.completed} ทริป)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;