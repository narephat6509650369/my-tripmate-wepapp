import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User } from "lucide-react";
import { generateUniqueInviteCode, validateInviteCode, isCodeExists } from "../utils/inviteCode";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  // สร้าง mock data เมื่อโหลดครั้งแรก
  useEffect(() => {
    const mockTrips = [
      {
        id: "ABCD-EFGH-JKLM-NPQR",
        name: "ทริปเชียงใหม่",
        days: "2 วัน",
        detail: "เที่ยวเชียงใหม่ 2 วัน 1 คืน",
        members: [],
        createdAt: Date.now(),
        isCompleted: false
      },
      {
        id: "WXYZ-2345-6789-ABCD",
        name: "ทริปหัวหิน",
        days: "3 วัน",
        detail: "พักผ่อนหัวหิน 3 วัน 2 คืน",
        members: [
          { 
            id: "1", 
            name: "สมชาย", 
            gender: "ชาย",
            budget: { accommodation: 1500, transport: 200, food: 2000, other: 0 }
          },
          { 
            id: "2", 
            name: "สมหญิง", 
            gender: "หญิง",
            budget: { accommodation: 1200, transport: 150, food: 1800, other: 0 }
          },
          { 
            id: "3", 
            name: "สมศรี", 
            gender: "หญิง",
            budget: { accommodation: 1800, transport: 300, food: 2200, other: 500 }
          },
          { 
            id: "4", 
            name: "สมปอง", 
            gender: "ชาย",
            budget: { accommodation: 1600, transport: 250, food: 2100, other: 200 }
          },
          { 
            id: "5", 
            name: "สมใจ", 
            gender: "หญิง",
            budget: { accommodation: 1400, transport: 180, food: 1900, other: 100 }
          },
          { 
            id: "6", 
            name: "สมบูรณ์", 
            gender: "ชาย",
            budget: { accommodation: 1700, transport: 280, food: 2300, other: 300 }
          }
        ],
        createdAt: Date.now(),
        isCompleted: true,
        selectedDate: "18/11/2568",
        selectedProvince: "เพชรบุรี",
        totalBudget: 15000,
        voteResults: {
          dates: [
            { date: "18/11/2568", votes: 6 },
            { date: "17/11/2568", votes: 3 },
            { date: "5/11/2568", votes: 2 }
          ],
          provinces: [
            { name: "เพชรบุรี", score: 12 },
            { name: "ชลบุรี", score: 8 },
            { name: "ระยอง", score: 5 }
          ]
        }
      },
      {
        id: "ZYXW-VUTS-RQPN-MLKJ",
        name: "ทริปพัทยา",
        days: "2 วัน",
        detail: "เที่ยวพัทยา 2 วัน 1 คืน",
        members: [],
        createdAt: Date.now(),
        isCompleted: false
      }
    ];

    mockTrips.forEach(trip => {
      if (!localStorage.getItem(`trip_${trip.id}`)) {
        localStorage.setItem(`trip_${trip.id}`, JSON.stringify(trip));
      }
    });
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    days: "",
    detail: "",
  });

  // ✅ State สำหรับทริปของฉัน
  const [myTrips, setMyTrips] = useState<any[]>([]);

  // ✅ State สำหรับทริปที่ถูกเชิญ
  const [invitedTrips, setInvitedTrips] = useState<any[]>([]);

  // ✅ โหลดทริปของฉัน
  useEffect(() => {
    const loadMyTrips = () => {
      const trips: any[] = []; // ✅ แก้ไขแล้ว: เพิ่ม type annotation
      const mockIds = ["ABCD-EFGH-JKLM-NPQR", "WXYZ-2345-6789-ABCD"];
      
      mockIds.forEach(id => {
        const savedTrip = localStorage.getItem(`trip_${id}`);
        if (savedTrip) {
          const tripData = JSON.parse(savedTrip);
          const filled = tripData.members?.filter((m: any) => 
            m.budget?.accommodation > 0 && 
            m.budget?.transport > 0 && 
            m.budget?.food > 0
          ).length || 0;
          const totalMembers = tripData.members?.length || 0;
          
          trips.push({
            id: tripData.id,
            name: tripData.name,
            days: tripData.days,
            people: totalMembers,
            status: tripData.isCompleted ? "ครบแล้ว" : "กำลังรวบรวมข้อมูล",
            statusColor: tripData.isCompleted ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
            filled: totalMembers > 0 
              ? `กรอกแล้ว ${filled} คน${totalMembers - filled > 0 ? `, ยังไม่กรอก ${totalMembers - filled} คน` : ''}` 
              : "ยังไม่มีสมาชิก",
            isCompleted: tripData.isCompleted || false
          });
        }
      });
      
      setMyTrips(trips);
    };
    
    loadMyTrips();
  }, []);

  // ✅ โหลดทริปที่ถูกเชิญ
  useEffect(() => {
    const loadInvitedTrips = () => {
      const trips: any[] = []; // ✅ แก้ไขแล้ว: เพิ่ม type annotation
      const invitedIds = ["ZYXW-VUTS-RQPN-MLKJ"];
      
      invitedIds.forEach(id => {
        const savedTrip = localStorage.getItem(`trip_${id}`);
        if (savedTrip) {
          const tripData = JSON.parse(savedTrip);
          const filled = tripData.members?.filter((m: any) => 
            m.budget?.accommodation > 0 && 
            m.budget?.transport > 0 && 
            m.budget?.food > 0
          ).length || 0;
          const totalMembers = tripData.members?.length || 0;
          
          trips.push({
            id: tripData.id,
            name: tripData.name,
            days: tripData.days,
            people: totalMembers,
            status: tripData.isCompleted ? "ครบแล้ว" : "กำลังรอ",
            statusColor: tripData.isCompleted ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
            filled: totalMembers > 0 
              ? `กรอกแล้ว ${filled} คน${totalMembers - filled > 0 ? `, ยังไม่กรอก ${totalMembers - filled} คน` : ''}` 
              : "ยังไม่มีสมาชิก",
            isCompleted: tripData.isCompleted || false
          });
        }
      });
      
      setInvitedTrips(trips);
    };
    
    loadInvitedTrips();
  }, []);

  const handleCreateTrip = () => setShowCreateModal(true);
  
  const handleJoinTrip = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }
    
    if (!validateInviteCode(cleanCode)) {
      alert("รูปแบบรหัสห้องไม่ถูกต้อง\nรูปแบบที่ถูกต้อง: XXXX-XXXX-XXXX-XXXX");
      return;
    }
    
    if (!isCodeExists(cleanCode)) {
      alert("ไม่พบรหัสห้องนี้ กรุณาตรวจสอบอีกครั้ง");
      return;
    }
    
    navigate(`/votePage/${cleanCode}`);
    setRoomCode("");
  };
  
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/");
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

        {/* Section ทริป */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px] overflow-y-auto">
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ยกเลิก
              </button>

              <button
                onClick={() => {
                  if (!newTrip.name || !newTrip.days) {
                    alert("กรุณากรอกข้อมูลให้ครบ");
                    return;
                  }
                  
                  try {
                    const inviteCode = generateUniqueInviteCode();
                    
                    const tripData = {
                      id: inviteCode,
                      ...newTrip,
                      members: [],
                      createdAt: Date.now(),
                      createdBy: "current_user_id",
                      isCompleted: false
                    };
                    
                    localStorage.setItem(`trip_${inviteCode}`, JSON.stringify(tripData));
                    
                    alert(`สร้างทริปสำเร็จ!\n\nรหัสเชิญ: ${inviteCode}\n\nกรุณาบันทึกรหัสนี้ไว้`);
                    
                    navigate(`/votePage/${inviteCode}`);
                    
                    setShowCreateModal(false);
                    setNewTrip({ name: "", days: "", detail: "" });
                  } catch (error) {
                    alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างทริป");
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
