import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { TripData, Member } from '../../../data/mockData';
import { THAILAND_PROVINCES } from '../../../constants/provinces';

// ============== TYPES ==============
interface StepPlaceProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  tripCode: string;
}

// ============== CONSTANTS ==============
const WEIGHTS = [3, 2, 1]; // คะแนนโหวต: อันดับ 1 = 3, อันดับ 2 = 2, อันดับ 3 = 1

// ============== COMPONENT ==============
export const StepPlace: React.FC<StepPlaceProps> = ({
  trip,
  setTrip,
  memberBudget,
  tripCode
}) => {
  // ============== STATE ==============
  const initialProvinces = trip.voteResults?.provinces || [];
  const [globalScores, setGlobalScores] = useState<Record<string, number>>(() => {
    const scores: Record<string, number> = {};
    initialProvinces.forEach(p => {
      scores[p.name] = p.score;
    });
    return scores;
  });
  
  const [myVote, setMyVote] = useState<(string | "")[]>(["", "", ""]);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [voteHistory, setVoteHistory] = useState<string[]>([]);

  // ============== LOAD USER VOTE ==============
  useEffect(() => {
    const myVoteData = trip.provinceVotes?.find(v => v.memberId === memberBudget?.id);
    if (myVoteData && myVoteData.votes) {
      setMyVote(myVoteData.votes);
      setHasVoted(true);
    }
  }, [trip.provinceVotes, memberBudget]);

  // ============== HANDLERS ==============
  
  /**
   * เลือกจังหวัดในแต่ละอันดับ
   */
  const handleSelect = (index: number, value: string) => {
    if (myVote.includes(value)) return; // ห้ามเลือกซ้ำ
    const updated = [...myVote];
    updated[index] = value;
    setMyVote(updated);
  };

  /**
   * ส่งคะแนนโหวต
   */
  const submitVotes = async () => {
    // Validation
    const uniqueVotes = new Set(myVote);
    if (uniqueVotes.size !== 3) {
      setError("กรุณาเลือกจังหวัดที่ต่างกัน 3 จังหวัด");
      return;
    }
    if (myVote.includes("")) {
      setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
      return;
    }
    setError("");

    const oldScores = { ...globalScores };
    const wasVoted = hasVoted;

    const newScores = { ...globalScores };

    // ถ้าเคยโหวตแล้ว ให้ลบคะแนนเดิมออก
    if (hasVoted) {
      myVote.forEach((province, index) => {
        if (province) {
          newScores[province] = (newScores[province] || 0) - WEIGHTS[index];
          if (newScores[province] <= 0) delete newScores[province];
        }
      });
    }

    // เพิ่มคะแนนใหม่
    myVote.forEach((province, index) => {
      if (province) {
        newScores[province] = (newScores[province] || 0) + WEIGHTS[index];
      }
    });

    setGlobalScores(newScores);
    setHasVoted(true);

    const logEntry = `คุณ: 🥇${myVote[0]} 🥈${myVote[1]} 🥉${myVote[2]} (${new Date().toLocaleTimeString('th-TH')})`;
    setVoteHistory(prev => [logEntry, ...prev]);

    try {
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        response = { success: true };
      } else {
        response = await tripAPI.submitProvinceVotes(tripCode, {
          votes: myVote as string[],
          scores: newScores
        });
      }
      
      if (response.success) {
        setTrip(prev => ({
          ...prev,
          voteResults: {
            ...(prev.voteResults || {}),
            provinces: Object.entries(newScores)
              .map(([name, score]) => ({ name, score: score as number }))
              .sort((a, b) => b.score - a.score),
            dates: prev.voteResults?.dates || []
          }
        }));
        
        log.success("บันทึกผลโหวตสำเร็จ");
      }
    } catch (error: any) {
      log.error("Error saving votes:", error);
      alert("เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถบันทึกผลโหวต"));
      
      // Rollback
      setGlobalScores(oldScores);
      setHasVoted(wasVoted);
      setVoteHistory(prev => prev.slice(1));
    }
  };

  // ============== COMPUTED VALUES ==============
  const sortedProvinces = Object.entries(globalScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // แสดง Top 10

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ============== ส่วนโหวต ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          🗳️ เลือกจังหวัดที่อยากไป (อันดับ 1–3)
        </h2>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="font-semibold text-blue-900">วิธีคำนวณคะแนน (Borda Count):</p>
          <ul className="mt-2 space-y-1 text-blue-800 text-sm">
            <li>• อันดับ 1 = 3 คะแนน</li>
            <li>• อันดับ 2 = 2 คะแนน</li>
            <li>• อันดับ 3 = 1 คะแนน</li>
          </ul>
        </div>

        {/* แสดงสถานะการโหวต */}
        {hasVoted && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-800">
              ✓ คุณโหวตแล้ว: 🥇 {myVote[0]} • 🥈 {myVote[1]} • 🥉 {myVote[2]}
            </p>
            <p className="text-green-700 text-sm mt-1">
              คุณสามารถแก้ไขโหวตได้ตลอดเวลา
            </p>
          </div>
        )}

        {/* Dropdowns */}
        {[0, 1, 2].map(i => (
          <div key={i} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} อันดับ {i + 1} ({WEIGHTS[i]} คะแนน):
            </label>
            <select
              value={myVote[i]}
              onChange={e => handleSelect(i, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
            >
              <option value="">-- เลือกจังหวัด --</option>
              {THAILAND_PROVINCES.map(p => (
                <option 
                  key={p} 
                  value={p} 
                  disabled={myVote.includes(p) && myVote[i] !== p}
                >
                  {p}
                </option>
              ))}
            </select>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={submitVotes}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
        >
          {hasVoted ? "แก้ไขโหวต" : "ยืนยันโหวต"}
        </button>
      </div>

      {/* ============== แสดงผลโหวต Real-time ============== */}
      {sortedProvinces.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              🏆 ผลโหวตปัจจุบัน (Real-time)
            </h3>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-800 text-sm">
              <strong>📊 อัปเดตแบบเรียลไทม์:</strong> ผลโหวตนี้แสดงคะแนนล่าสุดจากสมาชิกทั้งหมด
              {hasVoted && " (รวมคะแนนของคุณด้วย)"}
            </p>
          </div>

          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {sortedProvinces.slice(0, 3).map(([name, value], index) => (
              <div
                key={name}
                className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' :
                  index === 1 ? 'border-gray-400 bg-gray-50' :
                  'border-orange-400 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <div>
                      <p className="font-bold text-lg text-gray-800">{name}</p>
                      <p className="text-sm text-gray-600">อันดับ {index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-600">คะแนน</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedProvinces.map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                interval={0}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tie Warning */}
          {sortedProvinces.length >= 2 && sortedProvinces[0][1] === sortedProvinces[1][1] && (
            <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="font-semibold text-amber-900">⚠️ คะแนนเสมอกัน!</p>
              <p className="text-amber-800 text-sm mt-1">
                {sortedProvinces[0][0]} และ {sortedProvinces[1][0]} มีคะแนนเท่ากัน! 
                แนะนำให้สมาชิกที่ยังไม่ได้โหวตเข้ามาโหวตเพิ่ม
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <div className="text-gray-400 mb-3">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-lg font-semibold text-gray-600 mb-2">
            ยังไม่มีใครโหวต
          </p>
          <p className="text-sm text-gray-500">
            เป็นคนแรกที่เลือกจังหวัดที่อยากไปกัน!
          </p>
        </div>
      )}

      {/* ============== ประวัติการโหวต ============== */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📝 ประวัติการโหวต</h3>
        <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
          {voteHistory.length > 0 ? (
            voteHistory.map((entry, idx) => (
              <p key={idx} className="text-sm text-gray-800 mb-1">{entry}</p>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติการโหวต</p>
          )}
        </div>
      </div>
    </div>
  );
};