// ประเภทข้อมูลหลักที่ใช้ในแอปพลิเคชัน เช่น ข้อมูลผู้ใช้ ทริป สมาชิก การโหวต และการแจ้งเตือน
// สามารถเพิ่มประเภทข้อมูลอื่นๆ ได้ตามต้องการ เช่น ข้อมูลการตั้งค่า, ประวัติการเข้าร่วมทริป เป็นต้น

export interface User {
  id: number;
  email: string;
  name: string;
  password?: string;
  email_verified: boolean;
  avatar_url?: string;
}

export interface Trip {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget_min?: number;
  budget_max?: number;
  created_at: string;
  updated_at: string;
  members?: TripMember[];
  votes?: VoteCategory[];
  unread_count?: number;
}

export interface TripMember {
  id: number;
  trip_id: number;
  user_id: number;
  role: 'creator' | 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface VoteCategory {
  id: number;
  trip_id: number;
  category: 'dates' | 'places' | 'budget' | 'custom';
  title: string;
  description?: string;
  status: 'active' | 'closed';
  options?: VoteOption[];
}

export interface VoteOption {
  id: number;
  category_id: number;
  option_text: string;
  proposed_by: number;
  votes?: Vote[];
  vote_count?: number;
}

export interface Vote {
  id: number;
  option_id: number;
  user_id: number;
  voted_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  trip_id?: number;
  type: 'invite' | 'vote' | 'update' | 'reminder';
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
  