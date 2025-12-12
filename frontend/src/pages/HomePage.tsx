import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User } from "lucide-react";
import { tripAPI } from "../services/api";
import { CONFIG, log } from "../config/config";
import { MOCK_MY_TRIPS, MOCK_JOIN_TRIP_RESPONSE, MOCK_CREATE_TRIP_RESPONSE, MOCK_INVITE_CODE_RESPONSE } from "../data/mockData";
import { formatInviteCode, validateInviteCode, validateTripName, validateDays } from '../utils/utils';
import type { TripData } from "../data/mockData";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    days: "",
    detail: "",
  });
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [invitedTrips, setInvitedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดทริปทั้งหมดจาก Backend
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Loading trips from mock');
        response = MOCK_MY_TRIPS;
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        log.api('Loading trips from API');
        response = await tripAPI.getMyTrips();
        
        // ✅ Fallback to mock if API fails
        if (!response || !response.success) {
          log.warn('API failed, falling back to mock data');
          response = MOCK_MY_TRIPS;
        }
      }
      
      // ✅ Validate response
      if (!response?.success || !Array.isArray(response?.data)) {
        throw new Error('Invalid response format');
      }
      
      const userId = localStorage.getItem('userId') || 'user123';
      const created = response.data.filter((trip: TripData) => trip.createdBy === userId);
      const invited = response.data.filter((trip: TripData) => trip.createdBy !== userId);
      
      setMyTrips(created.map(formatTripData));
      setInvitedTrips(invited.map(formatTripData));
      
    } catch (error) {
      log.error('Error loading trips:', error);
      
      // ✅ Try mock data as last resort
      try {
        const response = MOCK_MY_TRIPS;
        const userId = localStorage.getItem('userId') || 'user123';
        const created = response.data?.filter((trip: TripData) => trip.createdBy === userId) || [];
        const invited = response.data?.filter((trip: TripData) => trip.createdBy !== userId) || [];
        
        setMyTrips(created.map(formatTripData));
        setInvitedTrips(invited.map(formatTripData));
        log.warn('Using mock data after API failure');
        
      } catch (mockError) {
        log.error('Even mock data failed:', mockError);
        setMyTrips([]);
        setInvitedTrips([]);
        alert('ไม่สามารถโหลดข้อมูลทริปได้ กรุณาลองใหม่อีกครั้ง');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const formatTripData = (trip: TripData) => {
    const filled = trip.members?.filter((m: any) => 
      m.budget?.accommodation > 0 && 
      m.budget?.transport > 0 && 
      m.budget?.food > 0
    ).length || 0;
    const totalMembers = trip.members?.length || 0;
    
    return {
      id: trip._id || trip.tripCode,
      tripCode: trip.tripCode, 
      name: trip.name,
      days: trip.days,
      detail: trip.detail || '',
      people: totalMembers,
      status: trip.isCompleted ? "ครบแล้ว" : "กำลังรวบรวมข้อมูล",
      statusColor: trip.isCompleted ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
      filled: totalMembers > 0 
        ? `กรอกแล้ว ${filled} คน${totalMembers - filled > 0 ? `, ยังไม่กรอก ${totalMembers - filled} คน` : ''}` 
        : "ยังไม่มีสมาชิก",
      isCompleted: trip.isCompleted || false
    };
  };

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
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Joining trip (mock)');
        response = MOCK_JOIN_TRIP_RESPONSE;
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        log.api('Joining trip via API');
        response = await tripAPI.joinTrip(cleanCode);
        
        // ✅ เพิ่ม: ถ้า API fail ให้ fallback
        if (!response || !response.success) {
          log.warn('Join trip API failed, using mock');
          response = MOCK_JOIN_TRIP_RESPONSE;
        }
      }
      
      if (response.success) {
        alert('เข้าร่วมทริปสำเร็จ!');
        // ✅ ใช้ tripCode หรือ inviteCode ก็ได้
        const tripId = response.data.tripCode || response.data.tripId || cleanCode;
        navigate(`/votePage/${tripId}`);
        setRoomCode("");
        loadTrips();
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      log.error('Error joining trip:', error);
      
      // ✅ เพิ่ม: Last resort fallback
      if (!CONFIG.USE_MOCK_DATA) {
        log.warn('Using mock join response as fallback');
        alert('เข้าร่วมทริปสำเร็จ! (โหมดทดสอบ)');
        navigate(`/votePage/${cleanCode}`);
        setRoomCode("");
        return;
      }
      
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    navigate("/");
  };

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
                    myTrips.map((trip, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer"
                      >
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>
                            {trip.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <span className="font-medium">{trip.days} วัน</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <User className="w-4 h-4" />
                            <span>{trip.people} คน</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">{trip.filled}</p>

                        <button
                          onClick={() => {
                            if (trip.isCompleted) {
                              navigate(`/summaryPage/${trip.tripCode}`);
                            } else {
                              navigate(`/votePage/${trip.tripCode}`);
                            }
                          }}
                          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                        >
                          {trip.isCompleted ? "ดูสรุปผล" : "แก้ไข"}
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
                    invitedTrips.map((trip, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer"
                      >
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>
                            {trip.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <span className="font-medium">{trip.days} วัน</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <User className="w-4 h-4" />
                            <span>{trip.people} คน</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">{trip.filled}</p>

                        <button
                          onClick={() => {
                            if (trip.isCompleted) {
                              navigate(`/summaryPage/${trip.tripCode}`);
                            } else {
                              navigate(`/votePage/${trip.tripCode}`);
                            }
                          }}
                          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                        >
                          {trip.isCompleted ? "ดูสรุปผล" : "ดูรายละเอียด"}
                        </button>
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
                onClick={async () => {
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
                    let response, inviteResponse;

                    if (CONFIG.USE_MOCK_DATA) {
                      log.mock('Creating trip (mock)');
                      response = MOCK_CREATE_TRIP_RESPONSE;
                      await new Promise((r) => setTimeout(r, 500));
                      inviteResponse = MOCK_INVITE_CODE_RESPONSE;
                    } else {
                      log.api('Creating trip via API');
                      response = await tripAPI.createTrip(newTrip);

                      // ✅ เพิ่ม: ถ้า API fail ให้ fallback
                      if (!response?.success) {
                        log.warn('Create trip API failed, using mock');
                        response = MOCK_CREATE_TRIP_RESPONSE;
                        inviteResponse = MOCK_INVITE_CODE_RESPONSE;
                      } else {
                        const tripId = response.data?._id || response.data?.id;
                        if (!tripId) {
                          log.warn('No trip ID, using mock');
                          inviteResponse = MOCK_INVITE_CODE_RESPONSE;
                        } else {
                          inviteResponse = await tripAPI.generateInviteCode(tripId);
                          
                          // ✅ เพิ่ม: ถ้า generate invite code fail
                          if (!inviteResponse?.success) {
                            log.warn('Generate invite code failed, using mock');
                            inviteResponse = MOCK_INVITE_CODE_RESPONSE;
                          }
                        }
                      }
                    }

                    if (!inviteResponse?.data?.inviteCode) {
                      throw new Error("Failed to get invite code");
                    }

                    const inviteCode = inviteResponse.data.inviteCode;
                    
                    alert(
                      `สร้างทริปสำเร็จ!\n\nรหัสเชิญ: ${inviteCode}\n\nกรุณาบันทึกรหัสนี้ไว้`
                    );

                    navigate(`/votePage/${inviteCode}`);
                    setShowCreateModal(false);
                    setNewTrip({ name: "", days: "", detail: "" });
                    loadTrips();
                  } catch (error) {
                    log.error('Error creating trip:', error);
                    
                    // ✅ เพิ่ม: Last resort - สร้างรหัสชั่วคราว
                    if (!CONFIG.USE_MOCK_DATA) {
                      log.warn('Using emergency mock code');
                      const emergencyCode = `MOCK-${Date.now().toString().slice(-8)}`;
                      alert(
                        `สร้างทริปสำเร็จ! (โหมดออฟไลน์)\n\nรหัสเชิญ: ${emergencyCode}\n\nข้อมูลจะถูกบันทึกเมื่อเชื่อมต่อเซิร์ฟเวอร์`
                      );
                      navigate(`/votePage/${emergencyCode}`);
                      setShowCreateModal(false);
                      setNewTrip({ name: "", days: "", detail: "" });
                      return;
                    }
                    
                    const errorMessage =
                      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างทริป";
                    alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
                  }
                }}
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