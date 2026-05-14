// src/pages/VotePage/components/StepPlace.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { voteAPI } from '../../../services/tripService';
import { THAILAND_PROVINCES } from '../../../constants/provinces';
import type { LocationVote, TripDetail, LocationVoteResponse, LocationVoteResult  } from '../../../types';

const WEIGHTS = [3, 2, 1] as const;

interface StepPlaceProps {
  trip: TripDetail;
  initialVotes?: { place: string; score: number }[];
  initialVotingResults?: LocationVoteResult[];
  onVote: (votes: LocationVote[]) => Promise<void>;
  onManualNext?: () => void;
  onInputChange?: () => void;
  isLocked?: boolean;
  initialAnalysis?: any;
  initialVotedCount?: number;
  initialTotalMembers?: number;
}

type AnalysisResult = NonNullable<LocationVoteResponse['analysis']>;

export const StepPlace: React.FC<StepPlaceProps> = ({
  trip,
  initialVotes = [],
  initialVotingResults = [],
  onVote,
  onManualNext,
  onInputChange,
  isLocked = false,
  initialVotedCount = 0,
  initialTotalMembers = 0,
  initialAnalysis
}) => {
  const [myVote, setMyVote] = useState<[string, string, string]>(["", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingResults, setVotingResults] = useState<LocationVoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(initialVotingResults.length === 0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [votedCount, setVotedCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    if (initialVotes.length > 0) {
      const sorted = [...initialVotes].sort((a, b) => b.score - a.score);
      const newVote: [string, string, string] = ["", "", ""];
      sorted.forEach((vote, idx) => {
        if (idx < 3) newVote[idx] = vote.place;
      });
      setMyVote(newVote);
    }
    if (initialVotes && initialVotes.length > 0) {
      setHasSaved(true);
      setIsAnalysisOpen(true);
    }
  }, [initialVotes]);

  useEffect(() => {
    setVotingResults(initialVotingResults);
    if (initialVotingResults.length > 0) {
      setIsLoading(false);
    }
  }, [initialVotingResults]);

  useEffect(() => {
    setAnalysisResult(initialAnalysis || null);
    setVotedCount(initialVotedCount || 0);
    setTotalMembers(initialTotalMembers || 0);
  }, [initialAnalysis, initialVotedCount, initialTotalMembers]);

  useEffect(() => {
    if (initialVotingResults.length > 0) return;
    const loadVotingResults = async () => {
      if (!trip?.tripid) return;

      try {
        setIsLoading(true);
        setError('');
        const response = await voteAPI.getLocationVote(trip.tripid);
        const votingData = response?.data as LocationVoteResponse | undefined; 

        if (!votingData?.locationVotesTotal || !Array.isArray(votingData.locationVotesTotal)) {
          setVotingResults([]);
          setAnalysisResult(null);
          return;
        }

        const validResults = votingData.locationVotesTotal.filter((r: any) => {
          if (!r.place || typeof r.total_score !== 'number' || typeof r.voteCount !== 'number') return false;
          if (r.total_score < 0 || r.voteCount < 0) return false;
          return true;
        });

        setVotingResults(validResults);
        setVotedCount(votingData?.actualVote || 0);
        setTotalMembers(votingData?.totalMembers || 0);

        if (votingData.analysis) {
          setAnalysisResult(votingData.analysis);
        } else {
          setAnalysisResult(null);
        }

        const userVotes = votingData.rows as any[];
        if (userVotes && userVotes.length > 0) {
          setHasSaved(true);
          setIsAnalysisOpen(true);
        }

      } catch (err) {
        console.error("Failed to load voting results:", err);
        setVotingResults([]);
        setAnalysisResult(null);
        setError('ไม่สามารถโหลดผลการโหวตได้');
      } finally {
        setIsLoading(false);
      }
    };

    loadVotingResults();
  }, [trip?.tripid, initialVotingResults.length]);

  const handleSelect = useCallback((index: number, value: string) => {
    if (isLocked) return;
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
    if (isLocked) return;
    if (myVote.includes("")) {
      setError("กรุณาเลือกครบ 3 อันดับก่อนส่งคะแนน");
      return;
    }

    const payload: LocationVote[] = myVote.map((province, index) => ({
      place: province,
      score: WEIGHTS[index]
    }));

    setIsSubmitting(true);
    setError("");

    try {
      const startTime = Date.now();
      
      await onVote(payload);
      
      const elapsed = Date.now() - startTime;
      
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (elapsed < 300) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setHasSaved(true);
      setIsAnalysisOpen(true);

      let retries = 0;
      const maxRetries = 3;
      let hasMyVote = false;
      
      while (retries < maxRetries && !hasMyVote) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await voteAPI.getLocationVote(trip.tripid);
        const votingData = response?.data as LocationVoteResponse | undefined; 
        const newResults = votingData?.locationVotesTotal || [];

        hasMyVote = newResults.some((r: any) => 
          myVote.some(place => r.place === place)
        );

        if (hasMyVote && newResults.length > 0) {
          setVotingResults(newResults);
          setVotedCount(votingData?.actualVote || 0);
          setTotalMembers(votingData?.totalMembers || 0);
          
          if (votingData?.analysis) {
            setAnalysisResult(votingData.analysis);
          } else {
            setAnalysisResult(null);
          }
          break;
        }
        
        retries++;
      }
    } catch (e) {
      console.error("Failed to submit vote:", e);
      setError('ไม่สามารถส่งคะแนนโหวตได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-14 h-14 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">กำลังโหลดข้อมูลการโหวต...</p>
      </div>
    );
  }

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
            
            {/* Action Buttons */}
            {/* <div className="flex gap-2">
              {votingResults.length > 0 && (
                <>
                  <button
                    onClick={() => setShowAnalysisModal(true)}
                    className="px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition flex items-center gap-2 min-w-[44px] justify-center"
                    title="ดูผลการโหวต"
                  >
                    <span>📊</span>
                    <span className="hidden sm:inline">ดูผลโหวต</span>
                  </button>
                </>
              )}
            </div> */}
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
                  disabled={isSubmitting || isLocked}
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
            disabled={isSubmitting || myVote.includes("") || isLocked}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </span>
            ) : (
              <span>{isLocked ? '🔒 ปิดการโหวตแล้ว' : 'บันทึกจังหวัด'}</span>
            )}
          </button>
        </div>

        {/* ── ผลการวิเคราะห์ (แสดงหลังบันทึก) ── */}
        {hasSaved && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">

            {/* Header — กดเพื่อพับ/ขยาย */}
            <button
              onClick={() => setIsAnalysisOpen(prev => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <span className="font-bold text-gray-800 text-sm">ผลการวิเคราะห์สถานที่</span>
              </div>
              <span className="text-gray-400 text-sm">{isAnalysisOpen ? '▲ ซ่อน' : '▼ ดูผล'}</span>
            </button>

            {/* Content — แสดงเมื่อ isAnalysisOpen */}
            {isAnalysisOpen && (
            <div className="p-4 space-y-4">

              {/* Progress bar */}
              {(() => {
                const memberTotal = totalMembers || trip.members?.length || 0;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${memberTotal > 0 ? Math.min(100, (votedCount / memberTotal) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                        {votedCount}/{memberTotal} คน
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {memberTotal > 0 && votedCount >= memberTotal
                      ? '✅ ทุกคนโหวตแล้ว'
                      : '⏳ รอสมาชิกคนอื่นโหวต'}
                    </p>
                  </div>
                );
              })()}

              {/* ผลวิเคราะห์ */}
              {analysisResult ? (
                <>
                  {analysisResult.hasWinner && analysisResult.topProvinces && (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                      <p className="font-semibold text-green-800 mb-3">🎉 จังหวัดที่คะแนนนำ</p>
                      <div className="space-y-2">
                        {analysisResult.topProvinces.map((prov, idx) => (
                          <div key={prov.place} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2">
                              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                              <span className="font-semibold text-gray-900">{prov.place}</span>
                              <span className="text-xs text-gray-500">{prov.region}</span>
                            </div>
                            <span className="font-bold text-purple-600">{prov.total_score} คะแนน</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!analysisResult.hasWinner && analysisResult.bestRegion && (
                    <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                      <p className="font-semibold text-orange-800 mb-1">🎯 ภูมิภาคยอดนิยม: {analysisResult.bestRegion.region}</p>
                      <p className="text-xs text-orange-600 mb-3">คะแนนกระจาย แนะนำตามภูมิภาค</p>
                      <div className="space-y-2">
                        {analysisResult.bestRegion.topProvinces.map((prov, idx) => (
                          <div key={prov.place} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center gap-2">
                              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                              <span className="font-semibold text-gray-900">{prov.place}</span>
                            </div>
                            <span className="font-bold text-orange-600">{prov.total_score} คะแนน</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-500 text-sm text-center">
                    💭 บันทึกเรียบร้อยแล้ว รอสมาชิกคนอื่นโหวตเพื่อดูผลเปรียบเทียบ
                  </p>
                </div>
              )}

            </div>
          )}
          </div>
        )}
      </div>
    </>
  );
};

export default StepPlace;
