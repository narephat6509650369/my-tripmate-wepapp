// ============== ANALYTICS TYPES ==============

export interface TripActivity {
  id: string;
  tripCode: string;
  userId: string;
  userName: string;
  action: 'created' | 'joined' | 'selected_dates' | 'submitted_budget' | 'voted_province' | 'completed';
  timestamp: number;
  timeSpentMinutes?: number;
  metadata?: Record<string, any>;
}

export interface TripStatistics {
  // Time Metrics
  createdAt: number;
  firstMemberJoinedAt?: number;
  allDataCompletedAt?: number;
  closedAt?: number;
  totalDuration?: number; // minutes
  
  // Participation Metrics
  totalMembers: number;
  membersCompletedBudget: number;
  membersVotedDates: number;
  membersVotedProvinces: number;
  
  // Activity Metrics
  totalActivities: number;
  averageTimeToComplete: number; // minutes per member
  
  // Completion Rates
  dateVotingRate: number;        // 0-100
  budgetCompletionRate: number;  // 0-100
  provinceVotingRate: number;    // 0-100
  overallCompletionRate: number; // 0-100
  
  // Comparison (if available)
  estimatedTimeWithoutSystem?: number; // minutes
  actualTimeSaved?: number;            // minutes
  timeSavedPercentage?: number;        // 0-100
}

export interface MemberProgress {
  memberId: string;
  memberName: string;
  dateSelected: boolean;
  budgetFilled: boolean;
  provinceVoted: boolean;
  completionPercentage: number;
  lastActivityAt?: number;
}

export interface FollowMajorityPreferences {
  dates: boolean;
  budget: boolean;
  province: boolean;
}