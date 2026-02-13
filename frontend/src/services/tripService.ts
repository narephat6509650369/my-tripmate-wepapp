// ============================================================================
// frontend/src/services/tripService.ts
<<<<<<< HEAD
// ✅ รองรับทั้ง Mock Data และ API จริง
=======
// ✅ รองรับทั้ง Mock Data และ API จริง - จัดเรียงตาม Step
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
  LocationScores
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
<<<<<<< HEAD
  getMockGetBudgetVoting
=======
  getMockGetBudgetVoting,
  getMockDateMatchingResult 
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
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
=======
   * GET /api/trips/all-my-trips
   */
  getMyTrips: async (): Promise<ApiResponse<MyTripsResponse>> => {
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockMyTrips();
    }

<<<<<<< HEAD
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
=======
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/trips/all-my-trips`,
        {
          method: "GET",
          credentials: "include"
        }
      );

      return await response.json();

>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId
   */
  getTripDetail: async (tripId: string): Promise<ApiResponse<TripDetail>> => {
<<<<<<< HEAD
    // ✅ Mock Mode
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripDetail(tripId);
    }

<<<<<<< HEAD
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
=======
    try {

      const response = await fetchWithTimeout(
        `${API_URL}/trips/${tripId}`,
      {
        credentials: "include"
      }
      );

      return await response.json();

>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/trips/:tripId/summary
   */
  getTripSummary: async (tripId: string): Promise<ApiResponse<TripSummaryResult>> => {
<<<<<<< HEAD
    // ✅ Mock Mode
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockTripSummary(tripId);
    }

<<<<<<< HEAD
    // ✅ Real API
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
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
=======
   * POST /api/trips/AddTrip
   */
  createTrip: async (payload: CreateTripPayload): Promise<ApiResponse<CreateTripResponse>> => {
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockCreateTrip(payload);
    }

    try {

      const response = await fetchWithTimeout(`${API_URL}/trips/AddTrip`, {
        method: 'POST',
        credentials: 'include',  
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
<<<<<<< HEAD
   * DELETE /api/trips/:tripId/members/:memberId
   */
  removeMember: async (tripId: string, memberId: string): Promise<ApiResponse> => {
    // ✅ Mock Mode
=======
   * POST /api/trips/join
   */
  joinTrip: async (inviteCode: string): Promise<ApiResponse<JoinTripResponse>> => {
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockJoinTrip(inviteCode);
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/trips/join`, {
      method: 'POST',
      credentials: 'include', // 🔥 สำคัญมาก
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invite_code: inviteCode })
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
  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockDeleteTrip(tripId);
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/trips/${tripId}`, {
      method: 'DELETE',
      credentials: 'include', 
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
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockRemoveMember(tripId, memberId);
    }

<<<<<<< HEAD
    // ✅ Real API
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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
<<<<<<< HEAD
// VOTE APIs
// ============================================================================

export const voteAPI = {
  // ============================================================================
  // DATE AVAILABILITY & VOTING
  // ============================================================================
=======
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
    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/date-matching-result`,
      {
        method: "GET",
        credentials: "include", 
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

>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
  /**
   * POST /api/votes/availability
   */
  submitAvailability: async (payload: SubmitAvailabilityPayload): Promise<ApiResponse> => {
<<<<<<< HEAD
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
=======

  if (CONFIG.USE_MOCK_DATA) {
    await mockDelay();
    return getMockSubmitAvailability(payload);
  }

  try {
    const response = await fetchWithTimeout(
      `${API_URL}/votes/availability`,
      {
        method: "POST",
        credentials: "include", 
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

>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

  /**
   * POST /api/votes/start-voting
   */
  startVoting: async (tripId: string): Promise<ApiResponse<StartVotingResponse>> => {
<<<<<<< HEAD
    // ✅ Mock Mode
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockStartVoting(tripId);
    }

<<<<<<< HEAD
    // ✅ Real API
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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

<<<<<<< HEAD
  /**
  * GET /:tripId/date-matching-result
  */
  getDateMatchingResult: async (tripId: string): Promise<ApiResponse<DateMatchingResponse>> => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      // Implement mock function if needed
      return {
        success: true,
        code: 'MOCK_SUCCESS',
        message: 'Mock date matching result',
        //data: { intersection: [], weighted: [], totalMembers: 0 }
      };
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

      const response = await fetchWithTimeout(`${API_URL}/votes/${tripId}/date-matching-result`, {
        headers: getAuthHeaders()
      });
      console.log("Get data:",response);

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
=======
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
    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/get-budget`,
      {
        credentials: "include" 
      }
    );

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

    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/budget`,
      {
        method: "POST",
        credentials: "include", 
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
  getLocationVote: async (tripId: string) => {
  if (CONFIG.USE_MOCK_DATA) {
    return {
      success: true,
      code: 'LOCATION_VOTES_FETCHED',
      message: 'Mock location votes',
      data: []
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_URL}/votes/${tripId}/get-vote-place`,
      {
        method: "GET",
        credentials: "include" 
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


>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
  /**
   * POST /api/votes/:tripid/vote-place
   */
  submitLocationVote: async (
    tripid: string,
    payload: SubmitLocationVotePayload
  ): Promise<ApiResponse<{ scores: LocationScores }>> => {
<<<<<<< HEAD
    // ✅ Mock Mode
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockSubmitLocationVote(tripid, payload.votes.map(v => v.place));
    }

<<<<<<< HEAD
    // ✅ Real API
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    try {
      if (!checkAuth()) {
        return {
          success: false,
          code: 'AUTH_UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบใหม่'
        };
      }

      const response = await fetchWithTimeout(`${API_URL}/votes/${tripid}/vote-place`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

<<<<<<< HEAD
  getLocationVote: async (tripId: string) => {
    // ✅ Mock Mode
    if (CONFIG.USE_MOCK_DATA) {
      return {
        success: true,
        code: 'LOCATION_VOTES_FETCHED',
        message: 'Mock location votes',
        data: []
      };
    }

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/votes/${tripId}/get-vote-place`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
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
  //close ต้องแก้เพิ่ม
=======
  // ============================================================================
  // STEP 4: SUMMARY (Trip Close & Summary)
  // ============================================================================
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

  /**
   * POST /api/votes/:tripCode/close
   */
  closeTrip: async (tripCode: string): Promise<ApiResponse> => {
<<<<<<< HEAD
    // ✅ Mock Mode
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
    if (CONFIG.USE_MOCK_DATA) {
      await mockDelay();
      return getMockCloseTrip(tripCode);
    }

<<<<<<< HEAD
    // ✅ Real API
=======
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
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