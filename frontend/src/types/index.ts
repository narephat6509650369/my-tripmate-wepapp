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

export interface DateIntersectionResult {
  userAvailability: string[];
  intersection: string[];
  weighted: WeightedDateResult[];
  totalMembers: number;
}

export interface WeightedDateResult {
  day: string;
  freeMembers: number;
  score: number;
}

export interface DateMatchingResponse {
  success: boolean;
  code: string;
  message: string;
  data: DateIntersectionResult;
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
 * Vote ของแต่ละคนในแต่ละ category
 * ใช้สำหรับคำนวณสถิติและแสดงผล
 */
export interface BudgetVote {
  user_id: string;
  category_name: string;
  estimated_amount: number;
  voted_at?: string | Date;
}

/**
 * Budget category พร้อมข้อมูล votes ทั้งหมด
 * Backend ต้องส่ง all_votes มาด้วยเพื่อให้ Frontend คำนวณสถิติได้
 */
export interface BudgetCategoryData {
  category_name: string;
  estimated_amount: number;
  proposed_by?: string;
  proposed_at?: string | Date;
  priority?: number;
  is_backup?: boolean;
  all_votes?: BudgetVote[]; // ⭐ สำคัญ: สำหรับคำนวณสถิติ
}

/**
 * Budget item จาก API (รูปแบบที่ Backend อาจส่งมา)
 */
export interface BudgetItem {
  category?: string;
  category_name?: string;
  amount?: number;
  estimated_amount?: number;
  proposed_by?: string;
  proposed_at?: string | Date;
  user_id?: string;
  last_updated?: string;
}

/**
 * Log การเสนองบประมาณ (ประวัติ)
 */
export interface BudgetProposalLog {
  proposed_by: string;
  proposed_at: string | Date;
  category_name: string;
  estimated_amount: number;
  priority?: number;
  proposed_by_name: string;
}

/**
 * Response จาก getBudgetVoting API
 * ⚠️ Backend ต้องส่งตามโครงสร้างนี้
 */
export interface BudgetVotingDetailResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: {
    budgets?: BudgetItem[];
    budget_options?: BudgetCategoryData[]; // ⭐ ต้องมี all_votes
    rowlog?: BudgetProposalLog[];
  };
}

/**
 * สถิติงบประมาณสำหรับแต่ละ category
 * (Frontend-only type สำหรับคำนวณและแสดงผล)
 */
export interface BudgetStats {
  avg: number;
  min: number;
  max: number;
  myValue: number;
  median?: number;
  outliersCount?: number;
}

/**
 * Map ของสถิติทุก category
 */
export interface BudgetStatsMap {
  accommodation: BudgetStats;
  transport: BudgetStats;
  food: BudgetStats;
  other: BudgetStats;
}

/**
 * Payload สำหรับ update budget
 */
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

/**
 * Budget log (สำหรับ history)
 */
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

/**
 * Budget voting response (สำหรับ summary page)
 */
export interface BudgetVotingResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    trip_id: string;
    budget_voting: {
      budget_voting_id: string;
      total_budget: number;
      status: 'active' | 'closed';
      closed_at: string | null;
    } | null;
    budget_options: {
      category_name: BudgetCategory;
      estimated_amount: number;
      priority: number;
      is_backup: boolean;
    }[];
    user_budgets: {
      category_name: BudgetCategory;
      proposed_amount: number;
    }[];
  };
}

export interface UserBudgetOption {
  category_name: Budget;
  estimated_amount: number;
  user_id: string;
  last_updated: string;
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
  location_name: string;
  score: number;
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

export interface SubmitLocationVotePayload {
  votes: LocationVote[]; 
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
  trip_id: string;
  my_votes: Array<{
    place: string;        // ✅ Backend ส่งกลับมาเป็น "place"
    score: number;
  }>;
  voting_results: LocationVoteResult[];
}

// ✅ Type Guard
export const isLocationVote = (obj: any): obj is LocationVote => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.location_name === 'string' &&
    typeof obj.score === 'number' &&
    obj.score >= 1 &&
    obj.score <= 3
  );
};

// ✅ Helper: แปลง place → location_name
export const placeToLocationVote = (
  place: string,
  score: number
): LocationVote => ({
  location_name: place,
  score
});

// ✅ Helper: แปลง location_name → place
export const locationVoteToPlace = (
  vote: LocationVote
): { place: string; score: number } => ({
  place: vote.location_name,
  score: vote.score
});

export interface LocationScores {
  [province: string]: number;
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