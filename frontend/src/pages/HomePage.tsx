import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User } from "lucide-react";
import { tripAPI } from "../services/api";

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
      const response = await tripAPI.getMyTrips();
      
      // ตรวจสอบ response
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to load trips');
      }
      
      // ตรวจสอบ data
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data format from server');
      }
      
      // แยกทริปที่สร้างเองกับทริปที่ถูกเชิญ
      const userId = localStorage.getItem('userId');
      
      const created = response.data.filter((trip: any) => trip.createdBy === userId);
      const invited = response.data.filter((trip: any) => trip.createdBy !== userId);
      
      // Format ข้อมูลให้ตรงกับ UI
      setMyTrips(created.map((trip: any) => formatTripData(trip)));
      setInvitedTrips(invited.map((trip: any) => formatTripData(trip)));
    } catch (error) {
      console.error('Error loading trips:', error);
      
      // ปรับข้อความ error ให้ชัดเจน
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'ไม่สามารถโหลดข้อมูลทริปได้';
      
      alert(`เกิดข้อผิดพลาด: ${errorMessage}\nกรุณาลองใหม่อีกครั้ง`);
      
      // ตั้งค่าเป็น array ว่าง เพื่อป้องกัน undefined error
      setMyTrips([]);
      setInvitedTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชัน format ข้อมูล
  const formatTripData = (trip: any) => {
    const filled = trip.members?.filter((m: any) => 
      m.budget?.accommodation > 0 && 
      m.budget?.transport > 0 && 
      m.budget?.food > 0
    ).length || 0;
    const totalMembers = trip.members?.length || 0;
    
    return {
      id: trip._id || trip.id,
      name: trip.name,
      days: trip.days,
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
    
    try {
      const response = await tripAPI.joinTrip(cleanCode);
      
      if (response.success) {
        alert('เข้าร่วมทริปสำเร็จ!');
        navigate(`/votePage/${response.data.tripId}`);
        setRoomCode("");
        loadTrips(); // โหลดทริปใหม่
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      console.error('Error joining trip:', error);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue- 50 to-indigo-50">
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
                      <div key={index} className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer">
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>{trip.status}</span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <span className="font-medium">{trip.days}</span>
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
                              navigate(`/summaryPage/${trip.id}`);
                            } else {
                              navigate(`/votePage/${trip.id}`);
                            }
                          }}
                          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                        >
                          {trip.isCompleted ? 'ดูสรุปผล' : 'แก้ไข'}
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
                      <div key={index} className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer">
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>{trip.status}</span>
                        </div>
                        <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-blue-900">
                            <span className="font-medium">{trip.days}</span>
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
                              navigate(`/summaryPage/${trip.id}`);
                            } else {
                              navigate(`/votePage/${trip.id}`);
                            }
                          }}
                          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                        >
                          {trip.isCompleted ? 'ดูสรุปผล' : 'ดูรายละเอียด'}
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
              <label className="block text-sm font-medium text-blue-900 mb-1">
                ชื่อทริป
              </label>
              <input
                type="text"
                className="w-full border border-blue-300 rounded-lg px-3 py-2"
                value={newTrip.name}
                onChange={(e) =>
                  setNewTrip({ ...newTrip, name: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                จำนวนวัน
              </label>
              <input
                type="number"
                className="w-full border border-blue-300 rounded-lg px-3 py-2"
                value={newTrip.days}
                onChange={(e) =>
                  setNewTrip({ ...newTrip, days: e.target.value })
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                รายละเอียด
              </label>
              <textarea
                className="w-full border border-blue-300 rounded-lg px-3 py-2 h-24"
                value={newTrip.detail}
                onChange={(e) =>
                  setNewTrip({ ...newTrip, detail: e.target.value })
                }
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
                  if (!newTrip.name || !newTrip.days) {
                    alert("กรุณากรอกข้อมูลให้ครบ");
                    return;
                  }
                  
                  try {
                    const response = await tripAPI.createTrip(newTrip);

                    // ตรวจสอบ response
                    if (!response || !response.success) {
                      throw new Error(response?.message || 'Failed to create trip');
                    }

                    // ดึง tripId จาก response
                    const tripId = response.data?._id || response.data?.id;
                    if (!tripId) {
                      throw new Error('Trip ID not found in response');
                    }
                    
                    // สร้าง invite code
                    const inviteResponse = await tripAPI.generateInviteCode(tripId);

                    // ตรวจสอบ invite code response
                    if (!inviteResponse || !inviteResponse.success) {
                      throw new Error('Failed to generate invite code');
                    }
                    
                    // แสดง alert พร้อมรหัสเชิญ
                    if (inviteResponse.data?.inviteCode) {
                      alert(`สร้างทริปสำเร็จ!\n\nรหัสเชิญ: ${inviteResponse.data.inviteCode}\n\nกรุณาบันทึกรหัสนี้ไว้`);
                      navigate(`/votePage/${tripId}`);
                    }
                    
                    setShowCreateModal(false);
                    setNewTrip({ name: "", days: "", detail: "" });
                    loadTrips();
                  } catch (error) {
                    console.error('Error creating trip:', error);
                    
                    const errorMessage = error instanceof Error 
                      ? error.message 
                      : 'เกิดข้อผิดพลาดในการสร้างทริป';
                    
                    alert(`เกิดข้อผิดพลาด: ${errorMessage}\nกรุณาลองใหม่อีกครั้ง`);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>  
  );
};

export default HomePage;