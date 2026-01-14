// src/pages/VotePage/components/StepPlace.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { voteAPI } from '../../../services/tripService';
import { THAILAND_PROVINCES } from '../../../constants/provinces';
import type { TripDetail } from '../../../types';

// ============== TYPES ==============
interface StepPlaceProps {
  trip: TripDetail;
  onVote: (votes: [string, string, string]) => void;
}

// ============== CONSTANTS ==============
const WEIGHTS = [3, 2, 1];

// ============== COMPONENT ==============
export const StepPlace: React.FC<StepPlaceProps> = ({ trip, onVote }) => {
  // ============== STATE ==============
  const [myVote, setMyVote] = useState<[string, string, string]>(["", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ============== HANDLERS ==============
  const handleSelect = (index: number, value: string) => {
    if (myVote.includes(value)) {
      setError("กรุณาเลือกจังหวัดที่แตกต่างกัน");
      return;
    }
    
    const updated = [...myVote] as [string, string, string];
    updated[index] = value;
    setMyVote(updated);
    setError("");
  };

  const handleSubmit = async () => {
    // Validation
    if (myVote.includes("")) {
      setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
      return;
    }

    const uniqueVotes = new Set(myVote);
    if (uniqueVotes.size !== 3) {
      setError("กรุณาเลือกจังหวัดที่ต่างกัน 3 จังหวัด");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onVote(myVote);
      alert(`✅ โหวตสำเร็จ!\n\n🥇 ${myVote[0]}\n🥈 ${myVote[1]}\n🥉 ${myVote[2]}`);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('เกิดข้อผิดพลาดในการส่งคะแนน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============== RENDER ==============
  return (
    <div className="space-y-6">
      {/* ส่วนโหวต */}
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

        {/* Dropdowns */}
        {[0, 1, 2].map(i => (
          <div key={i} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} อันดับ {i + 1} ({WEIGHTS[i]} คะแนน):
            </label>
            <select
              value={myVote[i]}
              onChange={e => handleSelect(i, e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
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

        {/* ปุ่มส่งคะแนน */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || myVote.includes("")}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              กำลังส่งคะแนน...
            </span>
          ) : (
            '✓ ส่งคะแนนโหวต'
          )}
        </button>

        {/* แสดงการโหวตปัจจุบัน */}
        {myVote.filter(v => v !== "").length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="font-semibold text-green-900 mb-2">การโหวตของคุณ:</p>
            <div className="space-y-1 text-green-800 text-sm">
              {myVote[0] && <p>🥇 อันดับ 1: {myVote[0]} (3 คะแนน)</p>}
              {myVote[1] && <p>🥈 อันดับ 2: {myVote[1]} (2 คะแนน)</p>}
              {myVote[2] && <p>🥉 อันดับ 3: {myVote[2]} (1 คะแนน)</p>}
            </div>
          </div>
        )}
      </div>

      {/* คำแนะนำ */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
        <p className="text-sm text-purple-800">
          💡 <strong>เคล็ดลับ:</strong> ลองดูผลโหวตของเพื่อนๆ เพื่อช่วยในการตัดสินใจ
        </p>
        <p className="text-xs text-purple-700 mt-1">
          คุณสามารถแก้ไขการโหวตได้ตลอดเวลาก่อนที่เจ้าของทริปจะปิดการโหวต
        </p>
      </div>
    </div>
  );
};

export default StepPlace;