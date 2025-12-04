import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";

const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { tripCode } = useParams<{ tripCode: string }>();
  const [tripData, setTripData] = useState<any>(null);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/");
  };

  // โหลดข้อมูลทริป
  useEffect(() => {
    if (!tripCode) {
      alert("ไม่พบรหัสทริป");
      navigate("/homepage");
      return;
    }

    const savedTrip = localStorage.getItem(`trip_${tripCode}`);
    if (savedTrip) {
      try {
        const data = JSON.parse(savedTrip);
        setTripData(data);
        console.log("โหลดข้อมูลสรุปผล:", data);
      } catch (error) {
        console.error("Error loading trip:", error);
      }
    } else {
      alert("ไม่พบข้อมูลทริป");
      navigate("/homepage");
    }
  }, [tripCode, navigate]);

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <Header onLogout={handleLogout} />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate("/homepage")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
        >
          ← กลับไปหน้าหลัก
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 สรุปผลทริป: {tripData.name}
              </h1>
              <p className="text-gray-600">รหัสทริป: {tripCode}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                ✓ เสร็จสิ้นแล้ว
              </span>
            </div>
          </div>
        </div>

        {/* รายละเอียดทริป */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* ข้อมูลพื้นฐาน */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📝 รายละเอียดทริป
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-medium">จำนวนวัน:</span>
                <span className="font-semibold">{tripData.days}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-medium">รายละเอียด:</span>
                <span className="font-semibold">{tripData.detail || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-medium">วันที่เลือก:</span>
                <span className="font-semibold text-blue-600">
                  {tripData.selectedDate || "ยังไม่ได้เลือก"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">จังหวัดที่เลือก:</span>
                <span className="font-semibold text-blue-600">
                  {tripData.selectedProvince || "ยังไม่ได้เลือก"}
                </span>
              </div>
            </div>
          </div>

          {/* สมาชิก */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              👥 สมาชิกในทริป
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">จำนวนสมาชิก:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {tripData.members?.length || 0} คน
                </span>
              </div>
              {tripData.members && tripData.members.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {tripData.members.map((member: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <span>{member.name || `สมาชิก ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">ยังไม่มีสมาชิก</p>
              )}
            </div>
          </div>
        </div>

        {/* ผลโหวตวันที่ */}
        {tripData.voteResults?.dates && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📅 ผลโหวตวันที่
            </h2>
            <div className="space-y-3">
              {tripData.voteResults.dates.map((dateVote: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-semibold">{dateVote.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{
                          width: `${
                            (dateVote.votes /
                              Math.max(
                                ...tripData.voteResults.dates.map((d: any) => d.votes)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-blue-600 w-16 text-right">
                      {dateVote.votes} คะแนน
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ผลโหวตจังหวัด */}
        {tripData.voteResults?.provinces && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🗺️ ผลโหวตจังหวัด (Borda Count)
            </h2>
            <div className="space-y-3">
              {tripData.voteResults.provinces.map((province: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    index === 0
                      ? "bg-yellow-50 border-2 border-yellow-400"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="text-2xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-lg">{province.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          index === 0 ? "bg-yellow-500" : "bg-blue-600"
                        }`}
                        style={{
                          width: `${
                            (province.score /
                              Math.max(
                                ...tripData.voteResults.provinces.map((p: any) => p.score)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-blue-600 w-16 text-right">
                      {province.score} คะแนน
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SummaryPage;