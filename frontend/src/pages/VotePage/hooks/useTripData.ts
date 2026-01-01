import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import { getMockTripData, TripData, Member } from '../../../data/mockData';

export const useTripData = (tripCode: string) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripData>({ 
    _id: "",
    tripCode: "",
    name: "",
    days: 0,
    detail: "",
    createdBy: "",
    createdAt: 0,
    isCompleted: false,
    members: [], 
    voteOptions: [], 
    selectedDate: null,
    voteResults: { provinces: [], dates: [] },
    dateRanges: [],
    dateVotes: [],
    provinceVotes: [],
    memberAvailability: []
  });
  const [memberBudget, setMemberBudget] = useState<Member | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const loadTripData = async () => {
      if (tripCode === "UNKNOWN") {
        setError("ไม่พบรหัสทริป");
        setTimeout(() => navigate("/homepage"), 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let response;
        
        if (CONFIG.USE_MOCK_DATA) {
          log.mock('Loading trip data from mock');
          response = getMockTripData(); 
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log.api('Loading trip data from API');
          // ✅ แก้ไข: ลบ signal parameter ออก
          response = await tripAPI.getTripDetail(tripCode);
        }
        
        if (!response || !response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        if (!isMounted) return;

        const tripData = response.data;
        
        if (tripData?.inviteCode) {
          setInviteCode(tripData.inviteCode);
        } else if (tripData?.tripCode) {
          setInviteCode(tripData.tripCode);
        } else {
          setInviteCode(tripCode);
        }
        
        setTrip(tripData);

        const userId = localStorage.getItem('userId');

        if (!userId) {
          log.error('❌ No userId in localStorage');
          setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        let currentMember = tripData.members?.find((m: Member) => m.id === userId);

        if (!currentMember) {
          const userEmail = localStorage.getItem('userEmail');
          if (userEmail) {
            currentMember = tripData.members?.find((m: Member) => 
              m.email?.toLowerCase() === userEmail.toLowerCase()
            );
          }
        }

        if (!currentMember) {
          log.warn('⚠️ Current user not found in members list');
          setError("คุณไม่ได้อยู่ในทริปนี้ กรุณาเข้าร่วมทริปก่อน");
          setTimeout(() => navigate("/homepage"), 3000);
          return;
        }

        setMemberBudget(currentMember);
        setLoading(false);

        console.log('✅ Trip loaded:', {
          tripCode: tripData.tripCode,
          members: tripData.members?.length,
          currentMember: currentMember.name,
          budget: currentMember.budget
        });
        
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        
        log.error("Error loading trip:", error);
        
        if (!isMounted) return;
        
        setError("ไม่สามารถโหลดข้อมูลทริปได้");
        setLoading(false);
        setTimeout(() => navigate("/homepage"), 3000);
      }
    };
    
    loadTripData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [tripCode, navigate]);

  return {
    trip,
    setTrip,
    memberBudget,
    setMemberBudget,
    inviteCode,
    loading,
    error
  };
};