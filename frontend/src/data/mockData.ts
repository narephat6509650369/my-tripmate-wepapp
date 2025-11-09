import { Trip, VoteCategory } from '../types';

export const mockTrips: Trip[] = [
  {
    id: 1,
    name: 'ทริปเชียงใหม่',
    description: 'เที่ยวเชียงใหม่ 3 วัน 2 คืน',
    status: 'planning',
    memberCount: 5,
    startDate: '2024-12-15',
    endDate: '2024-12-17',
    budget: '5,000-7,000 บาท',
    imageUrl: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?w=400',
  },
  {
    id: 2,
    name: 'ทริปภูเก็ต',
    description: 'พักผ่อนริมทะเล 4 วัน 3 คืน',
    status: 'confirmed',
    memberCount: 8,
    startDate: '2024-12-20',
    endDate: '2024-12-23',
    budget: '8,000-10,000 บาท',
    imageUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400',
  },
  {
    id: 3,
    name: 'ทริปกรุงเทพ',
    description: 'ช้อปปิ้งและชิมอาหาร 2 วัน 1 คืน',
    status: 'completed',
    memberCount: 4,
    startDate: '2024-11-01',
    endDate: '2024-11-02',
    budget: '3,000-4,000 บาท',
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
  },
];

export const mockVoteCategories: VoteCategory[] = [
  {
    id: 1,
    title: 'วันที่เดินทาง',
    options: [
      { id: 1, text: '15-17 ธ.ค. 2024', votes: ['สมชาย', 'สมหญิง', 'วิชัย'] },
      { id: 2, text: '22-24 ธ.ค. 2024', votes: ['ปรีชา', 'สุดา'] },
    ],
  },
  {
    id: 2,
    title: 'สถานที่ท่องเที่ยว',
    options: [
      { id: 3, text: 'ดอยสุเทพ', votes: ['สมชาย', 'สมหญิง', 'วิชัย', 'ปรีชา'] },
      { id: 4, text: 'ถนนคนเดิน', votes: ['สมชาย', 'วิชัย', 'สุดา'] },
      { id: 5, text: 'วัดพระธาตุดอยคำ', votes: ['สมหญิง', 'ปรีชา'] },
    ],
  },
  {
    id: 3,
    title: 'งบประมาณ',
    options: [
      { id: 6, text: '3,000-5,000 บาท', votes: ['สมชาย', 'วิชัย'] },
      { id: 7, text: '5,000-7,000 บาท', votes: ['สมหญิง', 'ปรีชา', 'สุดา'] },
    ],
  },
];