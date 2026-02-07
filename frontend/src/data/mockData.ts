// src/data/mockData.ts
import type {
  Trip,
  TripSummary,
  TripDetail,
  MyTripsResponse,
  CreateTripResponse,
  JoinTripResponse,
  ApiResponse,
  HeatmapData,
  DateRange
} from '../types';

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_CURRENT_USER_ID = 'user-001';
export const MOCK_CURRENT_USER_EMAIL = 'user@example.com';

// ✅ Mock Trips (ตรงกับ Backend)
export const MOCK_TRIPS: Trip[] = [
  {
    trip_id: 'trip-001',
    owner_id: 'user-001',
    trip_name: 'ทริปทะเล ภูเก็ต',
    description: 'เที่ยวภูเก็ต 3 วัน 2 คืน',
    num_days: 3,
    invite_code: 'A3K7-P9M2-X5Q8-R4W6',
    invite_link: 'http://localhost:3000/join/trip-001',
    status: 'voting',
    membercount: 3,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    is_active: true
  },
  {
    trip_id: 'trip-002',
    owner_id: 'user-001',
    trip_name: 'ทริปเหนือ เชียงใหม่',
    description: 'เที่ยวเชียงใหม่ 4 วัน 3 คืน',
    num_days: 4,
    invite_code: 'B5H9-L2N4-Y7T3-W8K1',
    invite_link: 'http://localhost:3000/join/trip-002',
    membercount: 3,
    status: 'completed',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    confirmed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_active: true
  },
  {
    trip_id: 'trip-003',
    owner_id: 'user-002',
    trip_name: 'ทริปอีสาน อุบลราชธานี',
    description: 'เที่ยวอีสาน 5 วัน 4 คืน',
    num_days: 5,
    invite_code: 'C8M3-Q6P9-Z2R5-V4D7',
    invite_link: 'http://localhost:3000/join/trip-003',
    status: 'planning',
    membercount: 3,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true
  }
];

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

/**
 * Simulate API delay
 */
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate mock invite code (HEX format)
 */
export const generateMockInviteCode = (): string => {
  const chars = '0123456789ABCDEF';
  const segments = [];

  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  return segments.join('-');
};

/**
 * GET /api/trips/all-my-trips
 */
export const getMockMyTrips = (): ApiResponse<MyTripsResponse> => {
  const allTrips: TripSummary[] = [
    {
      trip_id: 'trip-001',
      trip_name: 'ทริปทะเล ภูเก็ต',
      status: 'voting',
      role: 'owner',
      num_members: 5
    },
    {
      trip_id: 'trip-002',
      trip_name: 'ทริปเหนือ เชียงใหม่',
      status: 'completed',
      role: 'owner',
      num_members: 4
    },
    {
      trip_id: 'trip-003',
      trip_name: 'ทริปอีสาน อุบลราชธานี',
      status: 'planning',
      role: 'member',
      num_members: 6
    }
  ];

  return {
    success: true,
    code: 'OK',
    message: 'Trips retrieved successfully',
    data: {
      all: allTrips,
      owned: allTrips.filter(t => t.role === 'owner'),
      joined: allTrips.filter(t => t.role === 'member')
    }
  };
};

/**
 * GET /api/trips/:tripId
 */
export const getMockTripDetail = (tripId: string): ApiResponse<TripDetail> => {
  const trip = MOCK_TRIPS.find(t => t.trip_id === tripId);

  if (!trip) {
    return {
      success: false,
      code: 'TRIP_NOT_FOUND',
      message: 'ไม่พบทริปนี้'
    };
  }

  return {
    success: true,
    code: 'TRIP_DETAIL_FETCHED',
    message: 'Trip detail fetched successfully',
    data: {
      tripid: trip.trip_id,
      ownerid: trip.owner_id,
      tripname: trip.trip_name,
      description: trip.description,
      numdays: trip.num_days,
      invitecode: trip.invite_code,
      invitelink: trip.invite_link,
      status: trip.status,
      createdat: trip.created_at,
      membercount: trip.membercount,
      members: [],
      dateRanges: [],
      provinceVotes: [],
      budgetOptions: [],
      memberAvailabilitys: []
    }
  };
};

/**
 * POST /api/trips/AddTrip
 */
export const getMockCreateTrip = (payload: {
  trip_name: string;
  description: string | null;
  num_days: number;
}): ApiResponse<CreateTripResponse> => {
  const newTripId = `trip-${Date.now()}`;
  const inviteCode = generateMockInviteCode();

  return {
    success: true,
    code: 'TRIP_CREATED',
    message: 'Trip created successfully',
    data: {
      trip_id: newTripId,
      owner_id: MOCK_CURRENT_USER_ID,
      trip_name: payload.trip_name,
      description: payload.description,
      num_days: payload.num_days,
      invite_code: inviteCode,
      invite_link: `http://localhost:3000/join/${newTripId}`,
      status: 'planning'
    }
  };
};

/**
 * POST /api/trips/join
 */
export const getMockJoinTrip = (inviteCode: string): ApiResponse<JoinTripResponse> => {
  const trip = MOCK_TRIPS.find(t => t.invite_code === inviteCode);

  if (!trip) {
    return {
      success: false,
      code: 'TRIP_NOT_FOUND',
      message: 'ไม่พบห้อง (รหัสผิด)'
    };
  }

  return {
    success: true,
    code: 'TRIP_JOINED',
    message: 'Joined trip successfully',
    data: {
      trip_id: trip.trip_id,
      trip_name: trip.trip_name,
      rejoined: false
    }
  };
};

/**
 * DELETE /api/trips/:tripId
 */
export const getMockDeleteTrip = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'TRIP_DELETED',
    message: 'Trip deleted successfully'
  };
};

/**
 * DELETE /api/trips/:tripId/members/:memberId
 */
export const getMockRemoveMember = (
  tripId: string,
  memberId: string
): ApiResponse => {
  return {
    success: true,
    code: 'TRIP_MEMBER_REMOVED',
    message: 'Member removed successfully'
  };
};

/**
 * GET /api/trips/:tripId/summary
 */
export const getMockTripSummary = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'TRIP_SUMMARY_FETCHED',
    message: 'Trip summary fetched successfully',
    data: {
      trip: {
        trip_id: tripId,
        trip_name: 'ทริปทะเล ภูเก็ต',
        description: 'เที่ยวภูเก็ต 3 วัน 2 คืน',
        num_days: 3,
        status: 'completed',
        confirmed_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 7 * 86400000).toISOString()
      },
      members: [
        {
          user_id: 'user-001',
          role: 'owner',
          full_name: 'สมชาย ใจดี',
          avatar_url: null
        }
      ],
      budgetVoting: null,
      budgetOptions: [],
      locationResult: {
        province_name: 'ภูเก็ต',
        vote_count: 4
      },
      dateOptions: []
    }
  };
};

// ============================================================================
// VOTE APIs MOCK
// ============================================================================

/**
 * POST /api/votes/availability
 */
export const getMockSubmitAvailability = (payload: {
  trip_id: string,
  user_id: string,
  ranges: string[];
}): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Availability saved'
  };
};

/**
 * GET /api/votes/heatmap/:tripId
 */
export const getMockTripHeatmap = (tripId: string): ApiResponse<HeatmapData> => {
  const heatmap: HeatmapData = {
    '2025-01-20': ['user-001', 'user-002'],
    '2025-01-21': ['user-001', 'user-002', 'user-003'],
    '2025-01-22': ['user-001', 'user-003'],
    '2025-01-23': ['user-002', 'user-003']
  };

  return {
    success: true,
    code: 'OK',
    message: 'Heatmap retrieved successfully',
    data: heatmap
  };
};

/**
 * POST /api/votes/start-voting
 */
export const getMockStartVoting = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Voting session started',
    data: {
      voting_id: `voting-${Date.now()}`,
      status: 'active',
      message: 'Voting session started and trip status updated to voting'
    }
  };
};

/**
 * PUT /api/votes/:tripCode/budget
 */
export const getMockUpdateBudget = (
  tripCode: string,
  category: string,
  amount: number
): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Budget updated successfully',
    data: {
      old_amount: 0,
      new_amount: amount
    }
  };
};

/**
 * POST /api/votes/:tripCode/vote-place
 */
export const getMockSubmitLocationVote = (
  tripId: string,
  votes: string[]
): ApiResponse => {
  const scores: Record<string, number> = {};
  votes.forEach((province, index) => {
    scores[province] = 3 - index; // 3, 2, 1
  });

  return {
    success: true,
    code: 'OK',
    message: 'Vote submitted successfully',
    data: { scores }
  };
};

/**
 * POST /api/votes/:tripCode/close
 */
export const getMockCloseTrip = (tripCode: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Trip voting closed successfully'
  };
};

/*
* GET /api/votes/:tripcode/get-budget
*/
export const getMockGetBudgetVoting = (tripCode: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Budget voting retrieved successfully',
    data: {
      trip_id: tripCode,
      budgets: [
        { category: 'ที่พัก', amount: 5000 },
        { category: 'อาหาร', amount: 3000 },
        { category: 'กิจกรรม', amount: 2000 }
      ]
    }
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Data
  MOCK_TRIPS,
  MOCK_CURRENT_USER_ID,
  MOCK_CURRENT_USER_EMAIL,

  // Helpers
  mockDelay,
  generateMockInviteCode,

  // Trip APIs
  getMockMyTrips,
  getMockTripDetail,
  getMockCreateTrip,
  getMockJoinTrip,
  getMockDeleteTrip,
  getMockRemoveMember,
  getMockTripSummary,

  // Vote APIs
  getMockSubmitAvailability,
  getMockTripHeatmap,
  getMockStartVoting,
  getMockUpdateBudget,
  getMockSubmitLocationVote,
  getMockCloseTrip
};