// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, Loader2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { tripAPI } from '../services/tripService';
import { formatInviteCode, validateInviteCode } from '../utils';
import { useToast } from './VotePage/hooks/useToast';
import { initSocket } from "../socket";
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
  const { logout, user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteStatusLoading, setVoteStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joiningTrip, setJoiningTrip] = useState(false);
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const myOngoing = owned.filter(t => ['planning','voting'].includes(t.status)).length;
      const myCompleted = owned.filter(t => ['completed','archived','confirmed'].includes(t.status)).length;
      const joinedOngoing = joined.filter(t => ['planning','voting'].includes(t.status)).length;
      const joinedCompleted = joined.filter(t => ['completed','archived','confirmed'].includes(t.status)).length;

      setStats({
        myTrips: { total: owned.length, ongoing: myOngoing, completed: myCompleted },
        joinedTrips: {
          total: joined.length, ongoing: joinedOngoing, completed: joinedCompleted,
          myStatus: { completed: 0, pending: 0 }
        }
      });
      setLoading(false);

      const ongoingJoined = joined.filter(t => ['planning','voting'].includes(t.status));
      if (ongoingJoined.length > 0 && user?.user_id) {
        setVoteStatusLoading(true);
        try {
          const detailResults = await Promise.allSettled(
            ongoingJoined.map(t => tripAPI.getTripDetail(t.trip_id))
          );

          let voted = 0, notVoted = 0;
          detailResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success && result.value.data) {
              const hasVoted = result.value.data.memberAvailabilitys?.some(
                (a: any) => a.user_id === user.user_id
              ) ?? false;
              hasVoted ? voted++ : notVoted++;
            }
          });

          setStats(prev => prev ? {
            ...prev,
            joinedTrips: { ...prev.joinedTrips, myStatus: { completed: voted, pending: notVoted } }
          } : prev);
        } finally {
          setVoteStatusLoading(false);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.user_id) return;

    const socket = initSocket(user.user_id);
    if (!socket) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        loadDashboardStats();
      }, 400);
    };

    const events = [
      "new_notification",
      "you_were_removed",
      "join_rejected",
      "trip_closed",
      "member_updated",
      "vote_updated",
      "add_Info"
    ];

    events.forEach(event => socket.on(event, scheduleRefresh));

    return () => {
      events.forEach(event => socket.off(event, scheduleRefresh));
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [user?.user_id]);

  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      showToast("กรุณากรอกรหัสห้อง", "error");
      return;
    }

    if (!validateInviteCode(cleanCode)) {
      showToast("รูปแบบรหัสห้องไม่ถูกต้อง (XXXX-XXXX-XXXX-XXXX)", "error");
      return;
    }
    
    try {
      setJoiningTrip(true);
      const response = await tripAPI.joinTrip(cleanCode);
      
      if (response.success) {
        showToast("ส่งคำขอเข้าร่วมสำเร็จ! รอ Owner อนุมัติ", "success");
        setRoomCode("");
      } else {
        showToast(response.message || 'ไม่สามารถเข้าร่วมทริปได้', "error");
      }
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการเข้าร่วมทริป', "error");
    } finally {
      setJoiningTrip(false);
    }
  };

  const handleLogout = () => logout();

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
            <button
              onClick={loadDashboardStats}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

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

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all
              ${toast.type === 'success' ? 'bg-green-500' : 
                toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>

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
              className="flex items-center justify-center gap-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 py-2 rounded-lg transition"
            >
              <Check className="w-5 h-5" />
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
                
                {/* สรุปภาพรวม */}
                <div className="bg-blue-100 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 สัดส่วนทริป</h3>
                  
                  {stats.myTrips.ongoing === 0 && stats.myTrips.completed === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>ยังไม่มีข้อมูลเพียงพอ</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={myTripsChartData.filter(d => d.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value, percent }) =>
                              `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                            }
                          >
                            {myTripsChartData
                              .filter(d => d.value > 0)
                              .map((entry, index) => (
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
                    </>
                  )}
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
                  {stats.joinedTrips.ongoing === 0 && stats.joinedTrips.completed === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>ยังไม่มีข้อมูลเพียงพอ</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={joinedTripsChartData.filter(d => d.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value, percent }) =>
                              `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                            }
                          >
                            {joinedTripsChartData
                              .filter(d => d.value > 0)
                              .map((entry, index) => (
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
                    </>
                  )}
                </div>

                {/* สถานะการโหวต */}
                {stats.joinedTrips.ongoing > 0 && (
                  <div className="bg-blue-100 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      ✅ สถานะการโหวตของคุณ
                    </h3>
                    {voteStatusLoading ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        กำลังตรวจสอบสถานะโหวต...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">โหวตแล้ว</p>
                          <p className="text-2xl font-bold text-green-600">
                            {stats.joinedTrips.myStatus.completed}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">ทริป</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">ยังไม่โหวต</p>
                          <p className="text-2xl font-bold text-orange-500">
                            {stats.joinedTrips.myStatus.pending}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">ทริป</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;