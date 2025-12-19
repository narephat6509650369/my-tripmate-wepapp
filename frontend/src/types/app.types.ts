// Re-export Trip-related types from mockData
export type {
  TripData,
  Member,
  MemberRole,
  BudgetPriority,
  DateRange,
  DateVote,
  ProvinceVote,
  ApiResponse
} from '../data/mockData';

// USER & AUTHENTICATION
export interface User {
  id: number;
  email: string;
  name: string;
  password?: string;
  email_verified: boolean;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

// NOTIFICATIONS
export type NotificationType = 
  | 'trip_invite' 
  | 'new_vote' 
  | 'vote_complete' 
  | 'trip_confirmed';

export interface Notification {
  id: number;
  type: NotificationType;
  text: string;
  read: boolean;
  timestamp: Date;
  tripId?: string;
  tripName?: string;
}

// UI STATE
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// FORM TYPES
export interface TripFormData {
  name: string;
  days: string;
  detail: string;
}

export interface BudgetFormData {
  accommodation: number;
  transport: number;
  food: number;
  other: number;
}

export interface DateRangeFormData {
  startDate: string;
  endDate: string;
}

export interface ProvinceVoteFormData {
  first: string;
  second: string;
  third: string;
}

// UTILITY TYPES
export type ValueOf<T> = T[keyof T];
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// COMPONENT PROPS
export interface WithLogout {
  onLogout?: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// STATISTICS
export interface BudgetStats {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  avg: number;
  count: number;
  values: number[];
}

// CONSTANTS
export type BudgetCategoryKey = 'accommodation' | 'transport' | 'food' | 'other';
export type TripStatus = 'planning' | 'voting' | 'confirmed' | 'completed' | 'cancelled';
export type VoteStatus = 'pending' | 'active' | 'closed';