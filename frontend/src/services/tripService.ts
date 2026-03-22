// ============================================================================
// frontend/src/services/tripService.ts
// ✅ รองรับทั้ง Mock Data และ API จริง - จัดเรียงตาม Step
// ============================================================================

import { CONFIG } from '../config/app.config';
import type {
  ApiResponse,
  CreateTripPayload,
  CreateTripResponse,
  MyTripsResponse,
  JoinTripResponse,
  TripDetail,
  TripSummaryResult,
  SubmitAvailabilityPayload,
  HeatmapData,
  StartVotingResponse,
  UpdateBudgetPayload,
  UpdateBudgetResponse,
  SubmitLocationVotePayload,
  DateMatchingResponse,
  BudgetVotingResponse, 
  LocationScores,
  LocationVoteResponse
} from '../types';

// Import Mock Data
import {
  getMockMyTrips,
  getMockTripDetail,
  getMockCreateTrip,
  getMockJoinTrip,
  getMockDeleteTrip,
  getMockRemoveMember,
  getMockTripSummary,
  getMockSubmitAvailability,
  getMockTripHeatmap,
  getMockStartVoting,
  getMockUpdateBudget,
  getMockSubmitLocationVote,
  getMockCloseTrip,
  mockDelay,
  getMockGetBudgetVoting,
  getMockDateMatchingResult,
  getMockNotifications
} from '../data/mockData';

import { apiFetch } from "./apiClient";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/*
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
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
*/
/*
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwtToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
*/
/*
const checkAuth = (): boolean => {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    console.warn('⚠️ No auth token found');
    return false;
  }
  return true;
};
*/
const handleApiError = (error: any): ApiResponse => {
  return {
    success: false,
    code: 'CLIENT_ERROR',
    message: error.message || 'เกิดข้อผิดพลาด',
    error: {
      detail: error
    }
  };
};

// ============================================================================
// TRIP APIs
// ============================================================================

export const tripAPI = {
  /**
   * GET /api/trips/all-my-trips
   */
  getMyTrips: async (): Promise<ApiResponse<MyTripsResponse>> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockMyTrips();
    }

    try {
      const response = await apiFetch(
        `/trips/all-my-trips`,
        {
          method: "GET"
        }
      );

      return await response.json();

    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId
   */
  getTripDetail: async (tripId: string): Promise<ApiResponse<TripDetail>> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripDetail(tripId);
    }

    try {

      const response = await apiFetch(`/trips/${tripId}`);

      return await response.json();

    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId/summary
   */
  getTripSummary: async (tripId: string,template: string = "comprehensive"): Promise<ApiResponse<TripSummaryResult>> => {

    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripSummary(tripId);
    }

    try {
      const response = await apiFetch(
        `/trips/${tripId}/summary?template=${template}`,
        {
          method: "GET",
        }
      );

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },


  /**
   * PATCH /api/trips/:tripId/summary
   */
  updateTripSummary: async (tripId: string, data: { aiSummary: string }): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/${tripId}/summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiSummary: data.aiSummary })
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/trips/AddTrip
   */
  createTrip: async (payload: CreateTripPayload): Promise<ApiResponse<CreateTripResponse>> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();  
      return getMockCreateTrip(payload);
    }

    try {

      const response = await apiFetch(`/trips/add-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/trips/join
   */
  joinTrip: async (inviteCode: string): Promise<ApiResponse<JoinTripResponse>> => {
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockJoinTrip(inviteCode);
  }

  try {
    const response = await apiFetch(`/trips/request-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invite_code: inviteCode })
    });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      code: data.code || 'API_ERROR',
      message: data.message || "Cannot join trip"
    };
  }

  return data;

  } catch (error) {
    return handleApiError(error);
    }
  },

  /**
   * DELETE /api/trips/:tripId
   */
  
  deleteTrip: async (tripId: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockDeleteTrip(tripId);
    }

    try {
      const response = await apiFetch(`/trips/${tripId}`, { // ← tripId ใน URL
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * DELETE /api/trips/:tripId/members/:memberId
   */
  
  removeMember: async (tripId: string, memberId: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockRemoveMember(tripId, memberId);
    }

    try {

      const response = await apiFetch(
        `/trips/${tripId}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  editDescription: async (tripId: string, description: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/${tripId}/edit-describe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  addLink: async (tripId: string, link: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/${tripId}/addLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link })
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // สำหรับเจ้าของทริป: อนุมัติ/ปฏิเสธคำขอเข้าร่วมทริปจากสมาชิกที่ไม่ใช่เจ้าของทริป (Pending Requests) - API ใหม่ที่เพิ่มมาในภายหลัง
  /**
   * POST /api/trips/:tripId/request-join
   */
  requestToJoin: async (inviteCode: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/request-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode })
      });

      const data = await response.json();
      console.log('request-join response:', response.status, data); 

      // ✅ เช็คก่อนว่าเป็น JSON จริงไหม
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          code: 'API_ERROR',
          message: response.status === 404 
            ? 'ไม่พบ endpoint กรุณาติดต่อผู้พัฒนา' 
            : `Server error (${response.status})`
        };
      }

      return data;
      
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId/pending-requests
   */
  getPendingRequests: async (tripId: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/${tripId}/pending-requests`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /api/trips/:tripId/approve/:userId
   */
  approveRequest: async (tripId: string, userId: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(
        `/trips/${tripId}/approve/${userId}`,
        { 
          method: 'PATCH' 
        }
      );
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /api/trips/:tripId/reject/:userId
   */
  rejectRequest: async (tripId: string, userId: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(
        `/trips/${tripId}/reject/${userId}`,
        { 
          method: 'PATCH'
        }
      );
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  getMembers: async (tripId: string): Promise<ApiResponse> => {
    try {
      const response = await apiFetch(`/trips/${tripId}/get-members`);
      if (!response.ok) {
        return {
          success: false,
          code: `HTTP_${response.status}`,
          message: response.status === 403 
            ? 'ไม่มีสิทธิ์ดูสมาชิก' 
            : 'โหลดสมาชิกไม่สำเร็จ',
          data: []
        };
      }
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
  
};


// ============================================================================
// VOTE APIs - จัดเรียงตาม Step
// ============================================================================

export const voteAPI = {
  
  // ============================================================================
  // STEP 1: VOTE (Date Availability & Voting)
  // ============================================================================
  
  /**
   * GET /api/votes/:tripId/date-matching-result
   */
  getDateMatchingResult: async (tripId: string): Promise<ApiResponse<DateMatchingResponse>> => {
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockDateMatchingResult(tripId);
  }

  try {
    const response = await apiFetch(
      `/votes/${tripId}/date-matching-result`,
      {
        method: "GET", 
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const result = await response.json();

    return result;

  } catch (error) {
    console.error("❌ getDateMatchingResult error:", error);
    return handleApiError(error);
  }
},

  /**
   * POST /api/votes/availability
   */
  submitAvailability: async (payload: SubmitAvailabilityPayload): Promise<ApiResponse> => {

  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockSubmitAvailability(payload);
  }

  try {
    const response = await apiFetch(
      `/votes/availability`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    return await response.json();

  } catch (error) {
    return handleApiError(error);
  }
},


  /**
   * POST /api/votes/start-voting
   */
  startVoting: async (tripId: string): Promise<ApiResponse<StartVotingResponse>> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockStartVoting(tripId);
    }

    try {

      const response = await apiFetch(`/votes/start-voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId })
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ============================================================================
  // STEP 2: BUDGET (Budget Voting)
  // ============================================================================

  /**
   * GET /api/votes/:tripId/get-budget
   */
  getBudgetVoting: async (tripId: string): Promise<ApiResponse<BudgetVotingResponse>> => {

  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockGetBudgetVoting(tripId);
  }

  try {
    const response = await apiFetch(`/votes/${tripId}/get-budget`);

    return await response.json();

  } catch (error) {
    return handleApiError(error);
  }
},


  /**
   * POST /api/votes/:tripId/budget
   */
  updateBudget: async (tripId: string,payload: UpdateBudgetPayload): Promise<ApiResponse<UpdateBudgetResponse>> => {

  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockUpdateBudget(tripId, payload.category, payload.amount);
  }

  try {

    const response = await apiFetch(
      `/votes/${tripId}/budget`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    return await response.json();

  } catch (error) {
    return handleApiError(error);
  }
},


  // ============================================================================
  // STEP 3: PLACE (Location Voting)
  // ============================================================================

  /**
   * GET /api/votes/:tripId/get-vote-place
   */
  getLocationVote: async (tripId: string): Promise<ApiResponse<LocationVoteResponse>> => {
  if (CONFIG.USE_MOCK_DATA) {
    return {
      success: true,
      code: 'LOCATION_VOTES_FETCHED',
      message: 'Mock location votes',
      data: {
        rows: [],
        analysis: null,
        locationVotesTotal: [],
        rowlog: [],
        actualVote: 0,
        totalMembers: 0
        
      }
    };
  }

  try {
    const response = await apiFetch(
      `/votes/${tripId}/get-vote-place`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        code: data.code || "API_ERROR",
        message: data.message || "Failed to fetch location votes"
      };
    }

    return data;

  } catch (error) {
    return handleApiError(error);
  }
},


  /**
   * POST /api/votes/:tripid/vote-place
   */
  submitLocationVote: async (tripid: string,payload: SubmitLocationVotePayload): Promise<ApiResponse<{ scores: LocationScores }>> => {

  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockSubmitLocationVote(tripid, payload.votes.map(v => v.place));
  }

  try {
    const response = await apiFetch(
      `/votes/${tripid}/vote-place`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    return await response.json();

  } catch (error) {
    return handleApiError(error);
  }
},


  // ============================================================================
  // STEP 4: SUMMARY (Trip Close & Summary)
  // ============================================================================

  manualClose: async (tripId: string): Promise<ApiResponse> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockCloseTrip(tripId);
    }

    try {

      const response = await apiFetch(`/trips/${tripId}/manual-close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        } 
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
    },

  };
  
// ============================================================================
// EXPORTS
// ============================================================================

export const notiApi = {
  getNoti: async () => {
    if (CONFIG.USE_MOCK_DATA) {  // ← เพิ่ม mock path
      await mockDelay();
      return getMockNotifications("mock-user-id");
    }
    try {
      const response = await apiFetch(`/noti/get-noti`, {
        method: 'GET',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiFetch(`/noti/${notificationId}/read`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiFetch(`/noti/read-all`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteNoti: async (notificationId: string) => {
    try {
      const response = await apiFetch(`/noti/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default {
  ...tripAPI,
  ...voteAPI
};