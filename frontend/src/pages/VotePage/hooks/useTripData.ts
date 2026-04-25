// src/pages/VotePage/hooks/useTripData.ts

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI } from '../../../services/tripService';
import type { TripDetail } from '../../../types';

export const useTripData = (tripCode: string) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripDetail | null>(null);

  useEffect(() => {
    const loadTripData = async () => {
      try {
        setLoading(true);
        
        const response = await tripAPI.getTripDetail(tripCode);
        
        if (!response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        setTrip(response.data);
        
      } catch (error: any) {
        console.error("Error:", error);
        
        const status = error?.response?.status;
        if (status === 401) {
          navigate('/login');
          return;
        }
        if (status === 404) {
          setError("ไม่พบทริปนี้ในระบบ");
        } else {
          setError("ไม่สามารถโหลดข้อมูลทริปได้ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadTripData();
  }, [tripCode]);

  return { trip, loading, error };
};