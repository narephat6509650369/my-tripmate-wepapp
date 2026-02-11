// ============================================================================
// frontend/src/services/tripService.ts
// ✅ รองรับทั้ง Mock Data และ API จริง
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
  GetLocationVoteResponse,
  DateMatchingResponse,
  BudgetVotingResponse,
  LocationScores
} from '../types';

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
  getMockGetDateMatchingResult,
  getMockGetDateMatchingResult_Partial,
  getMockGetDateMatchingResult_NoMatch,
  getMockGetDateMatchingResult_Empty,
  getMockStartVoting,
  getMockUpdateBudget,
  getMockGetBudgetVoting,
  getMockSubmitLocationVote,
  getMockGetLocationVote,
  getMockGetLocationVote_RegionalWinner,
  getMockGetLocationVote_Empty,
  getMockGetLocationVote_AllTied,
  getMockGetLocationVote_SingleUser,
  getMockCloseTrip,
  mockDelay
} from '../data/mockData';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwtToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const checkAuth = (): boolean => {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    console.warn('⚠️ No auth token found');
    return false;
  }
  return true;
};

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
   * POST /api/trips/AddTrip
   */
  createTrip: async (payload: CreateTripPayload): Promise<ApiResponse<CreateTripResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockCreateTrip(payload);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่',
          error: { reason: 'NO_AUTH_TOKEN' }
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/AddTrip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/all-my-trips
   */
  getMyTrips: async (): Promise<ApiResponse<MyTripsResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockMyTrips();
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/all-my-trips`, {
        headers: getAuthHeaders()
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
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockJoinTrip(inviteCode);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ invite_code: inviteCode })
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId
   */
  getTripDetail: async (tripId: string): Promise<ApiResponse<TripDetail>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripDetail(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/${tripId}`, {
        headers: getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId/summary
   */
  getTripSummary: async (tripId: string): Promise<ApiResponse<TripSummaryResult>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripSummary(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/${tripId}/summary`, {
        headers: getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * DELETE /api/trips/:tripId
   */
  deleteTrip: async (tripId: string): Promise<ApiResponse> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockDeleteTrip(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/trips/${tripId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockRemoveMember(tripId, memberId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(
        `${API_URL}/trips/${tripId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// ============================================================================
// VOTE APIs
// ============================================================================

export const voteAPI = {
  // ============================================================================
  // DATE AVAILABILITY & VOTING
  // ============================================================================
  /**
   * POST /api/votes/availability
   */
  submitAvailability: async (payload: SubmitAvailabilityPayload): Promise<ApiResponse> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockSubmitAvailability(payload);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/availability`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/votes/heatmap/:tripId
   */
  /*
  getTripHeatmap: async (tripId: string): Promise<ApiResponse<HeatmapData>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripHeatmap(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/heatmap/${tripId}`, {
        headers: getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
*/
  /**
   * POST /api/votes/start-voting
   */
  startVoting: async (tripId: string): Promise<ApiResponse<StartVotingResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockStartVoting(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/start-voting`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ trip_id: tripId })
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
 * GET /api/votes/:tripId/date-matching-result
 * ✅ ดึงผลการวิเคราะห์วันที่
 */
getDateMatchingResult: async (tripId: string): Promise<ApiResponse<DateMatchingResponse>> => {
  // ✅ Mock Mode
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    
    // ✅ เลือกใช้ Mock Data แบบไหน
    // ทดสอบกรณีไม่มีวันติดกัน (Sliding Window):
    return getMockGetDateMatchingResult(tripId);
    
    // 💡 Uncomment เพื่อทดสอบ Scenarios อื่น:
    // return getMockGetDateMatchingResult_Partial(tripId);    // Partial Match
    // return getMockGetDateMatchingResult_NoMatch(tripId);    // Sliding Window
    // return getMockGetDateMatchingResult_Empty(tripId);      // Empty
  }

  // ✅ Real API
  try {
    if (!checkAuth()) {
      return {
        success: false,
        code: 'AUTH_UNAUTHORIZED',
        message: 'กรุณาเข้าสู่ระบบใหม่'
      };
    }

    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/date-matching-result`, 
      {
        headers: getAuthHeaders()
      }
    );
    
    console.log("Date Matching API Response:", response);

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
},

// ============================================================================
// BUDGET VOTING
// ============================================================================
  /**
   * PUT /api/votes/:tripCode/budget
   */
  updateBudget: async (
    tripId: string,
    payload: UpdateBudgetPayload
  ): Promise<ApiResponse<UpdateBudgetResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockUpdateBudget(tripId, payload.category, payload.amount);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/${tripId}/budget`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/votes/:tripCode
   */
  getBudgetVoting: async (tripId: string): Promise<ApiResponse<BudgetVotingResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockGetBudgetVoting(tripId);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/${tripId}/get-budget`, {
        headers: getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

// ============================================================================
// LOCATION VOTING
// ============================================================================

/**
 * POST /api/votes/:tripId/location
 * ✅ ส่งคะแนนโหวตสถานที่
 */
submitLocationVote: async (
  tripId: string,
  payload: SubmitLocationVotePayload
): Promise<ApiResponse> => {
  // ✅ Validation
  if (!payload.votes || !Array.isArray(payload.votes)) {
    return {
      success: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid votes payload'
    };
  }

  // ✅ Validate each vote
  for (const vote of payload.votes) {
    if (!vote.location_name || typeof vote.score !== 'number') {
      return {
        success: false,
        code: 'INVALID_VOTE',
        message: 'Each vote must have location_name and score'
      };
    }
    
    if (vote.score < 1 || vote.score > 3) {
      return {
        success: false,
        code: 'INVALID_SCORE',
        message: 'Score must be between 1 and 3'
      };
    }
  }

    // ✅ Mock Mode
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockSubmitLocationVote(tripId, payload);
  }

  // ✅ Real API
  try {
    if (!checkAuth()) {
      return {
        success: false,
        code: 'AUTH_UNAUTHORIZED',
        message: 'กรุณาเข้าสู่ระบบใหม่'
      };
    }

    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/vote-place`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      }
    );

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
},

/**
 * GET /api/votes/:tripId/location
 * ✅ ดึงข้อมูลการโหวตสถานที่ + ผลรวม
 */
getLocationVote: async (
  tripId: string
): Promise<ApiResponse<GetLocationVoteResponse>> => {
  // ✅ Mock Mode - เลือก Scenario
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    
    // ✅ สามารถสลับ Scenario ได้ที่นี่
    return getMockGetLocationVote(tripId);  // Default: Clear Winner
    
    // Uncomment เพื่อทดสอบ Scenarios อื่น:
    // return getMockGetLocationVote_RegionalWinner(tripId);
    // return getMockGetLocationVote_Empty(tripId);
    // return getMockGetLocationVote_AllTied(tripId);
    // return getMockGetLocationVote_SingleUser(tripId);
    // return getMockGetLocationVote_Complex(tripId);
  }

  // ✅ Real API
  try {
    if (!checkAuth()) {
      return {
        success: false,
        code: 'AUTH_UNAUTHORIZED',
        message: 'กรุณาเข้าสู่ระบบใหม่'
      };
    }

    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/get-vote-place`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        code: data.code || 'API_ERROR',
        message: data.message || 'Failed to fetch location votes'
      };
    }

    return data;

  } catch (error) {
    return handleApiError(error);
  }
},

  /**
   * POST /api/votes/:tripCode/close
   */
  closeTrip: async (tripCode: string): Promise<ApiResponse> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockCloseTrip(tripCode);
    }

    // ✅ Real API
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/${tripCode}/close`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ...tripAPI,
  ...voteAPI
};