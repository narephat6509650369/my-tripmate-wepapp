// ============================================================================
// frontend/src/types/index.ts
// ✅ Types ที่ตรงกับ Backend APIs
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
  membercount: number;
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
}

export interface MyTripsResponse {
  all: TripSummary[];
  owned: TripSummary[];
  joined: TripSummary[];
}

export interface TripDetail {
  tripid: string;
  ownerid: string;
  tripname: string;
  description: string | null;
  numdays: number;
  invitecode: string;
  invitelink: string;
  status: string;
  createdat: string;
  updatedat?: string;
  membercount: number,
  confirmedat?: string | null;
  isactive?: boolean;
  current_user_id?: string; // ⭐ เพิ่มสำหรับ StepBudget
  members: Member[];
  dateRanges: DateRange[];
  provinceVotes: ProvinceVote[];
  budgetOptions: BudgetOption[];
  memberAvailabilitys: MemberAvailability[];
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  fullName: string;
  avatarUrl: string | null;
  joinedAt: number;
  isActive: boolean;
}

export interface DateRange {
  availableDate: string;
}

export interface ProvinceVote {
  provinceName: string;
  voteCount: number;
}

export interface BudgetOption {
  categoryName: string;
  estimatedAmount: number;
  priority: number;
  isBackup: boolean;
}

export interface MemberAvailability {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  availableDates: string[];
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
  trip_id: string;
  trip_name: string;
  rejoined: boolean;
}

// ============================================================================
// STEP 1: DATE VOTING TYPES
// ============================================================================

export interface SubmitAvailabilityPayload {
  trip_id: string;
  user_id: string;
  ranges: string[]; // ["2025-12-25", "2025-12-26"]
}

export interface HeatmapData {
  [date: string]: string[]; // { "2025-12-25": ["user-id-1", "user-id-2"] }
}

export interface StartVotingResponse {
  voting_id: string;
  status: 'active';
  message: string;
}

export interface DateMatchingResponse {
  rows: string[];
  countrows: number;

  summary: {
    totalMembers: number;
    totalAvailableDays: number;
  };

  availability: {
    date: string;
    count: number;
    percentage: number;
  }[];

  recommendation: {
    dates: string[];
    avgPeople: number;
    percentage: number;
    score: number;
    isConsecutive: boolean;
  } | null;

  rowlog: {
    available_date: string;
    proposed_at: string;
    proposed_by: string;
    proposed_by_name: string;
  }[];
}


// ============================================================================
// STEP 2: BUDGET VOTING TYPES
// ============================================================================

/**
 * Budget category type
 */
export type BudgetCategory = 'accommodation' | 'transport' | 'food' | 'other';

/**
 * Budget state/data structure
 */
export interface Budget {
  accommodation: number;
  transport: number;
  food: number;
  other: number;
}

/**
 * Response จากการดึงผลโหวตงบประมาณ
 */
export type BudgetVotingResponse = {
  rows: Array<{
    user_id: string;
    category_name: BudgetCategory;
    estimated_amount: number;
    voted_at: string;
  }>;

  stats: {
    [K in BudgetCategory]: {
      q1: number;
      q2: number;
      q3: number;
      iqr: number;
      lowerBound: number;
      upperBound: number;
      filteredCount: number;
      removedCount: number;
      removedValues: number[];
    };
  };

  budgetTotal: number;
  minTotal: number;
  maxTotal: number;
  filledMembers: number;

  rowlog: Array<{
    proposed_by: string;
    proposed_by_name: string;
    proposed_at: string;
    category_name: BudgetCategory;
    estimated_amount: number;
    priority?: number;
  }>;
};

export interface UpdateBudgetPayload {
  category: BudgetCategory;
  amount: number;
}

/**
 * Response จาก update budget
 */
export interface UpdateBudgetResponse {
  old_amount: number;
  new_amount: number;
}


// ============================================================================
// BUDGET CONSTANTS
// ============================================================================

/**
 * Category mapping TH-EN
 */
export const CATEGORY_MAPPING: Record<string, keyof Budget> = {
  'ที่พัก': 'accommodation',
  'เดินทาง': 'transport',
  'อาหาร': 'food',
  'อื่นๆ': 'other',
  'accommodation': 'accommodation',
  'transport': 'transport',
  'food': 'food',
  'other': 'other',
} as const;

/**
 * Budget validation constants
 */
export const BUDGET_LIMITS = {
  MIN: 0,
  MAX: 10_000_000, // 10 ล้านบาท
  STEP: 100
} as const;

/**
 * Budget categories configuration
 */
export interface BudgetCategoryItem {
  key: keyof Budget;
  label: string;
  color: string;
  required: boolean;
}

/**
 * Budget categories configuration
 */
export const BUDGET_CATEGORIES = [
  { key: 'accommodation' as const, label: 'ค่าที่พัก*', color: '#3b82f6', required: true },
  { key: 'transport' as const, label: 'ค่าเดินทาง*', color: '#8b5cf6', required: true },
  { key: 'food' as const, label: 'ค่าอาหาร*', color: '#10b981', required: true },
  { key: 'other' as const, label: 'เงินสำรอง', color: '#f59e0b', required: false }
] as const;

// ============================================================================
// STEP 3: LOCATION VOTING TYPES
// ============================================================================

export interface LocationVote {
  place: string; 
  score: number;
}

export interface SubmitLocationVotePayload {
  votes: LocationVote[];
}

// Location Vote Result (สำหรับแสดงผล)
export interface LocationVoteResult {
  place: string;           // ✅ ใช้ "place" สำหรับแสดงผล
  total_score: number;
  vote_count: number;
  voters: string[];
  rank_distribution: {
    rank_1: number;
    rank_2: number;
    rank_3: number;
  };
}

export interface SubmitLocationVoteResponse {
  [province: string]: number;  // { "เชียงใหม่": 15, "ภูเก็ต": 12 }
}

// Voting Result Item
export interface VotingResult {
  place: string;
  total_score: number;
  vote_count: number;
  voters: string[];
  rank_distribution: {
    rank_1: number;
    rank_2: number;
    rank_3: number;
  };
  region?: string;
}

// Response จากการดึงผลโหวตจังหวัด
export interface GetLocationVoteResponse {
  rows: Array<{
    location_vote_id: string;
    location_option_id: string;
    user_id: string;
    voted_at: string;
    score: number;
  }>;

  analysis: {
    hasWinner: boolean;
    winner: {
      place: string;
      region: string;
      total_score: number;
      voteCount: number;
      rank1Count: number;
    } | null;

    topProvinces: Array<{
      place: string;
      region: string;
      total_score: number;
      voteCount: number;
      rank1Count: number;
    }>;
  };

  locationVotesTotal: Array<{
    place: string;
    region: string;
    total_score: number;
    voteCount: number;
    rank1Count: number;
  }>;

  rowlog: Array<{
    proposed_by: string;
    province_name: string;
    score: number;
    proposed_at: string;
    proposed_by_name: string;
  }>;
}


// ✅ Type Guard
export const isLocationVote = (obj: any): obj is LocationVote => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.place === 'string' &&
    typeof obj.score === 'number' &&
    obj.score >= 1 &&
    obj.score <= 3
  );
};

export interface LocationScores {
  [province: string]: number;
}


export interface DateMatchingResponse {
  rows: string[];
  countrows: number;
  summary: {
    totalMembers: number;
    totalAvailableDays: number;
  };
  availability: Array<{
    date: string;
    count: number;
    percentage: number;
  }>;
  recommendation: {
    dates: string[];
    avgPeople: number;
    percentage: number;
    score: number;
    isConsecutive: boolean;
  } | null;
  rowlog: Array<{
    available_date: string;
    proposed_at: string;
    proposed_by: string;
    proposed_by_name: string;
  }>;
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

