// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
<<<<<<< HEAD
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
=======
import { Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { tripAPI } from '../services/tripService';
import { validateInviteCode, formatInviteCode } from '../utils';
import type { TripSummary } from '../types';
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
<<<<<<< HEAD
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

=======
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("stats");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);

  // ✅ แก้: ใช้ logout จาก useAuth
  const handleLogout = () => {
    logout();
  };

  const handleCreateTrip = () => {
    navigate("/homepage");
  };

  // ✅ แก้: ใช้ tripAPI.joinTrip
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
      setJoiningTrip(true);
=======
      setLoading(true);
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
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
=======
      setLoading(false);
    }
  };

  // ✅ แก้: ใช้ tripAPI.getMyTrips
  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await tripAPI.getMyTrips();
        
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load trips');
        }

        const allTrips = response.data.all;

        if (allTrips.length === 0) {
          console.log('No trips found');
          setDashboardData([]);
          setLoading(false);
          return;
        }
        
        // ✅ Mock data สำหรับแสดงกราฟ (จริงๆ ต้องดึงจาก API)
        // สำหรับโปรเจกจบ ใช้ mock ก่อนได้
        const formattedData = allTrips.map((trip: TripSummary) => {
          // Mock: สมมติว่ามี 5 คนในทริป และ 3 คนกรอกแล้ว
          const totalMembers = trip.num_members || 5;
          const filled = Math.floor(totalMembers * 0.6); // 60% กรอกแล้ว
          
          return {
            name: trip.trip_name.length > 10 
              ? trip.trip_name.slice(0, 10) + '...' 
              : trip.trip_name,
            joined: filled,
            notFilled: totalMembers - filled
          };
        });
        
        setDashboardData(formattedData);
        console.log('✅ Loaded trips successfully:', formattedData);
        
      } catch (error) {
        console.error('Error loading trips:', error);
        
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
<<<<<<< HEAD
        
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate("/homepage")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-200 text-blue-800 hover:bg-blue-300"
          >
            ทริปทั้งหมด
          </button>
<<<<<<< HEAD
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-600 text-white"
=======

          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "stats" 
                ? "bg-blue-600 text-white shadow-lg" 
                : "bg-blue-200 text-blue-800 hover:bg-blue-300"
            }`}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
          >
            Dashboard
          </button>
        </div>

<<<<<<< HEAD
        {/* สร้างทริป / เข้าร่วม */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={() => navigate("/homepage")}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition"
=======
        {/* Create Trip / Join Trip */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={handleCreateTrip}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition shadow-md hover:shadow-lg"
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>

          <div className="md:flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
<<<<<<< HEAD
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
=======
              className="flex-1 border-2 border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase transition"
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
              disabled={joiningTrip}
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              disabled={joiningTrip || !roomCode}
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joiningTrip ? (
=======
              disabled={loading}
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              disabled={loading || !roomCode}
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              เข้าร่วม
            </button>
          </div>
        </div>

<<<<<<< HEAD
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

=======
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          /* Error State */
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
          /* Dashboard Content */
          <>
            {activeTab === "stats" && (
              <>
                {dashboardData.length === 0 ? (
                  /* Empty State */
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
                  /* Dashboard Stats */
                  <>
                    {/* Summary Cards */}
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

                    {/* Bar Chart */}
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

                    {/* Pie Chart */}
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
          </>
        )}
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      </main>
    </div>
  );
};

export default Dashboard;