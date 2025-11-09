export interface Trip {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'confirmed' | 'completed';
  memberCount: number;
  startDate?: string;
  endDate?: string;
  budget?: string;
  imageUrl?: string;
}

export interface VoteOption {
  id: number;
  text: string;
  votes: string[]; // รายชื่อคนโหวต
}

export interface VoteCategory {
  id: number;
  title: string;
  options: VoteOption[];
}