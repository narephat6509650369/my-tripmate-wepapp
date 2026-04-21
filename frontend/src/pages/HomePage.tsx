// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User, Trash2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, notiApi } from '../services/tripService';
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
  const location = useLocation();
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<TripCard | null>(null);
  const [joiningTrip, setJoiningTrip] = useState(false);
  
  // ✅ Helper: แปลง TripSummary → TripCard
  const formatTripSummary = (trip: TripSummary): TripCard => {
    console.log('Trip status:', trip.trip_id, trip.status);
    const isCompleted = trip.status === 'completed' || trip.status === 'archived'|| trip.status === 'confirmed';

    return {
      id: trip.trip_id,
      name: trip.trip_name,
      people: trip.num_members,
      status: isCompleted ? 'เสร็จสิ้น' : 'กำลังดำเนินการ',
      statusColor: isCompleted ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700',
      isCompleted
    };
  };

  // ================= EFFECTS =================
  useEffect(() => {
    loadTrips();
    const fetchNoti = async () => {
      const noti = await notiApi.getNoti();
      console.log("GET NOTI:", noti);
    };
    fetchNoti();
  }, []);

  useEffect(() => {
  const state = location.state as any;

  if (state?.joinError) {
    setDialogMessage(state.joinError);
    navigate(location.pathname, { replace: true });
  }

  if (state?.joinSuccess) {
    setDialogMessage("เข้าร่วมห้องสำเร็จ 🎉");
    navigate(location.pathname, { replace: true });
  }
  
  if (state?.joinPending) {
    setDialogMessage("ส่งคำขอเข้าร่วมแล้ว รอเจ้าของทริปอนุมัติ ⏳");
  }
}, [location]);


  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getMyTrips();
      console.log('getMyTrips response:', response);

      if (!response.success && response.code === 'AUTH_UNAUTHORIZED') {
        navigate('/login');
        return;
      }

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

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    try {
      const response = await tripAPI.deleteTrip(tripToDelete.id);
      if (response.success) {
        setTripToDelete(null);
        loadTrips();
      } else {
        setTripToDelete(null);
        setDialogMessage(response.message || 'ลบทริปไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Delete trip failed:<tool_call>', error);
      setTripToDelete(null);
      setDialogMessage('ลบทริปไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  // ✅ เข้าร่วมทริป
  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) { alert("กรุณากรอกรหัสห้อง"); return; }
    if (!validateInviteCode(cleanCode)) { alert("รูปแบบรหัสไม่ถูกต้อง"); return; }
    if (joiningTrip) return;

    try {
      setJoiningTrip(true);
      const response = await tripAPI.requestToJoin(cleanCode);
      if (response.success) {
        setRoomCode("");
        setDialogMessage("ส่งคำขอเข้าร่วมแล้ว รอเจ้าของทริปอนุมัติ ⏳");
        loadTrips();
      } else {
        setDialogMessage(response.message || 'ไม่สามารถส่งคำขอได้');
      }
    } catch (error) {
      setDialogMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
    setJoiningTrip(false);
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
              disabled={joiningTrip}  
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
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTripToDelete(trip);
                            }}
                            className="absolute bottom-3 right-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="ลบทริป"
                          >
                            <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Delete Confirm Modal */}
      {tripToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setTripToDelete(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ลบทริปนี้?</h3>
              <p className="text-sm text-gray-600">
                ทริป <strong>"{tripToDelete.name}"</strong> จะถูกลบถาวร<br />
                ไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteTrip()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
              >
                ลบทริป
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ✅ Join Result Dialog */}
      {dialogMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-sm text-center">
            <p className="mb-4 text-blue-900 font-medium">
              {dialogMessage}
            </p>

            <button
              onClick={() => setDialogMessage(null)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

    </div>
    
  );
};

export default HomePage;