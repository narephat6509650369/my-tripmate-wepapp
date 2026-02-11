// src/pages/VotePage/components/StepPlace.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { voteAPI } from '../../../services/tripService';
import { THAILAND_PROVINCES } from '../../../constants/provinces';
import type { LocationVote, TripDetail } from '../../../types';

// ============== TYPES ==============
interface StepPlaceProps {
  trip: TripDetail;
  initialVotes?: { place: string; score: number }[];
  onVote: (votes: LocationVote[]) => Promise<void>;
  onManualNext?: () => void;
  onInputChange?: () => void;
}

interface VotingResult {
  place: string;
  total_score: number;
  vote_count: number;
  voters: string[];
  rank_distribution: {
    rank_1: number;
    rank_2: number;
    rank_3: number;
  };
  region?: string;
}

interface AnalysisResult {
  hasWinner: boolean;
  topProvinces?: Array<{
    name: string;
    score: number;
    rank1: number;
    region: string;
  }>;
  bestRegion?: {
    region: string;
    topProvinces: Array<{
      name: string;
      score: number;
      rank1: number;
    }>;
    provinces: string[];
    totalScore: number;
    weightedScore: number;
    rank1Count: number;
    diversity: number;
    explanation: string;
  };
}

// ============== CONSTANTS ==============
const WEIGHTS = [3, 2, 1] as const;

const PROVINCE_REGIONS: Record<string, string[]> = {
  'ภาคเหนือ': [
    'เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน',
    'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์'
  ],
  'ภาคตะวันออกเหนือ': [
    'นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'อุบลราชธานี',
    'ยโสธร', 'ชัยภูมิ', 'อำนาจเจริญ', 'หนองบัวลำภู', 'ขอนแก่น',
    'อุดรธานี', 'เลย', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด',
    'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'บึงกาฬ'
  ],
  'ภาคกลาง': [
    'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ',
    'นครปฐม', 'สมุทรสาคร', 'สมุทรสงคราม', 'พระนครศรีอยุธยา',
    'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี',
    'ฉะเชิงเทรา', 'ปราจีนบุรี', 'นครนายก', 'สุพรรณบุรี',
    'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'
  ],
  'ภาคตะวันออก': [
    'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'สระแก้ว'
  ],
  'ภาคใต้': [
    'นครศรีธรรมราช', 'กระบี่', 'พังงา', 'ภูเก็ต', 'สุราษฎร์ธานี',
    'ระนอง', 'ชุมพร', 'สงขลา', 'สตูล', 'ตรัง', 'พัทลุง',
    'ปัตตานี', 'ยะลา', 'นราธิวาส'
  ],
  'ภาคตะวันตก': [
    'ตาก', 'กำแพงเพชร', 'พิษณุโลก', 'สุโขทัย', 'พิจิตร',
    'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'
  ]
};

// ============== HELPER FUNCTIONS ==============
const getRegion = (province: string): string => {
  for (const [region, provinces] of Object.entries(PROVINCE_REGIONS)) {
    if (provinces.includes(province)) {
      return region;
    }
  }
  return 'ไม่ระบุภูมิภาค';
};

const calculateUniqueVoters = (results: VotingResult[]): number => {
  return results.reduce((acc, r) => {
    r.voters.forEach(v => acc.add(v));
    return acc;
  }, new Set<string>()).size;
};

// ============== MAIN COMPONENT ==============
export const StepPlace: React.FC<StepPlaceProps> = ({
  trip,
  initialVotes = [],
  onVote,
  onManualNext,
  onInputChange
}) => {
  // ============== STATE ==============
  const [myVote, setMyVote] = useState<[string, string, string]>(["", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [votingResults, setVotingResults] = useState<VotingResult[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // ✅ FIX: Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (justSaved) {
      const timer = setTimeout(() => setJustSaved(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [justSaved]);

  // ✅ FIX: Keyboard accessibility (ESC to close modals)
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAnalysisModal) {
          setShowAnalysisModal(false);
        } else if (justSaved) {
          setJustSaved(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [showAnalysisModal, justSaved]);

  // ✅ FIX: Load initial votes (separated from dev auto-fill)
  useEffect(() => {
    if (initialVotes.length > 0) {
      const sorted = [...initialVotes].sort((a, b) => b.score - a.score);
      const newVote: [string, string, string] = ["", "", ""];
      sorted.forEach((vote, idx) => {
        if (idx < 3) newVote[idx] = vote.place;
      });
      setMyVote(newVote);
    }
  }, [initialVotes]);

  // ✅ FIX: Dev auto-fill - separate effect, runs once on mount
  useEffect(() => {
    if (import.meta.env.DEV && initialVotes.length === 0) {
      const timer = setTimeout(() => {
        setMyVote(['เชียงใหม่', 'ภูเก็ต', 'กระบี่']);
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ FIX: Load voting results with better validation
  useEffect(() => {
    const loadVotingResults = async () => {
      if (!trip?.tripid) return;

      try {
        setIsLoading(true);
        setError('');
        const response = await voteAPI.getLocationVote(trip.tripid);

        const votingData = response?.data?.data;

        // ✅ Better validation
        if (!votingData.voting_results || !Array.isArray(votingData.voting_results)) {
          console.warn('Invalid voting results structure:', votingData);
          setVotingResults([]);
          return;
        }

        // ✅ Stricter validation
        const validResults = votingData.voting_results.filter((r: any) => {
          // Basic type checks
          if (!r.place || typeof r.total_score !== 'number' || typeof r.vote_count !== 'number') {
            return false;
          }
          
          // Negative values check
          if (r.total_score < 0 || r.vote_count < 0) {
            console.warn(`Invalid negative values for ${r.place}`);
            return false;
          }
          
          // Rank distribution validation
          if (!r.rank_distribution || 
              typeof r.rank_distribution.rank_1 !== 'number' ||
              typeof r.rank_distribution.rank_2 !== 'number' ||
              typeof r.rank_distribution.rank_3 !== 'number') {
            return false;
          }
          
          // Consistency check
          const rankSum = r.rank_distribution.rank_1 + 
                          r.rank_distribution.rank_2 + 
                          r.rank_distribution.rank_3;
          
          if (rankSum !== r.vote_count) {
            console.warn(`Inconsistent data for ${r.place}: rank_sum=${rankSum}, vote_count=${r.vote_count}`);
            // ยังคง return true เพราะอาจเป็น rounding issue
          }
          
          if (!Array.isArray(r.voters)) return false;
          
          return true;
        });

        const results = validResults.map((r: any) => ({
          ...r,
          region: getRegion(r.place)
        }));
        
        setVotingResults(results);
      } catch (err) {
        console.error("Failed to load voting results:", err);
        setVotingResults([]);
        setError('ไม่สามารถโหลดผลการโหวตได้');
      } finally {
        setIsLoading(false);
      }
    };

    loadVotingResults();
  }, [trip?.tripid]);

  // ============== VOTING ANALYSIS ALGORITHM ==============
  const analyzeVotingResults = useCallback((): AnalysisResult | null => {
    if (votingResults.length === 0) return null;

    // Calculate weighted scores for each province
    const provinceScores = votingResults.map(result => ({
      place: result.place,
      region: result.region || getRegion(result.place),
      total_score: result.total_score,
      weightedScore:
        (result.rank_distribution.rank_1 * 3) +
        (result.rank_distribution.rank_2 * 2) +
        (result.rank_distribution.rank_3 * 1),
      rank1Count: result.rank_distribution.rank_1,
      voteCount: result.vote_count
    })).sort((a, b) => {
      if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
      if (b.rank1Count !== a.rank1Count) return b.rank1Count - a.rank1Count;
      return b.total_score - a.total_score;
    });

    // Check if there's a distinct winner
    const hasDistinctWinner = provinceScores.length === 1 || (
      provinceScores[0].weightedScore > provinceScores[1].weightedScore ||
      (
        provinceScores[0].weightedScore === provinceScores[1].weightedScore &&
        provinceScores[0].rank1Count > provinceScores[1].rank1Count
      ) ||
      (
        provinceScores[0].weightedScore === provinceScores[1].weightedScore &&
        provinceScores[0].rank1Count === provinceScores[1].rank1Count &&
        provinceScores[0].total_score > provinceScores[1].total_score
      )
    );

    // CASE 1: Clear provincial winner
    if (hasDistinctWinner) {
      return {
        hasWinner: true,
        topProvinces: provinceScores.slice(0, 3).map(p => ({
          name: p.place,
          score: p.total_score,
          rank1: p.rank1Count,
          region: p.region
        }))
      };
    }

    // CASE 2: No clear winner - analyze by region
    const regionScores: Record<string, {
      weightedScore: number;
      rawScore: number;
      provinces: Set<string>;
      rank1Count: number;
    }> = {};

    votingResults.forEach(result => {
      const region = result.region || getRegion(result.place);

      if (!regionScores[region]) {
        regionScores[region] = {
          weightedScore: 0,
          rawScore: 0,
          provinces: new Set(),
          rank1Count: 0
        };
      }

      const weighted =
        (result.rank_distribution.rank_1 * 3) +
        (result.rank_distribution.rank_2 * 2) +
        (result.rank_distribution.rank_3 * 1);

      regionScores[region].weightedScore += weighted;
      regionScores[region].rawScore += result.total_score;
      regionScores[region].provinces.add(result.place);
      regionScores[region].rank1Count += result.rank_distribution.rank_1;
    });

    const sortedRegions = Object.entries(regionScores).sort(([regionA, a], [regionB, b]) => {
      if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
      if (b.rank1Count !== a.rank1Count) return b.rank1Count - a.rank1Count;
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      if (b.provinces.size !== a.provinces.size) return b.provinces.size - a.provinces.size;
      return regionA.localeCompare(regionB, 'th');
    });

    if (sortedRegions.length === 0) return null;

    const [bestRegion, data] = sortedRegions[0];

    // Find top 3 provinces in winning region
    const provincesInRegion = votingResults
      .filter(r => (r.region || getRegion(r.place)) === bestRegion)
      .map(r => ({
        place: r.place,
        weightedScore:
          (r.rank_distribution.rank_1 * 3) +
          (r.rank_distribution.rank_2 * 2) +
          (r.rank_distribution.rank_3 * 1),
        total_score: r.total_score,
        rank1Count: r.rank_distribution.rank_1
      }))
      .sort((a, b) => {
        if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
        if (b.rank1Count !== a.rank1Count) return b.rank1Count - a.rank1Count;
        return b.total_score - a.total_score;
      })
      .slice(0, 3);

    return {
      hasWinner: false,
      bestRegion: {
        region: bestRegion,
        topProvinces: provincesInRegion.map(p => ({
          name: p.place,
          score: p.total_score,
          rank1: p.rank1Count
        })),
        provinces: Array.from(data.provinces),
        totalScore: data.rawScore,
        weightedScore: data.weightedScore,
        rank1Count: data.rank1Count,
        diversity: data.provinces.size,
        explanation: `${bestRegion} มีจังหวัดยอดนิยม: ${provincesInRegion.map(p => p.place).join(', ')}`
      }
    };
  }, [votingResults]);

  // ============== HANDLERS ==============
  const handleSelect = useCallback((index: number, value: string) => {
    if (myVote.includes(value) && myVote[index] !== value) {
      setError("กรุณาเลือกจังหวัดที่แตกต่างกัน");
      return;
    }

    const updated = [...myVote] as [string, string, string];
    updated[index] = value;
    setMyVote(updated);
    setError("");
    onInputChange?.();
  }, [myVote, onInputChange]);

  const handleSubmit = async () => {
    if (myVote.includes("")) {
      setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
      return;
    }

     const payload: LocationVote[] = myVote.map((province, index) => ({
      location_name: province,
      score: WEIGHTS[index]
    }));

    setIsSubmitting(true);
    setError("");

    try {
      const startTime = Date.now();
      
      // ✅ ส่ง vote
      await onVote(payload);
      
      const elapsed = Date.now() - startTime;
      
      // ✅ ถ้า API ตอบเร็วมาก (<100ms) ให้รอเพิ่ม
      // เพราะ backend อาจยังประมวลผลไม่เสร็จ
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (elapsed < 300) {
        // ถ้า API ตอบระหว่าง 100-300ms รอนิดหน่อย
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // ถ้า API ตอบช้า (>300ms) ไม่ต้องรอเพิ่ม
      
      setJustSaved(true);

      let retries = 0;
      const maxRetries = 3;
      let hasMyVote = false;
      
      while (retries < maxRetries && !hasMyVote) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await voteAPI.getLocationVote(trip.tripid);
        const newResults = response?.data?.data?.voting_results || [];
        
        // เช็คว่า vote ของเราอยู่ในผลลัพธ์แล้วหรือยัง
        hasMyVote = newResults.some((r: any) => 
          myVote.some(place => r.place === place)
        );
        
        if (hasMyVote && newResults.length > 0) {
          const results = newResults.map((r: any) => ({
            ...r,
            region: getRegion(r.place)
          }));
          setVotingResults(results);
          break;
        }
        
        retries++;
      }
    } catch (e) {
      console.error("Failed to submit vote:", e);
      setError('ไม่สามารถส่งคะแนนโหวตได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);  // ⭐ CRITICAL: ต้องมี!
    }
  };

  // ============== RENDER: ANALYSIS MODAL ==============
  const renderAnalysisModal = () => {
    if (!showAnalysisModal) return null;

    const analysis = analyzeVotingResults();

    if (!analysis) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">ยังไม่มีข้อมูลการโหวต</p>
            <p className="text-gray-600 mb-6">รอให้สมาชิกในทริปเริ่มโหวตก่อนนะ</p>
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      );
    }

    const totalMembers = trip.members?.length || 0;
    const uniqueVoters = calculateUniqueVoters(votingResults);
    const progressPercentage = totalMembers > 0 ? Math.min(100, (uniqueVoters / totalMembers) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">🗺️ ผลโหวตปัจจุบัน</h3>
                <span className="inline-block text-xs bg-white/20 px-3 py-1 rounded-full">
                  ⚡ อัปเดตแบบเรียลไทม์
                </span>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold w-10 h-10 flex items-center justify-center transition rounded-lg hover:bg-white/10"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Progress Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-blue-900 font-bold">📊 ความคืบหน้าการโหวต</p>
                {uniqueVoters < totalMembers && (
                  <span className="text-xs text-orange-700 bg-orange-100 px-3 py-1 rounded-full animate-pulse font-medium">
                    ⏳ รอเพื่อนโหวต
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-pink-600 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-blue-900 min-w-[4rem] text-right">
                  {uniqueVoters}/{totalMembers} คน
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                💡 ผลนี้จะเปลี่ยนเมื่อมีคนโหวตเพิ่ม
              </p>
            </div>

            {/* CASE 1: Clear Winner */}
            {analysis.hasWinner && analysis.topProvinces && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">🎉</span>
                    <div>
                      <p className="font-bold text-green-900 text-xl mb-1">
                        พบจังหวัดที่คะแนนนำ!
                      </p>
                      <p className="text-sm text-green-700">
                        มีจังหวัดที่ได้คะแนนโหวตสูงกว่าคู่แข่ง
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full border border-yellow-300 font-medium whitespace-nowrap">
                    📊 ข้อมูลชั่วคราว
                  </span>
                </div>

                {/* Top 3 Provinces */}
                <div className="space-y-3">
                  {analysis.topProvinces.map((prov, idx) => (
                    <div
                      key={prov.name}
                      className={`bg-white rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                        idx === 0 ? 'border-yellow-400 shadow-lg' :
                        idx === 1 ? 'border-gray-300' :
                        'border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <div>
                            <p className="font-bold text-lg text-gray-900">
                              {prov.name}
                            </p>
                            <p className="text-xs text-gray-500">{prov.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-purple-600">
                            {prov.score}
                          </p>
                          <p className="text-xs text-gray-500">คะแนน</p>
                          {prov.rank1 > 0 && (
                            <p className="text-xs text-yellow-600 mt-1 font-medium">
                              🥇 อันดับ 1: {prov.rank1} ครั้ง
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 bg-green-100 border border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    💡 <strong>ตอนนี้:</strong> {analysis.topProvinces[0].name} นำคะแนนอยู่ 
                    {uniqueVoters < totalMembers && ' (อาจเปลี่ยนได้ถ้ามีคนโหวตเพิ่ม)'}
                  </p>
                </div>
              </div>
            )}

            {/* CASE 2: Regional Winner */}
            {!analysis.hasWinner && analysis.bestRegion && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">🎯</span>
                    <div>
                      <p className="font-bold text-orange-900 text-xl mb-1">
                        คะแนนกระจายทั่วไป - วิเคราะห์ตามภูมิภาค
                      </p>
                      <p className="text-sm text-orange-700">
                        ยังไม่มีจังหวัดที่ชัดเจน เราแนะนำตามภูมิภาคแทน
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full border border-yellow-300 font-medium whitespace-nowrap">
                    📊 ข้อมูลชั่วคราว
                  </span>
                </div>

                {/* Best Region Card */}
                <div className="bg-white rounded-xl p-5 border-2 border-orange-300 mb-4 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-3xl text-orange-800 mb-1">
                        {analysis.bestRegion.region}
                      </p>
                      <p className="text-sm text-gray-600">
                        {analysis.bestRegion.explanation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-700">
                        {analysis.bestRegion.weightedScore}
                      </p>
                      <p className="text-xs text-orange-600">คะแนน</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700">
                        {analysis.bestRegion.rank1Count}
                      </p>
                      <p className="text-xs text-yellow-600 font-medium">🥇 อันดับ 1</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {analysis.bestRegion.totalScore}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">คะแนนรวม</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {analysis.bestRegion.diversity}
                      </p>
                      <p className="text-xs text-green-600 font-medium">จังหวัด</p>
                    </div>
                  </div>
                </div>

                {/* Top 3 Provinces in Region */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-orange-900 mb-2">
                    🏆 จังหวัดยอดนิยมใน{analysis.bestRegion.region}:
                  </p>
                  {analysis.bestRegion.topProvinces.map((prov, idx) => (
                    <div
                      key={prov.name}
                      className="bg-white rounded-lg p-4 border-2 border-orange-200 flex items-center justify-between hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-semibold text-gray-900 text-lg">
                          {prov.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-orange-700">
                          {prov.score}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">คะแนน</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 bg-orange-100 border border-orange-300 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    💡 <strong>คำแนะนำ:</strong> พิจารณาเลือกจังหวัดใน{analysis.bestRegion.region} 
                    เพื่อให้ทุกคนพอใจ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4 flex gap-3">
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="flex-1 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              ปิด
            </button>
            {onManualNext && (
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  onManualNext();
                }}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 shadow-lg transition"
              >
                ไปหน้าถัดไป →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============== LOADING STATE ==============
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-14 h-14 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">กำลังโหลดข้อมูลการโหวต...</p>
      </div>
    );
  }

  // ============== MAIN RENDER ==============
  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 shadow-md animate-shake">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
              >
                ปิดข้อความนี้
              </button>
            </div>
          </div>
        )}

        {/* Voting Section */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                🗳️ เลือกจังหวัดที่อยากไป
              </h2>
              <p className="text-gray-600">เรียงลำดับตามความชอบ 3 อันดับ</p>
            </div>
            
            {/* ✅ แก้ไข: ย้ายปุ่มออกมาและแก้ structure */}
            <div className="flex gap-2">
            {votingResults.length > 0 && (
              <>
                {/* ดูผลโหวต - ปุ่มเล็กบน mobile */}
                <button
                  onClick={() => setShowAnalysisModal(true)}
                  className="px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition flex items-center gap-2 min-w-[44px] justify-center"
                  title="ดูผลการโหวต"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">ดูผลโหวต</span>
                </button>
                
                {/* ไปหน้าถัดไป - แสดงเฉพาะเมื่อมี callback */}
                {onManualNext && (
                  <button
                    onClick={() => onManualNext()}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow-lg hover:shadow-xl min-w-[44px] justify-center"
                    title="ไปหน้าถัดไป"
                  >
                    <span className="hidden sm:inline">หน้าถัดไป</span>
                    <span>→</span>
                  </button>
                )}
              </>
            )}
          </div>
          </div>

          {/* Borda Count Explanation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
            <p className="font-bold text-blue-900 mb-2">วิธีคำนวณคะแนน (Borda Count):</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                <span className="text-lg">🥇</span>
                <p className="font-semibold text-blue-800">อันดับ 1</p>
                <p className="text-blue-600">3 คะแนน</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                <span className="text-lg">🥈</span>
                <p className="font-semibold text-blue-800">อันดับ 2</p>
                <p className="text-blue-600">2 คะแนน</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                <span className="text-lg">🥉</span>
                <p className="font-semibold text-blue-800">อันดับ 3</p>
                <p className="text-blue-600">1 คะแนน</p>
              </div>
            </div>
          </div>

          {/* Vote Selectors */}
          <div className="space-y-4 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i}>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} อันดับ {i + 1} ({WEIGHTS[i]} คะแนน):
                </label>
                <select
                  value={myVote[i]}
                  onChange={e => handleSelect(i, e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
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
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || myVote.includes("")}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังส่งคะแนน...
              </span>
            ) : (
              '✓ ส่งคะแนนโหวต'
            )}
          </button>

          {/* Vote Preview */}
          {myVote.some(v => v !== "") && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
              <p className="font-bold text-green-900 mb-2">การโหวตของคุณ:</p>
              <div className="space-y-1.5">
                {myVote[0] && (
                  <p className="text-green-800 font-medium">
                    🥇 อันดับ 1: <span className="font-bold">{myVote[0]}</span> (3 คะแนน)
                  </p>
                )}
                {myVote[1] && (
                  <p className="text-green-800 font-medium">
                    🥈 อันดับ 2: <span className="font-bold">{myVote[1]}</span> (2 คะแนน)
                  </p>
                )}
                {myVote[2] && (
                  <p className="text-green-800 font-medium">
                    🥉 อันดับ 3: <span className="font-bold">{myVote[2]}</span> (1 คะแนน)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tip Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-5 rounded-lg shadow-md">
          <p className="text-sm text-purple-900">
            <span className="font-bold">💡 เคล็ดลับ:</span> ลองดูผลโหวตของเพื่อนๆ 
            เพื่อช่วยในการตัดสินใจ {votingResults.length > 0 && '(คลิกปุ่ม "ดูผลโหวต" ด้านบน)'}
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {justSaved && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 animate-backdrop-fade-in"
            onClick={() => setJustSaved(false)}
          />

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-toast-pop-up w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">✅</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-lg">โหวตสำเร็จ!</p>
                    <button
                      onClick={() => setJustSaved(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                      aria-label="ปิด"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    🗳️ บันทึกการโหวตเรียบร้อยแล้ว
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setJustSaved(false);
                        setShowAnalysisModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 transition"
                    >
                      🔍 ดูผลการโหวต
                    </button>
                    {onManualNext && (
                      <button
                        onClick={() => {
                          setJustSaved(false);
                          onManualNext();
                        }}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-lg"
                      >
                        ไปหน้าถัดไป →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analysis Modal */}
      {renderAnalysisModal()}
    </>
  );
};

export default StepPlace;