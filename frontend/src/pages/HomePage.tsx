// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { tripAPI } from '../services/tripService';
import { formatInviteCode, validateInviteCode, validateTripName, validateDays } from '../utils';
import type { TripSummary } from '../types';

interface TripCard {
  id: string;
  name: string;
  people: number;
  status: string;
  statusColor: string;
  isCompleted: boolean;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [roomCode, setRoomCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    days: "",
    detail: "",
  });
  const [myTrips, setMyTrips] = useState<TripCard[]>([]);
  const [invitedTrips, setInvitedTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Helper: แปลง TripSummary → TripCard
  const formatTripSummary = (trip: TripSummary): TripCard => {
    const isCompleted = trip.status === 'completed' || trip.status === 'archived';

    return {
      id: trip.trip_id,
      name: trip.trip_name,
      people: trip.num_members,
      status: isCompleted ? 'เสร็จสิ้น' : 'กำลังดำเนินการ',
      statusColor: isCompleted ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700',
      isCompleted
    };
  };

  // ✅ โหลดทริปทั้งหมด
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getMyTrips();

      if (!response.success || !response.data) {
        throw new Error(response.message || "ไม่สามารถโหลดข้อมูลได้");
      }

      const { owned, joined } = response.data;

      setMyTrips(owned.map(formatTripSummary));
      setInvitedTrips(joined.map(formatTripSummary));

      console.log('✅ Loaded trips:', { owned: owned.length, joined: joined.length });

    } catch (error) {
      console.error("Load trips failed:", error);
      setMyTrips([]);
      setInvitedTrips([]);
      alert("ไม่สามารถโหลดข้อมูลทริปได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ✅ เข้าร่วมทริป
  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }
    
    if (!validateInviteCode(cleanCode)) {
      alert("รูปแบบรหัสไม่ถูกต้อง\nรูปแบบที่ถูกต้อง: XXXX-XXXX-XXXX-XXXX");
      return;
    }
    
    try {
      const response = await tripAPI.joinTrip(cleanCode);
      
      if (response.success && response.data) {
        const message = response.data.rejoined 
          ? 'เข้าร่วมทริปสำเร็จ! (คุณเคยเป็นสมาชิกอยู่แล้ว)'
          : 'เข้าร่วมทริปสำเร็จ!';
        
        alert(message);
        navigate(`/votepage/${response.data.trip_id}`);
        setRoomCode("");
        loadTrips();
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      console.error('Error joining trip:', error);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    }
  };

  // ✅ สร้างทริป
  const handleCreateTrip = async () => {
    const nameValidation = validateTripName(newTrip.name);
    if (!nameValidation.valid) {
      alert(nameValidation.error);
      return;
    }

    const daysValidation = validateDays(Number(newTrip.days));
    if (!daysValidation.valid) {
      alert(daysValidation.error);
      return;
    }

    try {
      const response = await tripAPI.createTrip({
        trip_name: newTrip.name,
        description: newTrip.detail || null,
        num_days: Number(newTrip.days)
      });

      if (!response.data) {
        throw new Error(response.message || "ไม่สามารถสร้างทริปได้");
      }

      const inviteCode = response.data.invite_code;
      
      alert(
        `สร้างทริปสำเร็จ!\n\nรหัสเชิญ: ${inviteCode}\n\nกรุณาบันทึกรหัสนี้ไว้`
      );

      navigate(`/votepage/${response.data.trip_id}`);
      setShowCreateModal(false);
      setNewTrip({ name: "", days: "", detail: "" });
      loadTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
      const errorMessage =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างทริป";
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    }
  };
  
  // ✅ Logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate("/homepage")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-600 text-white"
          >
            ทริปทั้งหมด
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-200 text-blue-800 hover:bg-blue-300"
          >
            Dashboard
          </button>
        </div>

        {/* สร้างทริป / เข้าร่วม */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
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
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ทริปของฉัน */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">สร้างโดยฉัน</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-4">
                  {myTrips.length === 0 ? (
                    <div className="bg-blue-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">ยังไม่มีทริป</p>
                      <p className="text-sm text-gray-400 mt-2">สร้างทริปใหม่เพื่อเริ่มต้น</p>
                    </div>
                  ) : (
                    myTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer"
                        onClick={() => navigate(`/votepage/${trip.id}`)}
                      >
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>
                            {trip.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-blue-900">
                          <User className="w-4 h-4" />
                          <span>{trip.people} คน</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ทริปที่ถูกเชิญ */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">ถูกเชิญเข้าร่วม</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-4">
                  {invitedTrips.length === 0 ? (
                    <div className="bg-blue-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">ยังไม่มีทริป</p>
                      <p className="text-sm text-gray-400 mt-2">รอคำเชิญจากเพื่อน</p>
                    </div>
                  ) : (
                    invitedTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer"
                        onClick={() => navigate(`/votepage/${trip.id}`)}
                      >
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>
                            {trip.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-blue-900">
                          <User className="w-4 h-4" />
                          <span>{trip.people} คน</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-bold text-blue-900 mb-4">สร้างทริปใหม่</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-900 mb-1">ชื่อทริป</label>
              <input
                type="text"
                className="w-full border border-blue-300 rounded-lg px-3 py-2"
                value={newTrip.name}
                onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                placeholder="เช่น ทริปเที่ยวทะเล"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-900 mb-1">จำนวนวัน (1-30 วัน)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="w-full border border-blue-300 rounded-lg px-3 py-2"
                value={newTrip.days}
                onChange={(e) => setNewTrip({ ...newTrip, days: e.target.value })}
                placeholder="3"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-900 mb-1">รายละเอียด (ไม่จำเป็น)</label>
              <textarea
                className="w-full border border-blue-300 rounded-lg px-3 py-2 h-24"
                value={newTrip.detail}
                onChange={(e) => setNewTrip({ ...newTrip, detail: e.target.value })}
                placeholder="เช่น เที่ยวทะเลภาคใต้ 3 วัน 2 คืน"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTrip({ name: "", days: "", detail: "" });
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleCreateTrip}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                สร้างทริป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;