// ============================================================================
// frontend/src/types/index.ts
// ✅ ฉบับแก้ไข - ตรงกับ Backend Response 100%
// ============================================================================

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

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

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  google_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface GoogleLoginRequest {
  access_token: string;
}

export interface AuthResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    token: string;
    user: {
      user_id: string;
      email: string;
    };
  };
}



// ============================================================================
// TRIP TYPES (ตรงกับ Backend Model)
// ============================================================================

export interface Trip {
  trip_id: string;
  owner_id: string;
  trip_name: string;
  description: string | null;
  num_days: number;
  invite_code: string;
  invite_link: string;
  status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived';
  created_at: string;
  updated_at?: string;
  confirmed_at?: string | null;
  is_active?: boolean;
}

export interface TripMember {
  member_id: string;
  trip_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at?: string;
  is_active?: boolean;
  full_name?: string;
  avatar_url?: string | null;
}

export interface TripSummary {
  trip_id: string;
  trip_name: string;
  status: string;
  role: 'owner' | 'member';
  num_members: number;
  created_at?: string; // ✅ เพิ่ม
}

export interface MyTripsResponse {
  all: TripSummary[];
  owned: TripSummary[];
  joined: TripSummary[];
}

// ✅ แก้ไข: เพิ่ม fields ที่ Backend ส่งกลับมา
export interface TripDetail {
  tripid: string;
  ownerid: string;
  tripname: string;
  description: string | null;
  num_days: number;
  invite_code: string;
  invite_link: string;
  status: 'planning' | 'voting' | 'confirmed' | 'completed' | 'archived';
  created_at: string;
  member_count: number;
}

// ============================================================================
// TRIP SUMMARY (สำหรับ SummaryPage)
// ============================================================================

export interface TripSummaryMember {
  user_id: string;
  role: 'owner' | 'member';
  full_name: string;
  avatar_url: string | null;
}

export interface BudgetVoting {
  budget_voting_id: string;
  total_budget: number;
  status: 'active' | 'closed';
  closed_at: string | null;
}

export interface BudgetOption {
  category_name: string;
  estimated_amount: number;
  priority: number;
  is_backup: boolean;
}

export interface LocationResult {
  province_name: string;
  vote_count: number;
}

export interface DateOption {
  start_date: string;
  end_date: string;
}

export interface TripSummaryResult {
  trip: {
    trip_id: string;
    trip_name: string;
    description: string | null;
    num_days: number;
    status: string;
    confirmed_at: string | null;
    created_at: string;
  };
  members: TripSummaryMember[];
  budgetVoting: BudgetVoting | null;
  budgetOptions: BudgetOption[];
  locationResult: LocationResult | null;
  dateOptions: DateOption[];
}

// ============================================================================
// CREATE/UPDATE TRIP
// ============================================================================

export interface CreateTripPayload {
  trip_name: string;
  description: string | null;
  num_days: number;
}

export interface CreateTripResponse {
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
  invite_code: string;
}

export interface JoinTripResponse {
  // Backend ส่ง snake_case
  trip_id: string;
  trip_name: string;
  rejoined?: boolean;
  
  // รองรับ camelCase (สำหรับ backward compatibility)
  tripId?: string;
  tripName?: string;
}

// หรือใช้แบบนี้ถ้าต้องการ strict
export interface JoinTripResponseStrict {
  trip_id: string;
  trip_name: string;
  rejoined?: boolean;
}

// ============================================================================
// VOTE TYPES
// ============================================================================

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface SubmitAvailabilityPayload {
  trip_id: string;
  ranges: DateRange[];
}

export interface HeatmapData {
  [date: string]: string[]; // { "2025-12-25": ["user-id-1", "user-id-2"] }
}

export interface StartVotingResponse {
  voting_id: string;
  status: 'active';
  message: string;
}

// ============================================================================
// BUDGET TYPES
// ============================================================================

// ✅ เพิ่ม: รองรับ string ด้วย (กรณี DB ไม่มี constraint)
export type BudgetCategory = 'accommodation' | 'transport' | 'food' | 'other' | string;

export interface Budget {
  accommodation: number;
  transport: number;
  food: number;
  other: number;
}

export interface UpdateBudgetPayload {
  category: BudgetCategory;
  amount: number;
}

export interface UpdateBudgetResponse {
  old_amount: number;
  new_amount: number;
}

export interface BudgetLog {
  log_id: string;
  user_id: string;
  category_name: string;
  old_amount: number;
  new_amount: number;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
}

// ============================================================================
// LOCATION VOTING TYPES
// ============================================================================

export interface SubmitLocationVotePayload {
  votes: [string, string, string]; // ต้องส่ง 3 จังหวัด
}

export interface LocationScores {
  [province: string]: number; // { "เชียงใหม่": 15, "ภูเก็ต": 10 }
}

// ============================================================================
// FRONTEND UI TYPES
// ============================================================================

export interface TripCard {
  id: string;
  name: string;
  people: number;
  status: string;
  statusColor: string;
  isCompleted: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ValueOf<T> = T[keyof T];
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isTripCompleted = (status: Trip['status']): boolean => {
  return status === 'completed' || status === 'archived';
};

export const isTripOwner = (member: TripMember): boolean => {
  return member.role === 'owner';
};

export const canEditTrip = (status: Trip['status']): boolean => {
  return status === 'planning' || status === 'voting';
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const formatTripStatus = (status: Trip['status']): string => {
  const statusMap: Record<Trip['status'], string> = {
    planning: 'กำลังวางแผน',
    voting: 'กำลังโหวต',
    confirmed: 'ยืนยันแล้ว',
    completed: 'เสร็จสิ้น',
    archived: 'เก็บถาวร'
  };
  return statusMap[status] || status;
};

export const getTripStatusColor = (status: Trip['status']): string => {
  const colorMap: Record<Trip['status'], string> = {
    planning: 'bg-blue-100 text-blue-700',
    voting: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    archived: 'bg-gray-100 text-gray-500'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

// ============================================================================
// TYPE CONVERSIONS
// ============================================================================

export const tripSummaryToCard = (trip: TripSummary): TripCard => {
  const isCompleted = trip.status === 'completed' || trip.status === 'archived';
  
  return {
    id: trip.trip_id,
    name: trip.trip_name,
    people: trip.num_members,
    status: isCompleted ? 'เสร็จสิ้น' : 'กำลังดำเนินการ',
    statusColor: isCompleted 
      ? 'bg-gray-100 text-gray-700' 
      : 'bg-green-100 text-green-700',
    isCompleted
  };
};