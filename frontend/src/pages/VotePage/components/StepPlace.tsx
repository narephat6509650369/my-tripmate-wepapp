import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { THAILAND_PROVINCES } from '../../../constants/provinces';
import { TripData, Member, BudgetPriority, HistoryEntry } from '../../../data/mockData';

// ============== TYPES ==============
interface StepPlaceProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  tripCode: string;
  addHistory: (step: number, stepName: string, action: string) => void;
  onNavigateToStep: (step: number) => void;
}

// ============== CONSTANTS ==============
const WEIGHTS = [3, 2, 1];

// ============== COMPONENT ==============
export const StepPlace: React.FC<StepPlaceProps> = ({
  trip,
  setTrip,
  memberBudget,
  tripCode,
  addHistory,
  onNavigateToStep
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followMajority, setFollowMajority] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ============== LOAD USER VOTE ==============
  useEffect(() => {
    const myVoteData = trip.provinceVotes?.find(v => v.memberId === memberBudget?.id);
    if (myVoteData && myVoteData.votes) {
      setMyVote(myVoteData.votes);
      setHasVoted(true);
    }
  }, [trip.provinceVotes, memberBudget]);

  // ============== AUTO-SAVE LISTENER ==============
  useEffect(() => {
    const handleAutoSave = () => {
      console.log('📥 Received auto-save event for provinces');
      
      if (followMajority && (!myVote[0] || !myVote[1] || !myVote[2])) {
        const topProvinces = (trip.voteResults?.provinces || [])
          .slice(0, 3)
          .map(p => p.name);
        
        if (topProvinces.length >= 3) {
          setMyVote([topProvinces[0], topProvinces[1], topProvinces[2]]);
          setTimeout(() => submitVotes(), 100);
          return;
        }
      }
      
      if (myVote[0] && myVote[1] && myVote[2]) {
        submitVotes();
      }
    };
    
    window.addEventListener('auto-save-provinces', handleAutoSave);
    
    return () => {
      window.removeEventListener('auto-save-provinces', handleAutoSave);
    };
  }, [myVote, followMajority]);

  // ============== HANDLERS ==============
  const handleSelect = (index: number, value: string) => {
    if (myVote.includes(value)) return;
    const updated = [...myVote];
    updated[index] = value;
    setMyVote(updated);
  };

  const submitVotes = async () => {
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

    if (isSubmitting) {
      console.log('⏳ Already submitting, please wait...');
      return;
    }

    const oldScores = { ...globalScores };
    const oldProvinceVotes = trip.provinceVotes || [];
    const wasVoted = hasVoted;

    const newScores = { ...globalScores };

    if (hasVoted) {
      myVote.forEach((province, index) => {
        if (province) {
          newScores[province] = (newScores[province] || 0) - WEIGHTS[index];
          if (newScores[province] <= 0) delete newScores[province];
        }
      });
    }

    myVote.forEach((province, index) => {
      if (province) {
        newScores[province] = (newScores[province] || 0) + WEIGHTS[index];
      }
    });

    setGlobalScores(newScores);
    setHasVoted(true);

    setIsSubmitting(true);

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
          provinceVotes: [
            ...(prev.provinceVotes || []).filter(v => v.memberId !== memberBudget?.id),
            {
              memberId: memberBudget?.id || '',
              memberName: memberBudget?.name || '',
              votes: myVote as string[],
              timestamp: Date.now()
            }
          ],
          voteResults: {
            ...(prev.voteResults || {}),
            provinces: Object.entries(newScores)
              .map(([name, score]) => ({ name, score: score as number }))
              .sort((a, b) => b.score - a.score),
            dates: prev.voteResults?.dates || []
          }
        }));
        
        addHistory(4, 'สถานที่', `โหวต: 🥇${myVote[0]} 🥈${myVote[1]} 🥉${myVote[2]}`);
        
        log.success("บันทึกผลโหวตสำเร็จ");
      }
    } catch (error: any) {
      log.error("Error saving votes:", error);
      
      setGlobalScores(oldScores);
      setHasVoted(wasVoted);
      
      setTrip(prev => ({
        ...prev,
        provinceVotes: oldProvinceVotes
      }));
    } finally {  
      setIsSubmitting(false);
    }
  };

  // ============== COMPUTED VALUES ==============
  const sortedProvinces = Object.entries(globalScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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

        {/* Follow Majority */}
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={followMajority}
              onChange={(e) => {
                const checked = e.target.checked;
                setFollowMajority(checked);
                
                if (checked) {
                  const topProvinces = (trip.voteResults?.provinces || [])
                    .slice(0, 3)
                    .map(p => p.name);
                  
                  if (topProvinces.length >= 3) {
                    setMyVote([topProvinces[0], topProvinces[1], topProvinces[2]]);
                  } else {
                    setFollowMajority(false);
                  }
                }
              }}
              className="mt-1 w-5 h-5 text-purple-600"
            />
            <div>
              <p className="font-semibold text-purple-900">✨ โหวตตามเพื่อนส่วนใหญ่</p>
              <p className="text-sm text-purple-700 mt-1">
                ระบบจะเลือก Top 3 จังหวัดที่ได้รับความนิยมให้อัตโนมัติ
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* ✅ ปุ่มดูผลลัพธ์ */}
      {(myVote[0] || myVote[1] || myVote[2]) && sortedProvinces.length > 0 && (
        <button
          onClick={() => setShowResults(!showResults)}
          className="w-full px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
          aria-label={showResults ? 'ซ่อนผลลัพธ์' : 'ดูผลลัพธ์'}
        >
          <span>📊</span>
          <span className="hidden sm:inline">{showResults ? 'ซ่อน' : 'ดู'}ผลลัพธ์ล่าสุด</span>
          <span className="sm:hidden">{showResults ? 'ซ่อน' : 'ดู'}ผล</span>
          {showResults ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      )}

      {/* ============== Dashboard (Collapsible) ============== */}
      {showResults && (myVote[0] || myVote[1] || myVote[2]) && sortedProvinces.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🏆</span>
            <span>ผลโหวตปัจจุบัน</span>
          </h3>

          <div className="space-y-2">
            {sortedProvinces.slice(0, 5).map(([name, value], index) => (
              <div
                key={name}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' :
                  index === 1 ? 'border-gray-300 bg-gray-50' :
                  index === 2 ? 'border-orange-300 bg-orange-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(value / (sortedProvinces[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-800 w-8 text-right">
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {sortedProvinces.length > 5 && (
            <button
              onClick={() => {/* Toggle show all */}}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ดูทั้งหมด ({sortedProvinces.length} จังหวัด) →
            </button>
          )}
        </div>
      )}
    </div>
  );
};