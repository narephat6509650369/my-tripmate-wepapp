import { MOCK_MY_TRIPS } from '../data/mockData';
import { CONFIG } from '../config/config';
// ============== API CONFIGURATION ==============
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ============== TYPES ==============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Member {
  id: string;
  name: string;
  gender: "ชาย" | "หญิง";
  availability: boolean[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
    lastUpdated: number;
  };
}

export interface TripResponse {
  _id: string;
  tripCode: string;
  inviteCode?: string;
  name: string;
  days: number;
  detail: string;
  createdBy: string;
  createdAt: number;
  members: Member[];
  voteOptions: string[];
  selectedDate: string | null;
  isCompleted: boolean;
  closedAt?: number;
  voteResults?: {
    provinces: { name: string; score: number }[];
    dates: { date: string; votes: number }[];
  };
}

// ============== ERROR HANDLER ==============
const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    error: error.name || 'UNKNOWN_ERROR'
  };
};

const checkAuthToken = (): boolean => {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    console.warn('⚠️ No auth token found');
    return false;
  }
  return true;
};

// ============== API FUNCTIONS ==============
export const tripAPI = {
  // ✅ 1. สร้างทริปใหม่
  createTrip: async (tripData: { name: string; days: string; detail: string }): Promise<ApiResponse> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        message: 'กรุณาเข้าสู่ระบบใหม่',
        error: 'NO_AUTH_TOKEN'
      };
    }
    
    const response = await fetch(`${API_URL}/trips/AddTrip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(tripData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 2. ดึงรายการทริปทั้งหมดของฉัน
  // getMyTrips: async (): Promise<ApiResponse> => {
  //   try {
  //     const response = await fetch(`${API_URL}/trips/my-trips`, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
  //       }
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //     }
      
  //     return await response.json();
  //   } catch (error) {
  //     return handleApiError(error);
  //   }
  // },
  getMyTrips: async (): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: getMyTrips');
      await new Promise(r => setTimeout(r, 300));
      return MOCK_MY_TRIPS;
    }

    try {
      const response = await fetch(`${API_URL}/trips/my-trips`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ API Error, using mock data');
      return MOCK_MY_TRIPS; // ✅ fallback
    }
  },

  // ✅ 3. ลบทริป
  deleteTrip: async (tripId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/DeleteTrip`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ tripId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 4. สร้างรหัสเชิญ
  generateInviteCode: async (tripId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 5. เข้าร่วมทริปด้วยรหัสเชิญ
  joinTrip: async (inviteCode: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ inviteCode })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 6. ลบสมาชิกออกจากทริป
  removeMember: async (tripId: string, memberId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 7. ดึงรายละเอียดทริป (สำหรับ VotePage และ SummaryPage)
  getTripDetail: async (tripCode: string): Promise<ApiResponse<TripResponse>> => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 8. ส่งผลโหวตจังหวัด (สำหรับ VotePage - StepPlace)
  submitProvinceVotes: async (
    tripCode: string, 
    voteData: { votes: string[]; scores: Record<string, number> }
  ): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripCode}/votes/province`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(voteData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 9. ปิดการโหวต (สำหรับ VotePage - StepSummary)
  closeTrip: async (tripCode: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripCode}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 10. อัปเดตงบประมาณสมาชิก (สำหรับ VotePage - StepBudget)
  updateMemberBudget: async (
    tripCode: string,
    memberId: string,
    budget: Partial<Member['budget']>
  ): Promise<ApiResponse> => {
    try {
      const response = await fetch(
        `${API_URL}/trips/${tripCode}/members/${memberId}/budget`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          },
          body: JSON.stringify(budget)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// ============== USAGE EXAMPLES (สำหรับอ้างอิง) ==============
/*
// ตัวอย่างการใช้งาน getTripDetail
tripAPI.getTripDetail('TRIPCODE123')
  .then(response => {
    if (response.success) {
      console.log('Trip Details:', response.data);
    } else {
      console.error('Error:', response.message);
    }
  });

// ตัวอย่างการใช้งาน updateMemberBudget
tripAPI.updateMemberBudget('TRIPCODE123', 'MEMBERID456', { 
  accommodation: 5000 
})
  .then(response => {
    if (response.success) {
      console.log('Budget updated successfully');
    } else {
      console.error('Error:', response.message);
    }
  });
*/