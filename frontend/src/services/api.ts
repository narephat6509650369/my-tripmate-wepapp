import { 
  MOCK_MY_TRIPS, 
  mockAddDateRange,
  mockRemoveDateRange,
  mockUpdateBudgetPriority,
  mockDeleteMember,
  mockDeleteTrip,
  mockUpdateMemberAvailability 
} from '../data/mockData';
import { CONFIG, log } from '../config/app.config';

// ============== HELPER: FETCH WITH TIMEOUT ==============
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - เซิร์ฟเวอร์ตอบสนองช้าเกินไป');
    }
    throw error;
  }
};

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
  role: "owner" | "member"; // ✅ เพิ่ม role
  availability: boolean[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
    lastUpdated: number;
  };
  budgetPriorities?: { // ✅ เพิ่ม budgetPriorities
    accommodation: 1 | 2 | 3;
    transport: 1 | 2 | 3;
    food: 1 | 2 | 3;
  };
}

// ✅ เพิ่ม DateRange interface
export interface DateRange {
  id: string;
  memberId: string;
  memberName: string;
  startDate: string;
  endDate: string;
  createdAt: number;
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
  dateRanges?: DateRange[];
  provinceVotes?: any[];
  dateVotes?: any[]; 
  memberAvailability?: any[];
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
      
      const response = await fetchWithTimeout(`${API_URL}/trips/AddTrip`, {
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
  getMyTrips: async (): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: getMyTrips');
      await new Promise(r => setTimeout(r, 300));
      return MOCK_MY_TRIPS;
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/my-trips`, {
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
      return MOCK_MY_TRIPS;
    }
  },

  // ✅ 3. ลบทริป
  deleteTrip: async (tripCode: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: deleteTrip');
      return await mockDeleteTrip(tripCode);
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/DeleteTrip`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ tripCode })
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
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripId}/invite`, {
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
      const response = await fetchWithTimeout(`${API_URL}/trips/join`, {
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
  deleteMember: async (tripCode: string, memberId: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: deleteMember');
      return await mockDeleteMember(tripCode, memberId);
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/members/${memberId}`, {
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

  /**
   * Leave trip - สมาชิกออกจากทริป
   */
  leaveTrip: async (tripCode: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      log.mock('Leaving trip (mock):', tripCode);
      return {
        success: true,
        message: 'ออกจากทริปสำเร็จ'
      };
    }

    try {
      // ✅ ใช้ fetchWithTimeout แทน apiClient
      const response = await fetchWithTimeout(
        `${API_URL}/trips/${tripCode}/leave`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      log.success('Left trip successfully');
      return await response.json();
    } catch (error) {
      log.error('Failed to leave trip:', error);
      return handleApiError(error);
    }
  },
  // ✅ 7. ดึงรายละเอียดทริป
  getTripDetail: async (tripCode: string): Promise<ApiResponse<TripResponse>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}`, {
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

  // เพิ่มใน tripAPI object
  submitDateVotes: async (
    tripCode: string,
    votes: Record<string, boolean>
  ): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 300));
      return { success: true };
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/votes/date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ votes })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ✅ 8. ส่งผลโหวตจังหวัด
  submitProvinceVotes: async (
    tripCode: string, 
    voteData: { votes: string[]; scores: Record<string, number> }
  ): Promise<ApiResponse> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/votes/province`, {
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

  // ✅ 9. ปิดการโหวต
  closeTrip: async (tripCode: string): Promise<ApiResponse> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/close`, {
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

  // ✅ 10. อัปเดตงบประมาณสมาชิก
  updateMemberBudget: async (
    tripCode: string,
    memberId: string,
    budget: Partial<Member['budget']>
  ): Promise<ApiResponse> => {
    try {
      const response = await fetchWithTimeout(
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
  },

  // 🆕 11. เพิ่มช่วงวันที่
  addDateRange: async (tripCode: string, dateRange: DateRange): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: addDateRange');
      return await mockAddDateRange(tripCode, dateRange);
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/date-ranges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 🆕 12. ลบช่วงวันที่
  removeDateRange: async (tripCode: string, rangeId: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: removeDateRange');
      return await mockRemoveDateRange(tripCode, rangeId);
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/trips/${tripCode}/date-ranges/${rangeId}`, {
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

  // 🆕 13. อัปเดต Budget Priority
  updateBudgetPriority: async (
    tripCode: string,
    memberId: string,
    priorities: Member['budgetPriorities']
  ): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: updateBudgetPriority');
      return await mockUpdateBudgetPriority(tripCode, memberId, priorities);
    }

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/trips/${tripCode}/members/${memberId}/budget-priority`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          },
          body: JSON.stringify({ priorities })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 🆕 14. อัปเดตวันที่ว่างของสมาชิก
  updateMemberAvailability: async (
    tripCode: string, 
    data: {
      memberId: string;
      availableDates: string[];
    }
  ): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      console.log('🎭 Mock Mode: updateMemberAvailability');
      return await mockUpdateMemberAvailability(tripCode, data);
    }

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/trips/${tripCode}/availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          },
          body: JSON.stringify(data)
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
