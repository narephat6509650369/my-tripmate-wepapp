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
  code: string;
  message: string;   
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  field?: string;
  reason?: string;
  detail?: string | object;
}

export interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'owner' | 'member';
}

export interface TripDetail {
  trip_id: string;
  owner_id: string;
  trip_name: string;
  description: string | null;
  num_days: number;
  invite_code: string;
  invite_link: string;
  status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived';
  created_at: string;
  member_count: number;
}

export interface TripSummary {
  trip_id: string;
  trip_name: string;
  status: string;
  role: 'owner' | 'member';
  num_members: number;
}

export interface MyTripsResponse {
  success: boolean;
  data: {
    all: TripSummary[];
    owned: TripSummary[];
    joined: TripSummary[];
  };
}

export interface MyTripCard {
  id: string;
  name: string;
  people: number;
  status: string;
  statusColor: string;
  isCompleted: boolean;
}

export interface JoinTripResponse {
  success: boolean;
  data: {
    trip_id: string;
    trip_name: string;
    rejoined: boolean;
  };
  message: string;
}

export interface CreateTripResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    trip_id: string;
    owner_id: string;
    trip_name: string;
    description: string | null;
    num_days: number;
    invite_code: string;
    invite_link: string;
    status: string;
  };
}

export interface CreateTripPayload {
  trip_id: string;
  owner_id: string;
  trip_name: string;
  description: string | null;
  num_days: number;
  invite_code: string;
  invite_link: string;
  status: string;
}

export interface JoinTripPayload {
  tripId: string;
  tripName: string;
}

export interface MyTripsPayload {
  all: TripSummary[];
  owned: TripSummary[];
  joined: TripSummary[];
}



// ============== ERROR HANDLER ==============
const handleApiError = (error: any): ApiResponse => {
  return {
    success: false,
    code: "CLIENT_ERROR",
    message: error.message || "เกิดข้อผิดพลาด",
    error: {
      detail: error
    }
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
  // 1. สร้างทริปใหม่
createTrip: async (tripData: { name: string; days: string; detail: string }): Promise<ApiResponse<CreateTripPayload>> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่",
        error: { reason: "NO_AUTH_TOKEN" }
      };
    }

    const res = await fetch(`${API_URL}/trips/AddTrip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({
        trip_name: tripData.name,
        description: tripData.detail || null,
        num_days: Number(tripData.days)
      })
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},

// 2. ดึงรายการทริปทั้งหมดของฉัน
getMyTrips: async (): Promise<ApiResponse<MyTripsPayload>> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่"
      };
    }

    const res = await fetch(`${API_URL}/trips/all-my-trips`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      }
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},

  // 3. ลบทริป
  deleteTrip: async (tripId: string): Promise<ApiResponse> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่"
      };
    }

    const res = await fetch(`${API_URL}/trips/${tripId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      }
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},

// 4. เข้าร่วมทริปด้วยรหัสเชิญ
joinTrip: async (inviteCode: string): Promise<ApiResponse<JoinTripResponse['data']>> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่"
      };
    }

    const res = await fetch(`${API_URL}/trips/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({ invite_code: inviteCode })
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},


  // 5. ลบสมาชิกออกจากทริป
  removeMember: async (tripId: string, memberId: string): Promise<ApiResponse> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่",
        error: {
          reason: "NO_AUTH_TOKEN"
        }
      };
    }

    const res = await fetch(
      `${API_URL}/trips/${tripId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
        }
      }
    );

    return await res.json();

  } catch (error) {
    return handleApiError(error);
  }
},


  // 6. ดึงรายละเอียดทริป
  getTripDetail: async (tripCode: string): Promise<ApiResponse<TripDetail>> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่"
      };
    }

    const res = await fetch(`${API_URL}/trips/${tripCode}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      }
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},


  // 7. ดึงสรุปทริป (สำหรับหน้า Summary)
 getTripSummary: async (tripId: string): Promise<ApiResponse> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่"
      };
    }

    const res = await fetch(`${API_URL}/trips/${tripId}/summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      }
    });

    return await res.json();
  } catch (err) {
    return handleApiError(err);
  }
},

/*
  // 8. อัปเดตสถานะทริป
  updateTripStatus: async (tripId: string,status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived'): Promise<ApiResponse> => {
    try {
      if (!checkAuthToken()) {
        return {
          success: false,
          message: 'กรุณาเข้าสู่ระบบใหม่',
          error: 'NO_AUTH_TOKEN'
        };
      }

      const response = await fetch(`${API_URL}/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
*/
  // 9. ปิดทริป (เปลี่ยนเป็น completed)
  closeTrip: async (tripId: string): Promise<ApiResponse> => {
  try {
    if (!checkAuthToken()) {
      return {
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบใหม่",
        error: {
          reason: "NO_AUTH_TOKEN"
        }
      };
    }

    const response = await fetch(
      `${API_URL}/trips/${tripId}/close`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
        }
      }
    );

    return await response.json();

  } catch (error) {
    return handleApiError(error);
  }
},
/*
  // 10. อัปเดตงบประมาณ (ถ้ามีการใช้งาน)
  updateBudget: async (
    tripId: string,
    budgetData: {
      category_name: string;
      estimated_amount: number;
    }
  ): Promise<ApiResponse> => {
    try {
      if (!checkAuthToken()) {
        return {
          success: false,
          message: 'กรุณาเข้าสู่ระบบใหม่',
          error: 'NO_AUTH_TOKEN'
        };
      }

      const response = await fetch(`${API_URL}/trips/${tripId}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(budgetData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
  */
};

export default tripAPI;