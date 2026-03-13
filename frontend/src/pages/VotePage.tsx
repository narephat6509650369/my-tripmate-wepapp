// src/pages/VotePage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Copy, Trash2 } from "lucide-react";

// Components
import Header from "../components/Header";
import StepVote from "./VotePage/components/StepVote";
import StepBudget from './VotePage/components/StepBudget';
import StepPlace from './VotePage/components/StepPlace';
import StepSummary from './VotePage/components/StepSummary';

// Hooks & Utils
import { useAuth } from '../contexts/AuthContext';
import { tripAPI, voteAPI } from '../services/tripService';
import type { TripDetail, LocationVote, DateMatchingResponse, BudgetVotingResponse } from '../types';
import { getSocket } from "../socket";
type MatchingData = Pick<DateMatchingResponse, 'availability' | 'recommendation' | 'summary'>;
type BudgetInfo = Pick<BudgetVotingResponse, 'rows' | 'stats' | 'budgetTotal' | 'minTotal' | 'maxTotal' | 'filledMembers' | 'totalMembers'>;

interface PendingRequest {
  member_id: string;
  user_id: string;
  full_name?: string;
  name?: string;
  email?: string;
  profile_image?: string;
  joined_at: string;
}

// ============== MAIN COMPONENT ==============
const VotePage: React.FC = () => {
  const { tripCode: urlCode } = useParams<{ tripCode: string }>();
  const tripCode = urlCode || "UNKNOWN";
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // ============== STATE ==============
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [userDates, setUserDates] = useState<string[]>([]);
  const [matchingData, setMatchingData] = useState<MatchingData | null>(null);
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<any>(null);
  const [userLocations, setUserLocations] = useState<{ place: string; score: number }[]>([]);
  const [locationAnalysis, setLocationAnalysis] = useState<any>(null);
  const [locationVotedCount, setLocationVotedCount] = useState(0);

  // ✅ Pending Requests state
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [panelTab, setPanelTab] = useState<'pending' | 'members'>('pending');
  const [members, setMembers] = useState<{user_id: string, member_id: string, full_name?: string, name?: string, email?: string}[]>([]);

  const displayCode = inviteCode || tripCode;
  const isClosed = trip?.status === 'completed' || trip?.status === 'archived' || trip?.status === 'confirmed';

  const isSummaryUnlocked = (tripData: TripDetail): boolean => {
    if (tripData.status === 'completed' || tripData.status === 'archived' || tripData.status === 'confirmed') return true;
    if (!tripData.createdat) return false;
    const diffDays = (new Date().getTime() - new Date(tripData.createdat).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

  const [stepCompleted, setStepCompleted] = useState({
    2: false, // วันที่
    3: false, // งบประมาณ
    4: false, // สถานที่
  });

  // ============== LOAD TRIP DATA ==============
  useEffect(() => {
    const loadTripData = async () => {
      if (tripCode === "UNKNOWN") {
        setError("ไม่พบรหัสทริป");
        setTimeout(() => navigate("/homepage"), 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await tripAPI.getTripDetail(tripCode);
        console.log("Trip detail response:", response);
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        const tripData = response.data;

        setInviteCode(tripData.invitecode);
        setTrip(tripData);

        // ✅ โหลด pending requests ถ้าเป็น Owner
        if (tripData.ownerid === user?.user_id) {
          console.log('✅ เป็น Owner โหลด members'); 
          try {
            const pendingRes = await tripAPI.getPendingRequests(tripData.tripid);
            console.log('pending requests response:', JSON.stringify(pendingRes));
            if (pendingRes.success) {
              const list = pendingRes.data?.data?.data ?? pendingRes.data?.data ?? pendingRes.data ?? [];
              setPendingRequests(Array.isArray(list) ? list : []);
            }
            try {
              const membersRes = await tripAPI.getMembers(tripData.tripid);
              if (membersRes.success) {
                const list = membersRes.data ?? [];
                setMembers(Array.isArray(list) ? list : []);
              }
            } catch (e) {
              console.error('Load members failed:', e);
            }
          } catch (e) {
            console.error('Load pending requests failed:', e);
          }
        } else {
          console.log('❌ ไม่ใช่ Owner:', tripData.ownerid, 'vs', user?.user_id);
        }

        try {
          // ========== วันที่ ==========
          const dateRes = await voteAPI.getDateMatchingResult(tripData.tripid);
          if (dateRes?.data) {
            setMatchingData({
              availability: dateRes.data.availability || [],
              recommendation: dateRes.data.recommendation || null,
              summary: dateRes.data.summary || { totalMembers: 0, totalAvailableDays: 0 }
            });
          }
          if (dateRes?.data?.rows) setUserDates(dateRes.data.rows);
          const hasDates = dateRes?.data?.rowlog?.some(
            (r: any) => r.proposed_by === user?.user_id
          );
          if (hasDates) setStepCompleted(prev => ({ ...prev, 2: true }));

          // ========== งบประมาณ ==========
          const budgetRes = await voteAPI.getBudgetVoting(tripData.tripid);
          if (budgetRes?.data) setBudgetInfo(budgetRes.data);
          if (budgetRes?.data?.stats) setBudgetAnalysis(budgetRes.data.stats);
          const hasBudget = budgetRes?.data?.rows?.some(
            (r: any) => r.user_id === user?.user_id
          );
          if (hasBudget) setStepCompleted(prev => ({ ...prev, 3: true }));

          // ========== จังหวัด ==========
          const locRes = await voteAPI.getLocationVote(tripData.tripid);
          const hasPlace = locRes?.data?.rowlog?.some(
            (r: any) => r.proposed_by === user?.user_id
          );
          if (hasPlace) setStepCompleted(prev => ({ ...prev, 4: true }));
          if (locRes?.data?.rowlog && user?.user_id) {
            const myVotes = locRes.data.rowlog
              .filter((log: any) => log.proposed_by === user.user_id)
              .map((log: any) => ({ place: log.province_name, score: log.score }));
            if (myVotes.length > 0) setUserLocations(myVotes);
            if (locRes?.data?.analysis) setLocationAnalysis(locRes.data.analysis);
            if (locRes?.data?.actualVote) setLocationVotedCount(locRes.data.actualVote);
          }

          const isCompleted = tripData.status === 'completed' || tripData.status === 'archived' || tripData.status === 'confirmed';
          if (isCompleted || (hasDates && hasBudget && hasPlace)) {
            setStep(5);
          }

        } catch (e) {
          console.error('Load user input failed:', e);
        }

        setLoading(false);

      } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
          navigate(`/login?redirect=/votepage/${tripCode}`);
          return;
        }
        if (status === 403) {
          console.log("User not in trip → auto join flow");
          try {
            const joinRes = await tripAPI.joinTrip(tripCode);
            if (joinRes.success) {
              console.log("Auto join success → reload trip");
              await loadTripData();
              return;
            }
          } catch (e) {
            console.error("Join failed → fallback redirect");
            navigate(`/join/${tripCode}`);
            return;
          }
        }
      }
    };

    loadTripData();
  }, [tripCode, navigate]);

  // ============== Socket ==============

useEffect(() => {

  if (!trip?.tripid) return;

  const socket = getSocket();
  if (!socket) return;

  console.log("🔌 VotePage socket listen:", trip.tripid);

  // join room
  socket.emit("join_trip", trip.tripid);

  let reloadTimer: any = null;

  const handleVoteUpdate = (data: any) => {

    if (String(data.tripId) !== String(trip.tripid)) return;

    console.log("🗳 vote updated");

    clearTimeout(reloadTimer);

    reloadTimer = setTimeout(() => {
      reloadTripData();
    }, 300);

  };

  const handleMemberUpdate = async (data: any) => {

    if (String(data.tripId) !== String(trip.tripid)) return;

    console.log("👥 member updated");

    await reloadTripData();

  };

  socket.on("vote_updated", handleVoteUpdate);
  socket.on("member_updated", handleMemberUpdate);

  return () => {
    socket.off("vote_updated", handleVoteUpdate);
    socket.off("member_updated", handleMemberUpdate);
  };

}, [trip?.tripid]);

const reloadTripData = async () => {

  if (!trip?.tripid) return;

  try {

    const [
      tripRes,
      membersRes,
      pendingRes,
      dateRes,
      budgetRes,
      locRes
    ] = await Promise.all([
      tripAPI.getTripDetail(trip.tripid),
      tripAPI.getMembers(trip.tripid),
      tripAPI.getPendingRequests(trip.tripid),
      voteAPI.getDateMatchingResult(trip.tripid),
      voteAPI.getBudgetVoting(trip.tripid),
      voteAPI.getLocationVote(trip.tripid)
    ]) as any[];
    // trip
    if (tripRes?.data) {
      setTrip(tripRes.data);
    }

    // members
    if (membersRes?.success) {
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    }

    // pending
    if (pendingRes?.success) {
      const list =
        pendingRes.data?.data?.data ??
        pendingRes.data?.data ??
        pendingRes.data ??
        [];

      setPendingRequests(Array.isArray(list) ? list : []);
    }

  // date voting
  if (dateRes?.data) {

  const summary = dateRes.data.summary || {};

  const actualVote =
    summary.actualVote ??
    dateRes.data.rowlog?.length ??
    0;

  setMatchingData({
    availability: dateRes.data.availability || [],
    recommendation: dateRes.data.recommendation || null,
    summary: {
      ...summary,
      actualVote
    }
  });

  const hasDates = dateRes?.data?.rowlog?.some(
    (r: any) => r.proposed_by === user?.user_id
  );

  if (hasDates) {
    setStepCompleted(prev => ({ ...prev, 2: true }));
  }

  }
    
  // budget voting
  if (budgetRes?.data) {

  setBudgetInfo(budgetRes.data);

  if (budgetRes.data.stats) {
    setBudgetAnalysis(budgetRes.data.stats);
  }

  const hasBudget = budgetRes?.data?.rows?.some(
    (r: any) => r.user_id === user?.user_id
  );

  if (hasBudget) {
    setStepCompleted(prev => ({ ...prev, 3: true }));
  }

}

    // location
if (locRes?.data) {

  if (locRes.data.analysis) {
    setLocationAnalysis(locRes.data.analysis);
  }

  if (locRes.data.actualVote !== undefined) {
    setLocationVotedCount(locRes.data.actualVote);
  }

  // ตรวจว่าผู้ใช้โหวตแล้วหรือยัง
  const hasPlace = locRes?.data?.rowlog?.some(
    (r: any) => r.proposed_by === user?.user_id
  );

  if (hasPlace) {
    setStepCompleted(prev => ({ ...prev, 4: true }));
  }

  if (locRes?.data?.rowlog && user?.user_id) {

    const myVotes = locRes.data.rowlog
      .filter((log: any) => log.proposed_by === user.user_id)
      .map((log: any) => ({
        place: log.province_name,
        score: log.score
      }));

    setUserLocations(myVotes);
  }
}

  } catch (err) {
    console.error("reload trip failed", err);
  }

};

  // ============== HANDLERS ==============
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    logout();
  };

  // ✅ Approve Request
  const handleApprove = async (userId: string) => {
    if (!trip) return;
    try {
      const res = await tripAPI.approveRequest(trip.tripid, userId);
      if (res.success) {
        setPendingRequests(prev => prev.filter(r => r.user_id !== userId));
        await reloadTripData();
      } else {
        alert(res.message || 'อนุมัติไม่สำเร็จ');
      }
    } catch (e) {
      console.error('Approve failed:', e);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  // ✅ Reject Request
  const handleReject = async (userId: string) => {
    if (!trip) return;
    try {
      const res = await tripAPI.rejectRequest(trip.tripid, userId);
      if (res.success) {
        setPendingRequests(prev => prev.filter(r => r.user_id !== userId));
        await reloadTripData();
      } else {
        alert(res.message || 'ปฏิเสธไม่สำเร็จ');
      }
    } catch (e) {
      console.error('Reject failed:', e);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  // ✅ Approve All
  const handleApproveAll = async () => {
    if (!trip) return;
    const toApprove = [...pendingRequests];
    
    // ✅ clear ทันทีก่อน call API เพื่อป้องกัน double trigger
    setPendingRequests([]);
    
    for (const req of toApprove) {
      try {
        await tripAPI.approveRequest(trip.tripid, req.user_id);
        await reloadTripData();
      } catch (e) {
        console.error('Approve failed:', e);
      }
    }
  };

  // ✅ Reject All
  const handleRejectAll = async () => {
    if (!trip) return;
    const toReject = [...pendingRequests];
    
    // ✅ clear ทันทีก่อน call API
    setPendingRequests([]);
    
    for (const req of toReject) {
      try {
        await tripAPI.rejectRequest(trip.tripid, req.user_id);
        await reloadTripData();
      } catch (e) {
        console.error('Reject failed:', e);
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!trip) return;
    try {
      const res = await tripAPI.removeMember(trip.tripid, memberId);
      if (res.success) {
        setMembers(prev => prev.filter(m => m.member_id !== memberId));
        await reloadTripData();
      } else {
        alert(res.message || 'ลบสมาชิกไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  // ✅ Save Dates — blocked when trip is closed
  const handleSaveDates = async (dates: string[]) => {
    if (isClosed) return;
    if (!trip) {
      console.log('No trip data available');
      return;
    }
    if (!user) {
      console.log('No user data available');
      return;
    }
    try {
      const response = await voteAPI.submitAvailability({
        trip_id: trip.tripid,
        user_id: user.user_id,
        ranges: dates.sort(),
      });
      if (response.success) {
        console.log('✅ บันทึกวันที่สำเร็จ');
        setUserDates(dates);
        setStepCompleted(prev => ({ ...prev, 2: true }));
        const dateRes = await voteAPI.getDateMatchingResult(trip.tripid);
        if (dateRes?.data) {
          setMatchingData({
            availability: dateRes.data.availability || [],
            recommendation: dateRes.data.recommendation || null,
            summary: dateRes.data.summary || { totalMembers: 0, actualVote: 0, totalAvailableDays: 0 }
          });
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving dates:', error);
    }
  };

  // ✅ Save Budget — blocked when trip is closed
  const handleSaveBudget = async (category: string, amount: number) => {
    if (isClosed) return;
    if (!trip) return;
    try {
      const response = await voteAPI.updateBudget(trip.tripid, {
        category: category as any,
        amount
      });
      if (response.success) {
        console.log('บันทึกงบประมาณสำเร็จ');
        setStepCompleted(prev => ({ ...prev, 3: true }));
        const budgetRes = await voteAPI.getBudgetVoting(trip.tripid);
        console.log("getBudgetVoting after update:", budgetRes);
        console.log('budgetRes.data:', JSON.stringify(budgetRes.data));
        if (budgetRes?.data) {
          setBudgetInfo(budgetRes.data);
          if (budgetRes.data.stats) setBudgetAnalysis(budgetRes.data.stats);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  // ✅ Vote Location — blocked when trip is closed
  const handleVoteLocation = async (votes: LocationVote[]) => {
    if (isClosed) return;
    if (!trip) return;
    try {
      const response = await voteAPI.submitLocationVote(trip.tripid, { votes });
      console.log("submitLocationVote", response);
      if (response.success) {
        console.log('โหวตสำเร็จ');
        const updatedLocations = votes.map(v => ({
          place: v.place,
          score: v.score
        }));
        setUserLocations(updatedLocations);
        const locRes = await voteAPI.getLocationVote(trip.tripid);
        console.log("location response:",locRes)
       //
      if (locRes?.data?.actualVote !== undefined) {
        setLocationVotedCount(locRes.data.actualVote);
      }
        if (locRes?.data?.analysis) setLocationAnalysis(locRes.data.analysis);
        setStepCompleted(prev => ({ ...prev, 4: true }));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error voting location:', error);
    }
  };

  const next = async () => {
    if (step >= 5) return;
    try {
      setStep(step + 1);
    } catch (error) {
      console.error('Error moving to next step:', error);
    }
  };

  const back = () => {
    if (step > 2) setStep(step - 1);
  };

  // When closed: next is disabled (no more data to submit), but back is allowed for reviewing
  const isNextDisabled =
    step === 5 ||
    isClosed ||
    (step >= 2 && step <= 4 && !stepCompleted[step as keyof typeof stepCompleted]);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    try {
      const response = await tripAPI.deleteTrip(trip.tripid);
      if (response.success) {
        navigate('/homepage');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Delete trip failed:', error);
      alert('ลบทริปไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  // ============== LOADING & ERROR STATES ==============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลทริป...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-xl text-gray-700 mb-4">{error || 'ไม่พบข้อมูลทริป'}</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ============== MAIN RENDER ==============
  const stepLabels = ["สร้างทริป", "เลือกวันที่", "งบประมาณ", "สถานที่", "สรุปผล"];
  const isOwner = trip.ownerid === user?.user_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            ◄ กลับไปหน้าหลัก
          </button>
          

          <div className="flex items-center gap-3">
            {/* ปุ่มคัดลอกรหัส */}
            <button
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all font-mono text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied === 'code'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(displayCode, 'code')}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
            >
              <span className="truncate max-w-[80px] sm:max-w-none">{displayCode}</span>
              <Copy className="w-4 h-4" />
            </button>

            {/* ปุ่มแชร์ลิงก์ */}
            <button
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied === 'link'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy(`${window.location.origin}/join/${inviteCode}`, 'link')}
              title="แชร์ลิงก์ทริป"
            >
              <span className="hidden sm:inline">แชร์ลิงก์</span>
              <span className="sm:hidden">แชร์</span>
              <Copy className="w-4 h-4" />
            </button>

            {/* ✅ ปุ่มคำขอเข้าร่วม - เฉพาะ Owner */}
            {isOwner && (
              <button
                onClick={() => setShowPendingPanel(true)}
                className="relative px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition-all text-sm min-w-[44px] min-h-[44px]"
                title="คำขอเข้าร่วม"
              >
                <span>👥</span>
                <span className="hidden sm:inline">จัดการทริป</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trip && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              ✈️ {trip.tripname}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {trip.numdays ? `${trip.numdays} วัน` : ''} 
              {trip.members && ` · สมาชิก ${trip.members.length} คน`}
              {trip.status === 'completed' || trip.status === 'archived' || trip.status === 'confirmed' ? '✅ ทริปเสร็จสิ้น' : '🗳️ กำลังโหวต'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {trip.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
            </p>
            {/* <p className="text-sm text-gray-400 mt-1">
              สร้างโดย {(trip.members?.find(m => m.user_id === trip.ownerid) as any)?.name || 'ไม่ระบุชื่อ'}
              {trip.createdat && ` · ${new Date(trip.createdat).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`}
            </p> */}

            {/* ✅ Closed trip banner */}
            {isClosed && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-sm text-gray-600 font-medium">
                🔒 ทริปนี้ปิดแล้ว — ไม่สามารถแก้ไขข้อมูลได้
              </div>
            )}
          </div>
        )}
        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            <div className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 sm:h-1 bg-gray-200 rounded-full" />
            <div
              className="absolute top-5 sm:top-6 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12
                      flex items-center justify-center
                      rounded-full border-2 sm:border-4
                      font-bold text-sm sm:text-base
                      transition-all duration-300 z-10
                      ${isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                        : isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }
                    `}>
                      {isCompleted ? "✓" : stepNum}
                    </div>
                    <span className={`
                      text-[10px] sm:text-xs
                      mt-2 sm:mt-3
                      font-medium text-center
                      max-w-[60px] sm:max-w-[80px]
                      transition-colors leading-tight
                      ${step >= stepNum ? "text-gray-900" : "text-gray-400"}
                    `}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 2 && (
            <StepVote
              trip={trip}
              matchingData={matchingData}
              initialDates={userDates}
              onSave={handleSaveDates}
              onManualNext={next}
              isLocked={isClosed}
            />
          )}
          {step === 3 && (
            <StepBudget
              trip={trip}
              budgetInfo={budgetInfo}
              onSave={handleSaveBudget}
              onManualNext={next}
              initialAnalysis={budgetAnalysis}
              isLocked={isClosed}
            />
          )}
          {step === 4 && (
            <StepPlace
              trip={trip}
              onVote={handleVoteLocation}
              initialVotes={userLocations}
              initialVotingResults={userLocations}
              initialAnalysis={locationAnalysis}
              initialVotedCount={locationVotedCount}
              isLocked={isClosed}
            />
          )}
          {step === 5 && (
            <StepSummary
              trip={trip}
              initialSummaryData={{ matchingData, budgetInfo, userLocations }}
              onNavigateToStep={setStep}
              isOwner={isOwner}
              canViewSummary={isSummaryUnlocked(trip)}
              onClosed={async () => {
                const res = await tripAPI.getTripDetail(tripCode);
                if (res.data) setTrip(res.data);
              }}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={back}
            disabled={step === 2 || isClosed}
            className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-gray-700 font-semibold text-sm sm:text-base border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm min-h-[48px]"
          >
            <span className="hidden sm:inline">← ย้อนกลับ</span>
            <span className="sm:hidden">← ย้อน</span>
          </button>
          <button
            onClick={next}
            disabled={isNextDisabled}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl min-h-[48px]"
          >
            <span className="hidden sm:inline">หน้าถัดไป →</span>
            <span className="sm:hidden">ถัดไป →</span>
          </button>
        </div>
        {step >= 2 && step <= 4 && !isClosed && !stepCompleted[step as keyof typeof stepCompleted] && (
          <p className="text-center text-xs text-orange-500 mt-2">
            ⚠️ กรุณากรอกข้อมูลและบันทึกก่อนไปขั้นตอนถัดไป
          </p>
        )}
      </main>

      {/* ✅ Pending Requests Panel (Notification-style ด้านล่างขวา) */}
      {showPendingPanel && isOwner && (
      <div className="fixed inset-0 z-40" onClick={() => setShowPendingPanel(false)}>
        <div
          className="absolute bottom-4 right-4 bg-white rounded-xl shadow-2xl border w-80 z-50"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-xl">
            <h4 className="font-bold flex items-center gap-2">
              👥 จัดการทริป
              {pendingRequests.length > 0 && (
                <span className="bg-white text-orange-600 text-xs rounded-full px-2 py-0.5 font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </h4>
            <button onClick={() => setShowPendingPanel(false)} className="text-white hover:text-gray-200 text-xl font-bold">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setPanelTab('pending')}
              className={`flex-1 py-2 text-sm font-semibold transition ${
                panelTab === 'pending'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              คำขอ {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </button>
            <button
              onClick={() => setPanelTab('members')}
              className={`flex-1 py-2 text-sm font-semibold transition ${
                panelTab === 'members'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              สมาชิก ({members.length})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto">

            {/* Tab: คำขอ */}
            {panelTab === 'pending' && (
              <>
                {pendingRequests.length > 0 && (
                  <div className="flex gap-2 px-4 py-2 border-b bg-gray-50">
                    <button
                      onClick={handleApproveAll}
                      className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition"
                    >
                      ✓ รับทั้งหมด ({pendingRequests.length})
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 py-1.5 bg-red-400 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      ✕ ไม่รับทั้งหมด
                    </button>
                  </div>
                )}
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">ไม่มีคำขอเข้าร่วม</p>
                  </div>
                ) : (
                  pendingRequests.map(req => (
                  <div key={req.user_id} className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{req.full_name || req.name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-xs text-gray-500 truncate">{req.email || req.user_id}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleApprove(req.user_id)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition">✓ รับ</button>
                      <button onClick={() => handleReject(req.user_id)} className="px-3 py-1.5 bg-red-400 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition">✕</button>
                    </div>
                  </div>
                ))
                )}
              </>
            )}

            {/* Tab: สมาชิก */}
            {panelTab === 'members' && (
              <>
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">ไม่มีสมาชิก</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.user_id} className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">
                          {member.full_name || member.name || 'ไม่ระบุชื่อ'}
                          {member.user_id === user?.user_id && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Owner</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                      {member.user_id !== user?.user_id && (
                        <button
                          onClick={() => handleRemoveMember(member.member_id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title="ลบสมาชิก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

          </div>
        </div>
      </div>
    )}

      {/* ✅ Notification badge (fixed bottom-right เมื่อปิด panel) */}
      {!showPendingPanel && isOwner && pendingRequests.length > 0 && (
        <button
          onClick={() => setShowPendingPanel(true)}
          className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl transition animate-bounce"
          title={`${pendingRequests.length} คำขอเข้าร่วม`}
        >
          <span className="text-xl">👥</span>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {pendingRequests.length}
          </span>
        </button>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && !isClosed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ลบทริปนี้?</h3>
              <p className="text-sm text-gray-600">
                ทริป <strong>"{trip?.tripname}"</strong> จะถูกลบถาวร<br />
                ไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              {isOwner && !isClosed && (
                <button
                  onClick={handleDeleteTrip}
                  className="relative px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 transition-all text-sm min-w-[44px] min-h-[44px]"
                  title="ลบทริป"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">ลบทริป</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;