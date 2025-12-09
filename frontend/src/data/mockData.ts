// ============== MOCK MEMBERS ==============
const mockMembers = [
  {
    id: "1",
    name: "สมชาย",
    gender: "ชาย" as const,
    availability: [true, true, false, true, false, true, true, false],
    budget: {
      accommodation: 1500,
      transport: 800,
      food: 1200,
      other: 500,
      lastUpdated: Date.now() - 86400000 // 1 day ago
    }
  },
  {
    id: "2",
    name: "สมหญิง",
    gender: "หญิง" as const,
    availability: [false, true, true, false, true, true, false, true],
    budget: {
      accommodation: 2000,
      transport: 1000,
      food: 1500,
      other: 300,
      lastUpdated: Date.now() - 86400000
    }
  },
  {
    id: "3",
    name: "สมศรี",
    gender: "หญิง" as const,
    availability: [true, true, true, true, true, true, true, true],
    budget: {
      accommodation: 1800,
      transport: 900,
      food: 1300,
      other: 400,
      lastUpdated: Date.now() - 86400000
    }
  },
  {
    id: "4",
    name: "สมพงษ์",
    gender: "ชาย" as const,
    availability: [true, false, true, true, false, true, true, false],
    budget: {
      accommodation: 1600,
      transport: 850,
      food: 1100,
      other: 350,
      lastUpdated: Date.now() - 86400000
    }
  },
  {
    id: "5",
    name: "สมใจ",
    gender: "หญิง" as const,
    availability: [false, true, true, true, true, false, true, true],
    budget: {
      accommodation: 2200,
      transport: 1100,
      food: 1400,
      other: 450,
      lastUpdated: Date.now() - 86400000
    }
  }
];

// ============== MOCK TRIP DATA ==============
export const MOCK_TRIP_DATA = {
  success: true,
  data: {
    _id: "TEST-DEMO-1234-5678",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    name: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
    createdBy: "user123",
    createdAt: Date.now() - 7 * 86400000, // 7 days ago
    members: mockMembers,
    voteOptions: ["5/11/2568", "6/11/2568", "10/11/2568", "18/11/2568"],
    selectedDate: null,
    isCompleted: false,
    voteResults: {
      provinces: [
        { name: "ภูเก็ต", score: 12 },
        { name: "กระบี่", score: 9 },
        { name: "เชียงใหม่", score: 7 },
        { name: "สุราษฎร์ธานี", score: 5 },
        { name: "พังงา", score: 4 }
      ],
      dates: [
        { date: "5/11/2568", votes: 4 },
        { date: "6/11/2568", votes: 5 },
        { date: "10/11/2568", votes: 3 },
        { date: "18/11/2568", votes: 2 }
      ]
    }
  }
};

// ============== MOCK SUMMARY DATA ==============
export const MOCK_SUMMARY_DATA = {
  success: true,
  data: {
    _id: "TEST-DEMO-1234-5678",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    name: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
    members: mockMembers,
    closedAt: Date.now() - 86400000, // Closed 1 day ago
    voteResults: {
      provinces: [
        { name: "ภูเก็ต", score: 15 },
        { name: "กระบี่", score: 11 },
        { name: "เชียงใหม่", score: 8 },
        { name: "สุราษฎร์ธานี", score: 6 },
        { name: "พังงา", score: 4 },
        { name: "ตราด", score: 3 },
        { name: "จันทบุรี", score: 2 }
      ],
      dates: [
        { date: "5/11/2568", votes: 4 },
        { date: "6/11/2568", votes: 5 },
        { date: "10/11/2568", votes: 3 },
        { date: "18/11/2568", votes: 2 }
      ]
    }
  }
};

// ============== MOCK MY TRIPS ==============
export const MOCK_MY_TRIPS = {
  success: true,
  data: [
    {
      _id: "TRIP-001",
      tripCode: "A3K7-P9M2-X5Q8-R4W6",
      name: "ทริปทะเล ภูเก็ต",
      createdAt: Date.now() - 5 * 86400000,
      isCompleted: false,
      members: [
        { 
          id: "1", 
          name: "สมชาย", 
          budget: { accommodation: 1500, transport: 800, food: 1200, other: 500 } 
        },
        { 
          id: "2", 
          name: "สมหญิง", 
          budget: { accommodation: 2000, transport: 1000, food: 1500, other: 300 } 
        },
        { 
          id: "3", 
          name: "สมศรี", 
          budget: { accommodation: 1800, transport: 900, food: 1300, other: 400 } 
        }
      ],
      memberCount: 3
    },
    {
      _id: "TRIP-002",
      tripCode: "B5H9-L2N4-Y7T3-W8K1",
      name: "ทริปเหนือ เชียงใหม่",
      createdAt: Date.now() - 10 * 86400000,
      isCompleted: true,
      members: [
        { 
          id: "1", 
          name: "สมชาย", 
          budget: { accommodation: 1200, transport: 600, food: 1000, other: 400 } 
        },
        { 
          id: "4", 
          name: "สมพงษ์", 
          budget: { accommodation: 1600, transport: 850, food: 1100, other: 350 } 
        }
      ],
      memberCount: 2
    },
    {
      _id: "TRIP-003",
      tripCode: "C8M3-Q6P9-Z2R5-V4D7",
      name: "ทริปอีสาน อุบลราชธานี",
      createdAt: Date.now() - 15 * 86400000,
      isCompleted: false,
      members: [
        { 
          id: "1", 
          name: "สมชาย", 
          budget: { accommodation: 0, transport: 0, food: 0, other: 0 } 
        },
        { 
          id: "2", 
          name: "สมหญิง", 
          budget: { accommodation: 1000, transport: 500, food: 800, other: 200 } 
        },
        { 
          id: "5", 
          name: "สมใจ", 
          budget: { accommodation: 0, transport: 0, food: 0, other: 0 } 
        }
      ],
      memberCount: 3
    }
  ]
};

// ============== MOCK CREATE TRIP RESPONSE ==============
export const MOCK_CREATE_TRIP_RESPONSE = {
  success: true,
  data: {
    tripId: "NEW-TRIP-" + Date.now(),
    tripCode: "N7K4-M9P2-L5W8-Q3R6",
    name: "ทริปใหม่",
    message: "สร้างทริปสำเร็จ"
  }
};

// ============== MOCK INVITE CODE RESPONSE ==============
export const MOCK_INVITE_CODE_RESPONSE = {
  success: true,
  data: {
    inviteCode: "A3K7-P9M2-X5Q8-R4W6",
    inviteLink: "https://trip-planner.com/join/A3K7-P9M2-X5Q8-R4W6",
    expiresAt: Date.now() + 7 * 86400000 // 7 days from now
  }
};

// ============== MOCK JOIN TRIP RESPONSE ==============
export const MOCK_JOIN_TRIP_RESPONSE = {
  success: true,
  data: {
    tripId: "TEST-DEMO-1234-5678",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    tripName: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
    message: "เข้าร่วมทริปสำเร็จ"
  }
};

// ============== MOCK CLOSE TRIP RESPONSE ==============
export const MOCK_CLOSE_TRIP_RESPONSE = {
  success: true,
  data: {
    tripId: "TEST-DEMO-1234-5678",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    closedAt: Date.now(),
    isCompleted: true
  },
  message: "ปิดการโหวตสำเร็จ"
};

// ============== MOCK SUBMIT VOTES RESPONSE ==============
export const MOCK_SUBMIT_VOTES_RESPONSE = {
  success: true,
  data: {
    tripId: "TEST-DEMO-1234-5678",
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

// ============== MOCK UPDATE BUDGET RESPONSE ==============
export const MOCK_UPDATE_BUDGET_RESPONSE = {
  success: true,
  data: {
    memberId: "1",
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

// ============== MOCK UPDATE AVAILABILITY RESPONSE ==============
export const MOCK_UPDATE_AVAILABILITY_RESPONSE = {
  success: true,
  data: {
    memberId: "1",
    availability: [true, true, false, true, false, true, true, false],
    updatedAt: Date.now()
  },
  message: "อัพเดทความว่างสำเร็จ"
};

// ============== MOCK ERROR RESPONSES ==============
export const MOCK_ERROR_TRIP_NOT_FOUND = {
  success: false,
  message: "ไม่พบทริปที่ระบุ",
  error: "TRIP_NOT_FOUND"
};

export const MOCK_ERROR_INVALID_CODE = {
  success: false,
  message: "รหัสทริปไม่ถูกต้อง",
  error: "INVALID_CODE"
};

export const MOCK_ERROR_UNAUTHORIZED = {
  success: false,
  message: "ไม่มีสิทธิ์เข้าถึงทริปนี้",
  error: "UNAUTHORIZED"
};

export const MOCK_ERROR_TRIP_CLOSED = {
  success: false,
  message: "ทริปนี้ปิดการโหวตแล้ว",
  error: "TRIP_CLOSED"
};

// ============== TYPE DEFINITIONS ==============
export interface Member {
  id: string;
  name: string;
  gender: "ชาย" | "หญิง";
  availability: boolean[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    other: number;
    lastUpdated?: number;
  };
}

export interface TripData {
  _id: string;
  tripCode: string;
  name: string;
  createdBy?: string;
  createdAt?: number;
  members: Member[];
  voteOptions?: string[];
  selectedDate?: string | null;
  isCompleted: boolean;
  closedAt?: number;
  voteResults?: {
    provinces?: Array<{ name: string; score: number }>;
    dates?: Array<{ date: string; votes: number }>;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============== HELPER FUNCTIONS ==============
export const generateMockMember = (
  id: string,
  name: string,
  gender: "ชาย" | "หญิง"
): Member => ({
  id,
  name,
  gender,
  availability: Array(8).fill(false).map(() => Math.random() > 0.3),
  budget: {
    accommodation: Math.floor(Math.random() * 1000 + 1000),
    transport: Math.floor(Math.random() * 500 + 500),
    food: Math.floor(Math.random() * 800 + 800),
    other: Math.floor(Math.random() * 300 + 200),
    lastUpdated: Date.now()
  }
});

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

// ============== MOCK DELAY HELPER ==============
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ============== EXPORT ALL ==============
export default {
  MOCK_TRIP_DATA,
  MOCK_SUMMARY_DATA,
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
  generateMockMember,
  generateMockTripCode,
  mockDelay
};