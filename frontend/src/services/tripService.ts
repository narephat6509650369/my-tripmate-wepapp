// ============================================================================
// frontend/src/services/tripService.ts
// ✅ แก้ไข: เรียกใช้ Mock Data จาก mockData.ts
// ============================================================================

import axios, { AxiosError } from 'axios';
import { APP_CONFIG } from '../config/app.config';

// ✅ Import Mock Data Functions
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
  mockDelay
} from '../data/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  error?: {
    field?: string;
    reason?: string;
    detail?: string | object;
  };
}

// Trip Types
interface CreateTripPayload {
  trip_name: string;
  description: string | null;
  num_days: number;
}

interface CreateTripResponse {
  trip_id: string;
  owner_id: string;
  trip_name: string;
  description: string | null;
  num_days: number;
  invite_code: string;
  invite_link: string;
  status: string;
}

interface TripSummary {
  trip_id: string;
  trip_name: string;
  status: string;
  role: 'owner' | 'member';
  num_members: number;
  created_at?: string;
}

interface MyTripsResponse {
  all: TripSummary[];
  owned: TripSummary[];
  joined: TripSummary[];
}

interface TripDetail {
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
  members?: Array<{
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
  }>;
  provinceVotes?: Array<{
    province_name: string;
    score: number;
  }>;
  budgetOptions?: Array<{
    category_name: string;
    estimated_amount: number;
    is_backup: boolean;
  }>;
  memberAvailabilitys?: Array<{
    id: string;
    user_id: string;
    full_name: string;
    start_date: string;
    end_date: string;
    created_at: string;
  }>;
}

interface JoinTripResponse {
  trip_id: string;
  trip_name: string;
  rejoined?: boolean;
}

interface TripSummaryResult {
  trip: {
    trip_id: string;
    trip_name: string;
    description: string | null;
    num_days: number;
    status: string;
    confirmed_at: string | null;
    created_at: string;
  };
  members: Array<{
    user_id: string;
    role: 'owner' | 'member';
    full_name: string;
    avatar_url: string | null;
  }>;
  budgetVoting: {
    budget_voting_id: string;
    total_budget: number;
    status: 'active' | 'closed';
    closed_at: string | null;
  } | null;
  budgetOptions: Array<{
    category_name: string;
    estimated_amount: number;
    priority: number;
    is_backup: boolean;
  }>;
  locationResult: {
    province_name: string;
    vote_count: number;
  } | null;
  dateOptions: Array<{
    start_date: string;
    end_date: string;
  }>;
}

// Voting Types
interface DateRange {
  start_date: string;
  end_date: string;
}

interface SubmitAvailabilityPayload {
  trip_id: string;
  ranges: DateRange[];
}

interface HeatmapData {
  [date: string]: string[];
}

interface StartVotingResponse {
  voting_id: string;
  status: 'active';
  message: string;
}

interface UpdateBudgetPayload {
  category: string;
  amount: number;
}

interface UpdateBudgetResponse {
  old_amount: number;
  new_amount: number;
}

interface SubmitLocationVotePayload {
  votes: [string, string, string];
}

interface LocationScores {
  [province: string]: number;
}

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized - clearing token');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// ERROR HANDLER
// ============================================================================

const handleApiError = (error: any, context: string): never => {
  console.error(`❌ ${context} failed:`, error);

  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || 'เกิดข้อผิดพลาด';
    throw new Error(`[${status}] ${message}`);
  } else if (error.request) {
    throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
  } else {
    throw new Error(error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
};

// ============================================================================
// TRIP MANAGEMENT APIs
// ============================================================================

/**
 * ✅ FR2.1: สร้างทริป
 */
const createTrip = async (
  payload: CreateTripPayload
): Promise<ApiResponse<CreateTripResponse>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for createTrip');
    await mockDelay();
    return getMockCreateTrip(payload);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<CreateTripResponse>>(
      '/trips',
      payload
    );
    
    console.log('✅ Trip created:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'createTrip');
  }
};

/**
 * ✅ FR2.2: ดึงทริปทั้งหมด
 */
const getMyTrips = async (): Promise<ApiResponse<MyTripsResponse>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for getMyTrips');
    await mockDelay();
    return getMockMyTrips();
  }

  // Real API
  try {
    const { data } = await api.get<ApiResponse<TripSummary[]>>('/trips/my');
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    const owned = data.data.filter(trip => trip.role === 'owner');
    const joined = data.data.filter(trip => trip.role === 'member');
    
    const response: ApiResponse<MyTripsResponse> = {
      success: true,
      code: data.code,
      message: data.message,
      data: {
        all: data.data,
        owned,
        joined
      }
    };
    
    console.log('✅ Loaded trips:', response.data);
    return response;
  } catch (error) {
    handleApiError(error, 'getMyTrips');
  }
};

/**
 * ✅ FR2.3: ดึงรายละเอียดทริป
 */
const getTripDetail = async (
  tripCode: string
): Promise<ApiResponse<TripDetail>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for getTripDetail:', tripCode);
    await mockDelay();
    return getMockTripDetail(tripCode);
  }

  // Real API
  try {
    const { data } = await api.get<ApiResponse<TripDetail>>(
      `/trips/${tripCode}`
    );
    
    console.log('✅ Trip detail loaded:', data.data);
    return data;
  } catch (error) {
    handleApiError(error, 'getTripDetail');
  }
};

/**
 * ✅ FR2.10: เข้าร่วมทริป
 */
const joinTrip = async (
  invite_code: string
): Promise<ApiResponse<JoinTripResponse>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for joinTrip:', invite_code);
    await mockDelay();
    return getMockJoinTrip(invite_code);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<JoinTripResponse>>(
      '/trips/join',
      { invite_code }
    );
    
    console.log('✅ Joined trip:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'joinTrip');
  }
};

/**
 * ✅ FR2.5: ลบทริป
 */
const deleteTrip = async (
  tripId: string
): Promise<ApiResponse<null>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for deleteTrip:', tripId);
    await mockDelay();
    return getMockDeleteTrip(tripId);
  }

  // Real API
  try {
    const { data } = await api.delete<ApiResponse<null>>(
      `/trips/${tripId}`
    );
    
    console.log('✅ Trip deleted:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'deleteTrip');
  }
};

/**
 * ✅ FR2.12: ลบสมาชิก
 */
const removeMember = async (
  trip_id: string,
  member_id: string
): Promise<ApiResponse<null>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for removeMember');
    await mockDelay();
    return getMockRemoveMember(trip_id, member_id);
  }

  // Real API
  try {
    const { data } = await api.delete<ApiResponse<null>>(
      `/trips/${trip_id}/members/${member_id}`
    );
    
    console.log('✅ Member removed:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'removeMember');
  }
};

/**
 * ✅ FR2.6: อัปเดตสถานะทริป
 */
const updateTripStatus = async (
  tripId: string,
  isCompleted: boolean
): Promise<ApiResponse<null>> => {
  // ✅ Mock Mode (ไม่มีใน mockData.ts ให้สร้างเอง)
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for updateTripStatus');
    await mockDelay();
    return {
      success: true,
      code: 'OK',
      message: 'Trip status updated',
      data: null
    };
  }

  // Real API
  try {
    const { data } = await api.patch<ApiResponse<null>>(
      `/trips/${tripId}/status`,
      { isCompleted }
    );
    
    console.log('✅ Trip status updated:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'updateTripStatus');
  }
};

/**
 * ✅ FR2.7: ดึงสรุปทริป
 */
const getTripSummary = async (
  tripId: string
): Promise<ApiResponse<TripSummaryResult>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for getTripSummary');
    await mockDelay();
    return getMockTripSummary(tripId);
  }

  // Real API
  try {
    const { data } = await api.get<ApiResponse<TripSummaryResult>>(
      `/trips/${tripId}/summary`
    );
    
    console.log('✅ Trip summary loaded:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'getTripSummary');
  }
};

// ============================================================================
// VOTING APIs
// ============================================================================

/**
 * ✅ FR2.8: บันทึกช่วงวันที่ว่าง
 */
const submitAvailability = async (
  payload: SubmitAvailabilityPayload
): Promise<ApiResponse<null>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for submitAvailability');
    await mockDelay();
    return getMockSubmitAvailability(payload);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<null>>(
      '/vote/availability',
      payload
    );
    
    console.log('✅ Availability submitted:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'submitAvailability');
  }
};

/**
 * ✅ FR2.9: ดึง Heatmap
 */
const getTripHeatmap = async (
  tripId: string
): Promise<ApiResponse<HeatmapData>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for getTripHeatmap');
    await mockDelay();
    return getMockTripHeatmap(tripId);
  }

  // Real API
  try {
    const { data } = await api.get<ApiResponse<HeatmapData>>(
      `/vote/heatmap/${tripId}`
    );
    
    console.log('✅ Heatmap loaded:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'getTripHeatmap');
  }
};

/**
 * ✅ FR2.11: เริ่มการโหวต
 */
const startVoting = async (
  trip_id: string
): Promise<ApiResponse<StartVotingResponse>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for startVoting');
    await mockDelay();
    return getMockStartVoting(trip_id);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<StartVotingResponse>>(
      '/vote/start',
      { trip_id }
    );
    
    console.log('✅ Voting started:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'startVoting');
  }
};

/**
 * ✅ FR2.13: อัปเดตงบประมาณ
 */
const updateBudget = async (
  tripCode: string,
  payload: UpdateBudgetPayload
): Promise<ApiResponse<UpdateBudgetResponse>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for updateBudget');
    await mockDelay();
    return getMockUpdateBudget(tripCode, payload.category, payload.amount);
  }

  // Real API
  try {
    const { data } = await api.put<ApiResponse<UpdateBudgetResponse>>(
      `/vote/${tripCode}/budget`,
      payload
    );
    
    console.log('✅ Budget updated:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'updateBudget');
  }
};

/**
 * ✅ FR2.14: โหวตจังหวัด
 */
const submitLocationVote = async (
  tripCode: string,
  payload: SubmitLocationVotePayload
): Promise<ApiResponse<{ scores: LocationScores }>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for submitLocationVote');
    await mockDelay();
    return getMockSubmitLocationVote(tripCode, payload.votes);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<{ scores: LocationScores }>>(
      `/vote/${tripCode}/location`,
      payload
    );
    
    console.log('✅ Location voted:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'submitLocationVote');
  }
};

/**
 * ✅ FR2.15: ปิดการโหวต
 */
const closeTrip = async (
  tripCode: string
): Promise<ApiResponse<null>> => {
  // ✅ Mock Mode
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for closeTrip');
    await mockDelay();
    return getMockCloseTrip(tripCode);
  }

  // Real API
  try {
    const { data } = await api.post<ApiResponse<null>>(
      `/vote/${tripCode}/close`
    );
    
    console.log('✅ Trip closed:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'closeTrip');
  }
};

/**
 * ✅ FR2.16: ดึงข้อมูลทริปสำหรับหน้า Vote
 */
const getVotePageData = async (
  tripCode: string
): Promise<ApiResponse<any>> => {
  // ✅ Mock Mode - ใช้ getTripDetail แทน
  if (APP_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 Using Mock Data for getVotePageData');
    await mockDelay();
    return getMockTripDetail(tripCode);
  }

  // Real API
  try {
    const { data } = await api.get<ApiResponse<any>>(
      `/vote/${tripCode}`
    );
    
    console.log('✅ Vote page data loaded:', data);
    return data;
  } catch (error) {
    handleApiError(error, 'getVotePageData');
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export const tripAPI = {
  createTrip,
  getMyTrips,
  getTripDetail,
  joinTrip,
  deleteTrip,
  removeMember,
  updateTripStatus,
  getTripSummary,
};

export const voteAPI = {
  submitAvailability,
  getTripHeatmap,
  startVoting,
  updateBudget,
  submitLocationVote,
  closeTrip,
  getVotePageData,
};

// Export types สำหรับใช้ใน components
export type {
  ApiResponse,
  CreateTripPayload,
  CreateTripResponse,
  TripSummary,
  MyTripsResponse,
  TripDetail,
  JoinTripResponse,
  TripSummaryResult,
  DateRange,
  SubmitAvailabilityPayload,
  HeatmapData,
  StartVotingResponse,
  UpdateBudgetPayload,
  UpdateBudgetResponse,
  SubmitLocationVotePayload,
  LocationScores,
};

export default {
  ...tripAPI,
  ...voteAPI,
};