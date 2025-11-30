import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User } from "lucide-react";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const myTrips = [
    { name: "ทริปเชียงใหม่", days: "2 วัน", people: 4, status: "กำลังรวบรวมข้อมูล", statusColor: "bg-orange-100 text-orange-700", filled: "กรอกแล้ว 2 คน, ยังไม่กรอก 2 คน" },
    { name: "ทริปหัวหิน", days: "3 วัน", people: 6, status: "ครบแล้ว", statusColor: "bg-green-100 text-green-700", filled: "กรอกครบแล้ว 6 คน" }
  ];

  const invitedTrips = [
    { name: "ทริปพัทยา", days: "2 วัน", people: 5, status: "กำลังรอ", statusColor: "bg-orange-100 text-orange-700", filled: "กรอกแล้ว 3 คน, ยังไม่กรอก 2 คน" }
  ];

  const handleCreateTrip = () => {
    console.log("สร้างทริปใหม่");
  };
  const handleJoinTrip = (code: string) => {
    if (!code) return alert("กรุณากรอกเลขห้อง");
    console.log("เข้าร่วมทริปด้วยเลขห้อง:", code);
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
          {/* ปุ่มสร้างทริปใหม่ */}
          <button
            onClick={handleCreateTrip}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>

          {/* Input + ปุ่มเข้าร่วม */}
          <div className="md:flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="กรอกเลขห้องเพื่อเข้าร่วม"
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onPaste={(e) => setRoomCode(e.clipboardData.getData("text"))}
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

        {/* ทริปของฉัน */}
        <h2 className="text-2xl font-bold text-blue-900 mb-3">สร้างโดยฉัน</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {myTrips.map((trip, index) => (
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
              <button className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition">
                แก้ไข
              </button>
            </div>
          ))}
        </div>

        {/* ทริปที่ถูกเชิญ */}
        <h2 className="text-2xl font-bold text-blue-900 mb-3">ถูกเชิญเข้าร่วม</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invitedTrips.map((trip, index) => (
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
              <button className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition">
                ดูรายละเอียด
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
