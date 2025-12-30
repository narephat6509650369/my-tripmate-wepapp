// ============== TYPE DEFINITIONS ==============

export type MemberRole = 'owner' | 'member';
export type BudgetPriority = 1 | 2 | 3;

export interface DateRange {
  id: string;
  memberId: string;
  memberName: string;
  startDate: string;
  endDate: string;
  createdAt: number;
}

export interface MemberAvailability {
  memberId: string;
  memberName: string;
  availableDates: string[]; // ["2025-01-15", "2025-01-16", ...]
  timestamp: number;
}

export interface ProvinceVote {
  memberId: string;
  memberName: string;
  votes: [string, string, string];
  timestamp: number;
}

export interface Member {
  id: string;
  name: string;
  gender?: string;
  email?: string;
  role: 'owner' | 'member';
  availability?: boolean[]; 
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
    lastUpdated?: number;
  };
  budgetPriorities?: {
    accommodation: BudgetPriority;
    transport: BudgetPriority;
    food: BudgetPriority;
  };

  followMajority?: {
    dates: boolean;
    budget: boolean;
    province: boolean;
  };
}

export interface TripData {
  _id: string;
  tripCode: string;
  inviteCode?: string;
  name: string;
  days: number;
  detail: string;
  createdBy: string;
  createdAt: number;
  members: Member[];
  voteOptions: string[];
  selectedDate: string | null;
  isCompleted: boolean;
  closedAt?: number;
  dateRanges?: DateRange[];
  provinceVotes?: ProvinceVote[];
  dateVotes?: DateVote[];
  memberAvailability?: MemberAvailability[];
  voteResults?: {
    provinces: Array<{ name: string; score: number }>;
    dates: Array<{ date: string; votes: number }>;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DateVote {
  memberId: string;
  memberName: string;
  votes: Record<string, boolean>;
  timestamp: number;
}

// ============== MOCK MEMBERS ==============
const mockMembers: Member[] = [
  {
    id: "member-001",
    name: "สมชาย",
    gender: "ชาย",
    email: "somchai@example.com",
    role: "owner",
    availability: [true, true, false, true, false, true, true, false],
    budget: {
      accommodation: 1500,
      transport: 800,
      food: 1200,
      other: 500,
      lastUpdated: Date.now() - 86400000
    },
    budgetPriorities: {
      accommodation: 1,
      transport: 2,
      food: 3
    },
    followMajority: {
      dates: false,
      budget: false,
      province: false
    }
  },
  {
    id: "member-002",
    name: "สมหญิง",
    email: "somying@example.com", 
    gender: "หญิง",
    role: "member",
    availability: [false, true, true, false, true, true, false, true],
    budget: {
      accommodation: 2000,
      transport: 1000,
      food: 1500,
      other: 300,
      lastUpdated: Date.now() - 86400000
    },
    budgetPriorities: {
      accommodation: 2,
      transport: 1,
      food: 2
    },
    followMajority: {
      dates: false,
      budget: false,
      province: false
    }
  },
  {
    id: "member-003",
    name: "สมศรี",
    email: "somsri@example.com",
    gender: "หญิง",
    role: "member",
    availability: [true, true, true, true, true, true, true, true],
    budget: {
      accommodation: 1800,
      transport: 900,
      food: 1300,
      other: 400,
      lastUpdated: Date.now() - 86400000
    },
    budgetPriorities: {
      accommodation: 2,
      transport: 2,
      food: 1
    },
    followMajority: {
      dates: false,
      budget: false,
      province: false
    }
  },
  {
    id: "member-004",
    name: "สมพงษ์",
    gender: "ชาย",
    email: "sompong@example.com",
    role: "member",
    availability: [true, false, true, true, false, true, true, false],
    budget: {
      accommodation: 1600,
      transport: 850,
      food: 1100,
      other: 350,
      lastUpdated: Date.now() - 86400000
    },
    budgetPriorities: {
      accommodation: 3,
      transport: 1,
      food: 2
    },
    followMajority: {
      dates: false,
      budget: false,
      province: false
    }
  },
  {
    id: "member-005",
    name: "สมใจ",
    email: "somjai@example.com",
    gender: "หญิง",
    role: "member",
    availability: [false, true, true, true, true, false, true, true],
    budget: {
      accommodation: 2200,
      transport: 1100,
      food: 1400,
      other: 450,
      lastUpdated: Date.now() - 86400000
    },
    budgetPriorities: {
      accommodation: 1,
      transport: 3,
      food: 2
    },
    followMajority: {
      dates: false,
      budget: false,
      province: false
    }
  }
];

export const MOCK_MEMBER_AVAILABILITY: MemberAvailability[] = [
  {
    memberId: "member-001",
    memberName: "สมชาย",
    availableDates: [
      "2024-11-05", "2024-11-06", "2024-11-07", "2024-11-08",
      "2024-11-15", "2024-11-16", "2024-11-22", "2024-11-23"
    ],
    timestamp: Date.now() - 86400000
  },
  {
    memberId: "member-002",
    memberName: "สมหญิง",
    availableDates: [
      "2024-11-06", "2024-11-07", "2024-11-08", "2024-11-09",
      "2024-11-10", "2024-11-16", "2024-11-17"
    ],
    timestamp: Date.now() - 7200000
  },
  {
    memberId: "member-003",
    memberName: "สมศรี",
    availableDates: [
      "2024-11-01", "2024-11-02", "2024-11-05", "2024-11-06",
      "2024-11-07", "2024-11-08", "2024-11-12", "2024-11-15",
      "2024-11-16", "2024-11-20", "2024-11-22"
    ],
    timestamp: Date.now() - 3600000
  }
];

// ============== MOCK DATE RANGES ==============
export const MOCK_DATE_RANGES: DateRange[] = [
  {
    id: "range-001",
    memberId: "member-001",
    memberName: "สมชาย",
    startDate: "2024-11-05",
    endDate: "2024-11-08",
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: "range-002",
    memberId: "member-002",
    memberName: "สมหญิง",
    startDate: "2024-11-06",
    endDate: "2024-11-10",
    createdAt: Date.now() - 86400000
  },
  {
    id: "range-003",
    memberId: "member-003",
    memberName: "สมศรี",
    startDate: "2024-11-01",
    endDate: "2024-11-18",
    createdAt: Date.now() - 3 * 86400000
  }
];

// ============== MOCK PROVINCE VOTES ==============
export const MOCK_PROVINCE_VOTES: ProvinceVote[] = [
  {
    memberId: "member-001",
    memberName: "สมชาย",
    votes: ["ภูเก็ต", "กระบี่", "เชียงใหม่"],
    timestamp: Date.now() - 86400000
  },
  {
    memberId: "member-002",
    memberName: "สมหญิง",
    votes: ["กระบี่", "ภูเก็ต", "พังงา"],
    timestamp: Date.now() - 7200000
  }
];

export const MOCK_DATE_VOTES: DateVote[] = [
  {
    memberId: "member-001",
    memberName: "สมชาย",
    votes: {
      "range-001": true,
      "range-002": false,
      "range-003": true
    },
    timestamp: Date.now() - 86400000
  },
  {
    memberId: "member-002",
    memberName: "สมหญิง",
    votes: {
      "range-001": false,
      "range-002": true,
      "range-003": true
    },
    timestamp: Date.now() - 7200000
  }
];

// ============== MOCK TRIP DATA ==============
export const getMockTripData = (): ApiResponse<TripData> => {
  const { userId, userEmail } = validateAuth();
  
  if (!userId || !userEmail) {
    throw new Error('User not authenticated - missing userId or userEmail in localStorage');
  }
  
  return {
    success: true,
    data: {
      _id: "trip001",
      tripCode: "TEST-1234-5678-9012",
      inviteCode: "TEST-1234-5678-9012",
      name: "ทริปทดสอบ",
      days: 3,
      detail: "ทริปทดสอบระบบ",
      createdBy: userId, 
      createdAt: Date.now(),
      isCompleted: false,
      members: [
        {
          id: userId,
          name: "You",
          email: userEmail,
          gender: "หญิง",
          role: "owner",
          availability: [],
          budget: {
            accommodation: 0,
            transport: 0,
            food: 0,
            other: 0,
            lastUpdated: 0
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        },
        {
          id: "member-002",
          name: "สมหญิง",
          email: "somying@example.com",
          gender: "หญิง",
          role: "member",
          availability: [],
          budget: {
            accommodation: 2000,
            transport: 1000,
            food: 1500,
            other: 300,
            lastUpdated: Date.now()
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        }
      ],
      voteOptions: [],
      selectedDate: null,
      voteResults: { provinces: [], dates: [] },
      dateRanges: [],
      dateVotes: [],
      provinceVotes: [],
      memberAvailability: []
    }
  };
};

// ============== AUTH VALIDATION ==============
const validateAuth = (): { userId: string; userEmail: string } => {
  let userId = localStorage.getItem('userId');
  let userEmail = localStorage.getItem('userEmail');
  
  // ✅ ถ้าไม่มี userId ให้ตั้งค่า mock แทนที่จะ throw error
  if (!userId || !userEmail) {
    console.warn('⚠️ No userId/userEmail in localStorage, setting up mock user...');
    
    // ตั้งค่า mock user
    userId = 'user123';
    userEmail = 'user@example.com';
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', 'Test User');
    localStorage.setItem('jwtToken', 'mock-jwt-token-' + Date.now());
    
    console.log('✅ Mock user created:', { userId, userEmail });
  }
  
  return { userId, userEmail };
};

// ✅ Export ทั้ง 2 แบบ
export const MOCK_TRIP_DATA = getMockTripData();
// ✅ ฟังก์ชันสำหรับ Summary Page
export const getMockSummaryData = (): ApiResponse<TripData> => {
  const { userId, userEmail } = validateAuth();
  
  if (!userId || !userEmail) {
    throw new Error('User not authenticated - missing userId or userEmail in localStorage');
  }

  return {
    success: true,
    data: {
      _id: "trip-test-001",
      tripCode: "A3K7-P9M2-X5Q8-R4W6",
      inviteCode: "A3K7-P9M2-X5Q8-R4W6",
      name: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
      days: 3,
      detail: "ทริปทดสอบระบบ เที่ยวทะเลภาคใต้",
      createdBy: userId,
      createdAt: Date.now() - 7 * 86400000,
      members: mockMembers, // ใช้ mockMembers ที่มีอยู่แล้ว
      voteOptions: ["5/11/2568", "6/11/2568", "10/11/2568", "18/11/2568"],
      selectedDate: "6/11/2568",
      isCompleted: true,
      closedAt: Date.now() - 86400000,
      dateRanges: MOCK_DATE_RANGES,
      provinceVotes: MOCK_PROVINCE_VOTES,
      memberAvailability: MOCK_MEMBER_AVAILABILITY,
      voteResults: {
        provinces: [
          { name: "ภูเก็ต", score: 15 },
          { name: "กระบี่", score: 11 },
          { name: "เชียงใหม่", score: 8 }
        ],
        dates: [
          { date: "5/11/2568", votes: 4 },
          { date: "6/11/2568", votes: 5 }
        ]
      }
    }
  };
};

// ✅ Export constant ด้วย (สำหรับ backward compatibility)
export const MOCK_SUMMARY_DATA = getMockSummaryData();

// ============== HELPER FUNCTIONS ==============

export const generateMockTripCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segmentLength = 4;
  
  return Array(segments)
    .fill(0)
    .map(() =>
      Array(segmentLength)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join('')
    )
    .join('-');
};

// ✅ แก้ไข: เพิ่ม role และ budgetPriorities
export const generateMockMember = (
  id: string,
  name: string,
  gender: "ชาย" | "หญิง",
  role: MemberRole = "member"
): Member => ({
  id,
  name,
  gender,
  role,
  availability: Array(8).fill(false).map(() => Math.random() > 0.3),
  budget: {
    accommodation: Math.floor(Math.random() * 1000 + 1000),
    transport: Math.floor(Math.random() * 500 + 500),
    food: Math.floor(Math.random() * 800 + 800),
    other: Math.floor(Math.random() * 300 + 200),
    lastUpdated: Date.now()
  },
  budgetPriorities: {
    accommodation: [1, 2, 3][Math.floor(Math.random() * 3)] as BudgetPriority,
    transport: [1, 2, 3][Math.floor(Math.random() * 3)] as BudgetPriority,
    food: [1, 2, 3][Math.floor(Math.random() * 3)] as BudgetPriority
  },followMajority: {
    dates: false,
    budget: false,
    province: false
  }
});

export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ============== MOCK MY TRIPS ==============
export const MOCK_MY_TRIPS: ApiResponse<TripData[]> = {
  success: true,
  data: [
    {
      _id: "trip-001",
      tripCode: "A3K7-P9M2-X5Q8-R4W6",
      name: "ทริปทะเล ภูเก็ต",
      days: 3,
      detail: "เที่ยวภูเก็ต 3 วัน 2 คืน",
      createdBy: "user123",
      createdAt: Date.now() - 5 * 86400000,
      isCompleted: false,
      selectedDate: null,
      voteOptions: ["5/11/2568", "6/11/2568"],
      members: [
        {
          id: "member-001",
          name: "สมชาย",
          gender: "ชาย",
          role: "owner",
          availability: [true, true, false, true, false, true, true, false],
          budget: {
            accommodation: 0,
            transport: 0,
            food: 0,
            other: 0,
            lastUpdated: 0
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        },
        {
          id: "member-002",
          name: "สมหญิง",
          gender: "หญิง",
          role: "member",
          availability: [false, true, true, false, true, true, false, true],
          budget: {
            accommodation: 2000,
            transport: 1000,
            food: 1500,
            other: 300,
            lastUpdated: Date.now()
          },
          budgetPriorities: {
            accommodation: 2,
            transport: 1,
            food: 2
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        },
        {
          id: "member-003",
          name: "สมศรี",
          gender: "หญิง",
          role: "member",
          availability: [true, true, true, true, true, true, true, true],
          budget: {
            accommodation: 1800,
            transport: 900,
            food: 1300,
            other: 400,
            lastUpdated: Date.now()
          },
          budgetPriorities: {
            accommodation: 2,
            transport: 2,
            food: 1
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        }
      ]
    },
    {
      _id: "trip-002",
      tripCode: "B5H9-L2N4-Y7T3-W8K1",
      name: "ทริปเหนือ เชียงใหม่",
      days: 4,
      detail: "เที่ยวเชียงใหม่ 4 วัน 3 คืน",
      createdBy: "user123",
      createdAt: Date.now() - 10 * 86400000,
      isCompleted: true,
      selectedDate: "15/10/2568",
      voteOptions: ["15/10/2568", "16/10/2568"],
      members: [
        {
          id: "member-001",
          name: "สมชาย",
          gender: "ชาย",
          role: "owner",
          availability: [true, true, true, true, true, true, true, true],
          budget: {
            accommodation: 1200,
            transport: 600,
            food: 1000,
            other: 400,
            lastUpdated: Date.now()
          },
          budgetPriorities: {
            accommodation: 1,
            transport: 2,
            food: 3
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        },
        {
          id: "member-004",
          name: "สมพงษ์",
          gender: "ชาย",
          role: "member",
          availability: [true, false, true, true, false, true, true, false],
          budget: {
            accommodation: 1600,
            transport: 850,
            food: 1100,
            other: 350,
            lastUpdated: Date.now()
          },
          budgetPriorities: {
            accommodation: 2,
            transport: 1,
            food: 2
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        }
      ],
      closedAt: Date.now() - 3 * 86400000
    },
    {
      _id: "trip-003",
      tripCode: "C8M3-Q6P9-Z2R5-V4D7",
      name: "ทริปอีสาน อุบลราชธานี",
      days: 5,
      detail: "เที่ยวอีสาน 5 วัน 4 คืน",
      createdBy: "user456",
      createdAt: Date.now() - 15 * 86400000,
      isCompleted: false,
      selectedDate: null,
      voteOptions: ["20/11/2568", "21/11/2568", "22/11/2568"],
      members: [
        {
          id: "member-001",
          name: "สมชาย",
          gender: "ชาย",
          role: "owner",
          availability: [true, true, false, true, false, true, true, false],
          budget: {
            accommodation: 0,
            transport: 0,
            food: 0,
            other: 0,
            lastUpdated: 0
          }
        },
        {
          id: "member-002",
          name: "สมหญิง",
          gender: "หญิง",
          role: "member",
          availability: [false, true, true, false, true, true, false, true],
          budget: {
            accommodation: 1000,
            transport: 500,
            food: 800,
            other: 200,
            lastUpdated: Date.now()
          },
          budgetPriorities: {
            accommodation: 2,
            transport: 1,
            food: 2
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        },
        {
          id: "member-005",
          name: "สมใจ",
          gender: "หญิง",
          role: "member",
          availability: [false, true, true, true, true, false, true, true],
          budget: {
            accommodation: 0,
            transport: 0,
            food: 0,
            other: 0,
            lastUpdated: 0
          },
          followMajority: {
            dates: false,
            budget: false,
            province: false
          }
        }
      ]
    }
  ]
};

// ============== MOCK API RESPONSES ==============
export const MOCK_CREATE_TRIP_RESPONSE: ApiResponse = {
  success: true,
  data: {
    _id: "trip-new-" + Date.now(),
    tripCode: generateMockTripCode(),
    name: "ทริปใหม่",
    days: 3,
    detail: "",
    createdBy: "user123",
    createdAt: Date.now(),
    members: [],
    voteOptions: [],
    selectedDate: null,
    isCompleted: false
  },
  message: "สร้างทริปสำเร็จ"
};

export const MOCK_INVITE_CODE_RESPONSE: ApiResponse = {
  success: true,
  data: {
    inviteCode: generateMockTripCode(),
    inviteLink: `https://trip-planner.com/join/${generateMockTripCode()}`,
    expiresAt: Date.now() + 7 * 86400000
  },
  message: "สร้างรหัสเชิญสำเร็จ"
};

export const MOCK_JOIN_TRIP_RESPONSE: ApiResponse = {
  success: true,
  data: {
    tripId: "trip-test-001",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    tripName: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน"
  },
  message: "เข้าร่วมทริปสำเร็จ"
};

export const MOCK_CLOSE_TRIP_RESPONSE: ApiResponse = {
  success: true,
  data: {
    tripId: "trip-test-001",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    closedAt: Date.now(),
    isCompleted: true
  },
  message: "ปิดการโหวตสำเร็จ"
};

export const MOCK_SUBMIT_VOTES_RESPONSE: ApiResponse = {
  success: true,
  data: {
    tripId: "trip-test-001",
    votes: ["ภูเก็ต", "กระบี่", "เชียงใหม่"],
    scores: {
      "ภูเก็ต": 3,
      "กระบี่": 2,
      "เชียงใหม่": 1
    },
    timestamp: Date.now()
  },
  message: "บันทึกผลโหวตสำเร็จ"
};

export const MOCK_UPDATE_BUDGET_RESPONSE: ApiResponse = {
  success: true,
  data: {
    memberId: "member-001",
    budget: {
      accommodation: 1500,
      transport: 800,
      food: 1200,
      other: 500,
      lastUpdated: Date.now()
    }
  },
  message: "อัพเดทงบประมาณสำเร็จ"
};

export const MOCK_UPDATE_AVAILABILITY_RESPONSE: ApiResponse = {
  success: true,
  data: {
    memberId: "member-001",
    availability: [true, true, false, true, false, true, true, false],
    updatedAt: Date.now()
  },
  message: "อัพเดทความว่างสำเร็จ"
};

// ============== ERROR RESPONSES ==============
export const MOCK_ERROR_TRIP_NOT_FOUND: ApiResponse = {
  success: false,
  message: "ไม่พบทริปที่ระบุ",
  error: "TRIP_NOT_FOUND"
};

export const MOCK_ERROR_INVALID_CODE: ApiResponse = {
  success: false,
  message: "รหัสทริปไม่ถูกต้อง",
  error: "INVALID_CODE"
};

export const MOCK_ERROR_UNAUTHORIZED: ApiResponse = {
  success: false,
  message: "ไม่มีสิทธิ์เข้าถึงทริปนี้",
  error: "UNAUTHORIZED"
};

export const MOCK_ERROR_TRIP_CLOSED: ApiResponse = {
  success: false,
  message: "ทริปนี้ปิดการโหวตแล้ว",
  error: "TRIP_CLOSED"
};

// ============== MOCK API FUNCTIONS ==============

export const getMockTripDetail = async (tripId: string): Promise<ApiResponse<TripData>> => {
  await mockDelay(300);
  
  if (tripId === "trip-test-001" || tripId === "A3K7-P9M2-X5Q8-R4W6") {
    return MOCK_TRIP_DATA;
  }
  
  return MOCK_ERROR_TRIP_NOT_FOUND;
};

export const mockUpdateBudget = async (
  tripId: string,
  memberId: string,
  budget: Partial<Member['budget']>
): Promise<ApiResponse> => {
  await mockDelay(200);
  
  return {
    success: true,
    data: {
      memberId,
      budget: {
        ...budget,
        lastUpdated: Date.now()
      }
    },
    message: "อัพเดทงบประมาณสำเร็จ"
  };
};

// 🆕 Mock: Add Date Range
export const mockAddDateRange = async (
  tripId: string,
  dateRange: DateRange
): Promise<ApiResponse> => {
  await mockDelay(300);
  
  return {
    success: true,
    data: dateRange,
    message: "เพิ่มช่วงวันที่สำเร็จ"
  };
};

// 🆕 Mock: Remove Date Range
export const mockRemoveDateRange = async (
  tripId: string,
  rangeId: string
): Promise<ApiResponse> => {
  await mockDelay(300);
  
  return {
    success: true,
    data: { rangeId },
    message: "ลบช่วงวันที่สำเร็จ"
  };
};

// 🆕 Mock: Update Budget Priority
export const mockUpdateBudgetPriority = async (
  tripId: string,
  memberId: string,
  priorities: Member['budgetPriorities']
): Promise<ApiResponse> => {
  await mockDelay(200);
  
  return {
    success: true,
    data: {
      memberId,
      priorities
    },
    message: "อัพเดท Priority สำเร็จ"
  };
};

// 🆕 Mock: Delete Member
export const mockDeleteMember = async (
  tripId: string,
  memberId: string
): Promise<ApiResponse> => {
  await mockDelay(300);
  
  return {
    success: true,
    data: { memberId },
    message: "ลบสมาชิกสำเร็จ"
  };
};

// 🆕 Mock: Delete Trip
export const mockDeleteTrip = async (
  tripId: string
): Promise<ApiResponse> => {
  await mockDelay(500);
  
  return {
    success: true,
    data: { tripId },
    message: "ลบทริปสำเร็จ"
  };
};

// 🆕 Mock: Update Member Availability
export const mockUpdateMemberAvailability = async (
  tripId: string,
  data: {
    memberId: string;
    availableDates: string[];
  }
): Promise<ApiResponse> => {
  await mockDelay(300);
  
  return {
    success: true,
    data: {
      memberId: data.memberId,
      availableDates: data.availableDates,
      timestamp: Date.now()
    },
    message: "บันทึกวันที่ว่างสำเร็จ"
  };
};

// ============== DEFAULT EXPORT ==============
export default {
  MOCK_TRIP_DATA,
  // MOCK_SUMMARY_DATA,
  MOCK_MY_TRIPS,
  MOCK_CREATE_TRIP_RESPONSE,
  MOCK_INVITE_CODE_RESPONSE,
  MOCK_JOIN_TRIP_RESPONSE,
  MOCK_CLOSE_TRIP_RESPONSE,
  MOCK_SUBMIT_VOTES_RESPONSE,
  MOCK_UPDATE_BUDGET_RESPONSE,
  MOCK_UPDATE_AVAILABILITY_RESPONSE,
  MOCK_ERROR_TRIP_NOT_FOUND,
  MOCK_ERROR_INVALID_CODE,
  MOCK_ERROR_UNAUTHORIZED,
  MOCK_ERROR_TRIP_CLOSED,
  MOCK_DATE_RANGES,
  MOCK_PROVINCE_VOTES,
  MOCK_MEMBER_AVAILABILITY,
  generateMockMember,
  generateMockTripCode,
  mockDelay,
  getMockTripDetail,
  mockUpdateBudget,
  mockAddDateRange,
  mockRemoveDateRange,
  mockUpdateBudgetPriority,
  mockDeleteMember,
  mockDeleteTrip,
  mockUpdateMemberAvailability
};