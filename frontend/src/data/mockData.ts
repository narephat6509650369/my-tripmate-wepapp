// ============================================================================
// frontend/src/data/mockData.ts
// ✅ Mock Data ครบทุก Step พร้อม Scenarios เพิ่มเติม
// ============================================================================

import type {
  Trip,
  TripSummary,
  TripDetail,
  MyTripsResponse,
  CreateTripResponse,
  JoinTripResponse,
  ApiResponse,
  HeatmapData,
  SubmitLocationVotePayload,
  GetLocationVoteResponse
} from '../types';

// ============================================================================
// CONSTANTS
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
    membercount: 5,
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
    membercount: 4,
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
    membercount: 6,
    is_active: true
  }
];

// ============================================================================
// HELPER FUNCTIONS
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

// ============================================================================
// TRIP APIs - ✅ คงเดิมทั้งหมด
// ============================================================================

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
<<<<<<< HEAD
<<<<<<< HEAD
      membercount: trip.membercount,
      members: [],
=======
=======
      membercount: trip.membercount,
      current_user_id: MOCK_CURRENT_USER_ID,
>>>>>>> 28d51299 (Implement location algorithm)
      members: [
        { 
          id: 'member-001',
          userId: 'user-001',
          role: 'owner',
          fullName: 'สมชาย ใจดี',
          avatarUrl: null,
          joinedAt: Date.now() - 7 * 86400000,
          isActive: true
        },
        { 
          id: 'member-002',
          userId: 'user-002',
          role: 'member',
          fullName: 'สมหญิง รักดี',
          avatarUrl: null,
          joinedAt: Date.now() - 6 * 86400000,
          isActive: true
        },
        { 
          id: 'member-003',
          userId: 'user-003',
          role: 'member',
          fullName: 'สมศักดิ์ มีสุข',
          avatarUrl: null,
          joinedAt: Date.now() - 5 * 86400000,
          isActive: true
        },
        { 
          id: 'member-004',
          userId: 'user-004',
          role: 'member',
          fullName: 'สมใจ ใจงาม',
          avatarUrl: null,
          joinedAt: Date.now() - 4 * 86400000,
          isActive: true
        }
      ],
>>>>>>> 55291bcc (refactor(vote): improve budget step and voting state flow)
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
// STEP 1: DATE VOTING - ✅ คงเดิม + เพิ่ม Scenarios
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
 * ✅ GET /api/votes/:tripId/date-matching-result (Default - Full Match)
 */
export const getMockGetDateMatchingResult = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Date matching result retrieved successfully',
    data: {
      trip_id: tripId,
      
      userAvailability: [
        '2025-02-10', '2025-02-11', '2025-02-12', '2025-02-13',
        '2025-02-14', '2025-02-15', '2025-02-16', '2025-02-17'
      ],
      
      intersection: [
        '2025-02-10', '2025-02-11', '2025-02-12', '2025-02-13', '2025-02-14'
      ],
      
      weighted: {
        '2025-02-10': 4,
        '2025-02-11': 4,
        '2025-02-12': 4,
        '2025-02-13': 4,
        '2025-02-14': 4,
        '2025-02-15': 3,
        '2025-02-16': 2,
        '2025-02-17': 2,
        '2025-02-18': 1
      },
      
      totalMembers: 4
    }
  };
};

/**
 * ✅ Partial Match - ไม่ครบ N วัน
 */
export const getMockGetDateMatchingResult_Partial = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Date matching result with partial matches',
    data: {
      trip_id: tripId,
      
      userAvailability: [
        '2025-02-10', '2025-02-11', '2025-02-13', '2025-02-14',
        '2025-02-20', '2025-02-21'
      ],
      
      intersection: [
        '2025-02-10', '2025-02-11', '2025-02-13', '2025-02-14'
      ],
      
      weighted: {
        '2025-02-10': 3,
        '2025-02-11': 3,
        '2025-02-12': 1,
        '2025-02-13': 3,
        '2025-02-14': 3,
        '2025-02-15': 2,
        '2025-02-20': 2,
        '2025-02-21': 2
      },
      
      totalMembers: 4
    }
  };
};

/**
 * ✅ No Match - ต้องใช้ Sliding Window
 */
export const getMockGetDateMatchingResult_NoMatch = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'No consecutive dates - using sliding window',
    data: {
      trip_id: tripId,
      
      userAvailability: [
        '2025-02-10', '2025-02-12', '2025-02-15', '2025-02-18', '2025-02-20'
      ],
      
      intersection: [],
      
      weighted: {
        '2025-02-10': 3,
        '2025-02-11': 2,
        '2025-02-12': 3,
        '2025-02-13': 1,
        '2025-02-14': 2,
        '2025-02-15': 3,
        '2025-02-16': 1,
        '2025-02-17': 2,
        '2025-02-18': 3,
        '2025-02-19': 2,
        '2025-02-20': 3
      },
      
      totalMembers: 4
    }
  };
};

/**
 * ✅ Empty - ยังไม่มีข้อมูล
 */
export const getMockGetDateMatchingResult_Empty = (tripId: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'No data yet',
    data: {
      trip_id: tripId,
      userAvailability: [],
      intersection: [],
      weighted: {},
      totalMembers: 4
    }
  };
};

// ============================================================================
// STEP 2: BUDGET VOTING - ✅ ปรับปรุงเล็กน้อย
// ============================================================================

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
 * ✅ GET /api/votes/:tripcode/get-budget (เพิ่ม budgets field)
 */
export const getMockGetBudgetVoting = (tripCode: string): ApiResponse => {
  return {
    success: true,
    code: 'OK',
    message: 'Budget voting retrieved successfully',
    data: {
      trip_id: tripCode,

      // ✅ เพิ่ม budgets field
      budgets: [
        { category_name: 'ที่พัก', estimated_amount: 5000 },
        { category_name: 'เดินทาง', estimated_amount: 3000 },
        { category_name: 'อาหาร', estimated_amount: 2000 },
        { category_name: 'อื่นๆ', estimated_amount: 1000 }
      ],

      // ✅ budget_options พร้อม all_votes
      budget_options: [
        {
          category_name: 'ที่พัก',
          estimated_amount: 5000,
          all_votes: [
            { user_id: 'user-001', estimated_amount: 4000 },
            { user_id: 'user-002', estimated_amount: 5000 },
            { user_id: 'user-003', estimated_amount: 7000 },
            { user_id: 'user-004', estimated_amount: 50000 }
          ]
        },
        {
          category_name: 'เดินทาง',
          estimated_amount: 3000,
          all_votes: [
            { user_id: 'user-001', estimated_amount: 2500 },
            { user_id: 'user-002', estimated_amount: 3000 },
            { user_id: 'user-003', estimated_amount: 4000 },
            { user_id: 'user-004', estimated_amount: 3200 }
          ]
        },
        {
          category_name: 'อาหาร',
          estimated_amount: 2000,
          all_votes: [
            { user_id: 'user-001', estimated_amount: 1800 },
            { user_id: 'user-002', estimated_amount: 2000 },
            { user_id: 'user-003', estimated_amount: 3000 },
            { user_id: 'user-004', estimated_amount: 2300 }
          ]
        },
        {
          category_name: 'อื่นๆ',
          estimated_amount: 1000,
          all_votes: [
            { user_id: 'user-001', estimated_amount: 500 },
            { user_id: 'user-002', estimated_amount: 1000 },
            { user_id: 'user-003', estimated_amount: 2000 },
            { user_id: 'user-004', estimated_amount: 1200 }
          ]
        }
      ]
    }
  };
};

// ============================================================================
// STEP 3: LOCATION VOTING - ✅ ใหม่ทั้งหมด
// ============================================================================

/**
 * POST /api/votes/:tripId/location
 */
export const getMockSubmitLocationVote = (
  tripId: string,
  payload: SubmitLocationVotePayload
): ApiResponse => {
  console.log('📤 Mock: Submit Location Vote', { tripId, payload });

  // ✅ Validation 1: ต้องมี 3 อันดับ
  if (!payload.votes || payload.votes.length !== 3) {
    return {
      success: false,
      code: 'INVALID_VOTE',
      message: 'ต้องโหวตครบ 3 อันดับ'
    };
  }

  // ✅ Validation 2: ตรวจสอบ structure
  for (const vote of payload.votes) {
    if (!vote.place || typeof vote.score !== 'number') {
      return {
        success: false,
        code: 'INVALID_VOTE_STRUCTURE',
        message: 'แต่ละโหวตต้องมี place และ score'
      };
    }
  }

  // ✅ Validation 3: คะแนนต้องถูกต้อง (3, 2, 1)
  const scores = payload.votes.map(v => v.score).sort((a, b) => b - a);
  if (JSON.stringify(scores) !== JSON.stringify([3, 2, 1])) {
    return {
      success: false,
      code: 'INVALID_SCORES',
      message: 'คะแนนต้องเป็น 3, 2, 1 เท่านั้น'
    };
  }

  // ✅ Validation 4: ห้ามซ้ำ
  const locations = payload.votes.map(v => v.place);
  if (new Set(locations).size !== 3) {
    return {
      success: false,
      code: 'DUPLICATE_VOTE',
      message: 'ต้องเลือกจังหวัดที่แตกต่างกัน'
    };
  }

  // ✅ Success
  return {
    success: true,
    code: 'VOTE_SUBMITTED',
    message: 'Vote submitted successfully',
    data: {
      trip_id: tripId,
      votes: payload.votes,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * ✅ GET /api/votes/:tripId/location (Default - Clear Winner)
 */
export const getMockGetLocationVote = (
  tripId: string
): ApiResponse<GetLocationVoteResponse> => {
  return {
    success: true,
    code: 'OK',
    message: 'Location voting retrieved successfully',
    data: {
      trip_id: tripId,
      
      my_votes: [
        { place: 'เชียงใหม่', score: 3 },
        { place: 'ภูเก็ต', score: 2 },
        { place: 'กระบี่', score: 1 }
      ],
      
      voting_results: [
        {
          place: 'เชียงใหม่',
          total_score: 15,
          vote_count: 6,
          voters: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006'],
          rank_distribution: { rank_1: 3, rank_2: 3, rank_3: 0 }
        },
        {
          place: 'ภูเก็ต',
          total_score: 12,
          vote_count: 6,
          voters: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006'],
          rank_distribution: { rank_1: 1, rank_2: 4, rank_3: 1 }
        },
        {
          place: 'กระบี่',
          total_score: 8,
          vote_count: 6,
          voters: ['user-001', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007'],
          rank_distribution: { rank_1: 0, rank_2: 2, rank_3: 4 }
        },
        {
          place: 'พังงา',
          total_score: 6,
          vote_count: 4,
          voters: ['user-002', 'user-003', 'user-005', 'user-007'],
          rank_distribution: { rank_1: 0, rank_2: 2, rank_3: 2 }
        },
        {
          place: 'นครราชสีมา',
          total_score: 5,
          vote_count: 3,
          voters: ['user-002', 'user-004', 'user-006'],
          rank_distribution: { rank_1: 1, rank_2: 0, rank_3: 2 }
        }
      ]
    }
  };
};

/**
 * ✅ Regional Winner
 */
export const getMockGetLocationVote_RegionalWinner = (
  tripId: string
): ApiResponse<GetLocationVoteResponse> => {
  return {
    success: true,
    code: 'OK',
    message: 'Location voting with regional winner',
    data: {
      trip_id: tripId,
      
      my_votes: [
        { place: 'เชียงใหม่', score: 3 },
        { place: 'ลำปาง', score: 2 },
        { place: 'ภูเก็ต', score: 1 }
      ],
      
      voting_results: [
        {
          place: 'เชียงใหม่',
          total_score: 10,
          vote_count: 4,
          voters: ['user-001', 'user-002', 'user-003', 'user-004'],
          rank_distribution: { rank_1: 2, rank_2: 2, rank_3: 0 }
        },
        {
          place: 'ลำปาง',
          total_score: 10,
          vote_count: 4,
          voters: ['user-001', 'user-002', 'user-005', 'user-006'],
          rank_distribution: { rank_1: 2, rank_2: 2, rank_3: 0 }
        },
        {
          place: 'ภูเก็ต',
          total_score: 10,
          vote_count: 4,
          voters: ['user-003', 'user-004', 'user-005', 'user-006'],
          rank_distribution: { rank_1: 2, rank_2: 2, rank_3: 0 }
        },
        {
          place: 'กระบี่',
          total_score: 6,
          vote_count: 3,
          voters: ['user-001', 'user-004', 'user-006'],
          rank_distribution: { rank_1: 0, rank_2: 3, rank_3: 0 }
        },
        {
          place: 'กรุงเทพมหานคร',
          total_score: 5,
          vote_count: 3,
          voters: ['user-002', 'user-003', 'user-005'],
          rank_distribution: { rank_1: 1, rank_2: 0, rank_3: 2 }
        }
      ]
    }
  };
};

/**
 * ✅ Empty
 */
export const getMockGetLocationVote_Empty = (
  tripId: string
): ApiResponse<GetLocationVoteResponse> => {
  return {
    success: true,
    code: 'OK',
    message: 'No votes yet',
    data: {
      trip_id: tripId,
      my_votes: [],
      voting_results: []
    }
  };
};

/**
 * ✅ All Tied
 */
export const getMockGetLocationVote_AllTied = (
  tripId: string
): ApiResponse<GetLocationVoteResponse> => {
  return {
    success: true,
    code: 'OK',
    message: 'All provinces have equal scores',
    data: {
      trip_id: tripId,
      
      my_votes: [
        { place: 'เชียงใหม่', score: 3 },
        { place: 'ภูเก็ต', score: 2 },
        { place: 'กรุงเทพมหานคร', score: 1 }
      ],
      
      voting_results: [
        {
          place: 'เชียงใหม่',
          total_score: 10,
          vote_count: 4,
          voters: ['user-001', 'user-002', 'user-003', 'user-004'],
          rank_distribution: { rank_1: 3, rank_2: 0, rank_3: 1 }
        },
        {
          place: 'ลำปาง',
          total_score: 10,
          vote_count: 5,
          voters: ['user-001', 'user-002', 'user-005', 'user-006', 'user-007'],
          rank_distribution: { rank_1: 1, rank_2: 2, rank_3: 2 }
        },
        {
          place: 'ภูเก็ต',
          total_score: 10,
          vote_count: 5,
          voters: ['user-003', 'user-004', 'user-005', 'user-006', 'user-007'],
          rank_distribution: { rank_1: 1, rank_2: 1, rank_3: 3 }
        },
        {
          place: 'กระบี่',
          total_score: 10,
          vote_count: 4,
          voters: ['user-003', 'user-005', 'user-006', 'user-008'],
          rank_distribution: { rank_1: 0, rank_2: 5, rank_3: 0 }
        },
        {
          place: 'กรุงเทพมหานคร',
          total_score: 10,
          vote_count: 4,
          voters: ['user-002', 'user-004', 'user-006', 'user-008'],
          rank_distribution: { rank_1: 0, rank_2: 5, rank_3: 0 }
        }
      ]
    }
  };
};

/**
 * ✅ Single User
 */
export const getMockGetLocationVote_SingleUser = (
  tripId: string
): ApiResponse<GetLocationVoteResponse> => {
  return {
    success: true,
    code: 'OK',
    message: 'Single user voted',
    data: {
      trip_id: tripId,
      
      my_votes: [
        { place: 'เชียงใหม่', score: 3 },
        { place: 'ภูเก็ต', score: 2 },
        { place: 'กระบี่', score: 1 }
      ],
      
      voting_results: [
        {
          place: 'เชียงใหม่',
          total_score: 3,
          vote_count: 1,
          voters: ['user-001'],
          rank_distribution: { rank_1: 1, rank_2: 0, rank_3: 0 }
        },
        {
          place: 'ภูเก็ต',
          total_score: 2,
          vote_count: 1,
          voters: ['user-001'],
          rank_distribution: { rank_1: 0, rank_2: 1, rank_3: 0 }
        },
        {
          place: 'กระบี่',
          total_score: 1,
          vote_count: 1,
          voters: ['user-001'],
          rank_distribution: { rank_1: 0, rank_2: 0, rank_3: 1 }
        }
      ]
    }
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
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

  // Date Voting
  getMockSubmitAvailability,
  getMockTripHeatmap,
  getMockGetDateMatchingResult,
  getMockGetDateMatchingResult_Partial,
  getMockGetDateMatchingResult_NoMatch,
  getMockGetDateMatchingResult_Empty,
  getMockStartVoting,

  // Budget Voting
  getMockUpdateBudget,
  getMockGetBudgetVoting,

  // Location Voting
  getMockSubmitLocationVote,
  getMockGetLocationVote,
  getMockGetLocationVote_RegionalWinner,
  getMockGetLocationVote_Empty,
  getMockGetLocationVote_AllTied,
  getMockGetLocationVote_SingleUser,

  // Other
  getMockCloseTrip
};