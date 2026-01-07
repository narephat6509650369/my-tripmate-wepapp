import { MyTripsResponse } from "../services/api";

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

// ============== MOCK MEMBERS ==============
const mockMembers: Member[] = [
  {
    id: "member-001",
    name: "สมชาย",
    gender: "ชาย",
    availability: [true, true, false, true, false, true, true, false],
    budget: {
      accommodation: 1500,
      transport: 800,
      food: 1200,
      other: 500,
      lastUpdated: Date.now() - 86400000
    }
  },
  {
    id: "member-002",
    name: "สมหญิง",
    gender: "หญิง",
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
    id: "member-003",
    name: "สมศรี",
    gender: "หญิง",
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
    id: "member-004",
    name: "สมพงษ์",
    gender: "ชาย",
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
    id: "member-005",
    name: "สมใจ",
    gender: "หญิง",
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

// ============== MOCK TRIP DATA (สำหรับ VotePage) ==============
export const MOCK_TRIP_DATA: ApiResponse<TripData> = {
  success: true,
  data: {
    _id: "trip-test-001",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    inviteCode: "A3K7-P9M2-X5Q8-R4W6",
    name: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
    days: 3,
    detail: "ทริปทดสอบระบบ เที่ยวทะเลภาคใต้",
    createdBy: "user123",
    createdAt: Date.now() - 7 * 86400000,
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

// ============== MOCK SUMMARY DATA (สำหรับ SummaryPage) ==============
export const MOCK_SUMMARY_DATA: ApiResponse<TripData> = {
  success: true,
  data: {
    _id: "trip-test-001",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    inviteCode: "A3K7-P9M2-X5Q8-R4W6",
    name: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน",
    days: 3,
    detail: "ทริปทดสอบระบบ เที่ยวทะเลภาคใต้",
    createdBy: "user123",
    createdAt: Date.now() - 7 * 86400000,
    members: mockMembers,
    voteOptions: ["5/11/2568", "6/11/2568", "10/11/2568", "18/11/2568"],
    selectedDate: "6/11/2568",
    isCompleted: true,
    closedAt: Date.now() - 86400000,
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

// ============== HELPER FUNCTIONS ==============

/**
 * สร้างรหัสทริปแบบสุ่ม (XXXX-XXXX-XXXX-XXXX)
 */
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

/**
 * สร้าง Mock Member แบบสุ่ม
 */
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

/**
 * จำลอง Delay ของ API Call
 */
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ============== MOCK MY TRIPS (สำหรับ HomePage) ==============
/*
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
          availability: [true, true, false, true, false, true, true, false],
          budget: { 
            accommodation: 1500, 
            transport: 800, 
            food: 1200, 
            other: 500,
            lastUpdated: Date.now()
          }
        },
        {
          id: "member-002",
          name: "สมหญิง",
          gender: "หญิง",
          availability: [false, true, true, false, true, true, false, true],
          budget: { 
            accommodation: 2000, 
            transport: 1000, 
            food: 1500, 
            other: 300,
            lastUpdated: Date.now()
          }
        },
        {
          id: "member-003",
          name: "สมศรี",
          gender: "หญิง",
          availability: [true, true, true, true, true, true, true, true],
          budget: { 
            accommodation: 1800, 
            transport: 900, 
            food: 1300, 
            other: 400,
            lastUpdated: Date.now()
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
          availability: [true, true, true, true, true, true, true, true],
          budget: { 
            accommodation: 1200, 
            transport: 600, 
            food: 1000, 
            other: 400,
            lastUpdated: Date.now()
          }
        },
        {
          id: "member-004",
          name: "สมพงษ์",
          gender: "ชาย",
          availability: [true, false, true, true, false, true, true, false],
          budget: { 
            accommodation: 1600, 
            transport: 850, 
            food: 1100, 
            other: 350,
            lastUpdated: Date.now()
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
          availability: [false, true, true, false, true, true, false, true],
          budget: { 
            accommodation: 1000, 
            transport: 500, 
            food: 800, 
            other: 200,
            lastUpdated: Date.now()
          }
        },
        {
          id: "member-005",
          name: "สมใจ",
          gender: "หญิง",
          availability: [false, true, true, true, true, false, true, true],
          budget: { 
            accommodation: 0, 
            transport: 0, 
            food: 0, 
            other: 0,
            lastUpdated: 0
          }
        }
      ]
    }
  ]
};
*/
export const MOCK_MY_TRIPS: MyTripsResponse = {
  success: true,
  data: {
    all: [
      {
        trip_id: "trip-001",
        trip_name: "ทริปทะเล ภูเก็ต",
        status: "active",
        role: "owner",
        num_members: 3
      },
      {
        trip_id: "trip-002",
        trip_name: "ทริปเหนือ เชียงใหม่",
        status: "completed",
        role: "member",
        num_members: 2
      }
    ],
    owned: [
      {
        trip_id: "trip-001",
        trip_name: "ทริปทะเล ภูเก็ต",
        status: "active",
        role: "owner",
        num_members: 3
      }
    ],
    joined: [
      {
        trip_id: "trip-002",
        trip_name: "ทริปเหนือ เชียงใหม่",
        status: "completed",
        role: "member",
        num_members: 2
      }
    ]
  }
};

// ============== MOCK CREATE TRIP RESPONSE ==============
export const MOCK_CREATE_TRIP_RESPONSE: ApiResponse = {
  success: true,
  data: {
    _id: "trip-new-" + Date.now(),
    id: "trip-new-" + Date.now(),
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

// ============== MOCK INVITE CODE RESPONSE ==============
export const MOCK_INVITE_CODE_RESPONSE: ApiResponse = {
  success: true,
  data: {
    inviteCode: generateMockTripCode(),
    inviteLink: `https://trip-planner.com/join/${generateMockTripCode()}`,
    expiresAt: Date.now() + 7 * 86400000
  },
  message: "สร้างรหัสเชิญสำเร็จ"
};

// ============== MOCK JOIN TRIP RESPONSE ==============
export const MOCK_JOIN_TRIP_RESPONSE: ApiResponse = {
  success: true,
  data: {
    tripId: "trip-test-001",
    tripCode: "A3K7-P9M2-X5Q8-R4W6",
    tripName: "ทริปทดสอบ - เที่ยวทะเล 3 วัน 2 คืน"
  },
  message: "เข้าร่วมทริปสำเร็จ"
};

// ============== MOCK CLOSE TRIP RESPONSE ==============
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

// ============== MOCK SUBMIT VOTES RESPONSE ==============
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

// ============== MOCK UPDATE BUDGET RESPONSE ==============
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

// ============== MOCK UPDATE AVAILABILITY RESPONSE ==============
export const MOCK_UPDATE_AVAILABILITY_RESPONSE: ApiResponse = {
  success: true,
  data: {
    memberId: "member-001",
    availability: [true, true, false, true, false, true, true, false],
    updatedAt: Date.now()
  },
  message: "อัพเดทความว่างสำเร็จ"
};

// ============== MOCK ERROR RESPONSES ==============
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



/**
 * จำลองการ Fetch Trip Detail
 */
export const getMockTripDetail = async (tripId: string): Promise<ApiResponse<TripData>> => {
  await mockDelay(300);
  
  if (tripId === "trip-test-001" || tripId === "TEST-DEMO-1234-5678") {
    return MOCK_TRIP_DATA;
  }
  
  return MOCK_ERROR_TRIP_NOT_FOUND;
};

/**
 * จำลองการ Update Budget
 */
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




// ============== DEFAULT EXPORT ==============
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
  mockDelay,
  getMockTripDetail,
  mockUpdateBudget
};