const API_URL = 'http://localhost:3000/api'; // หรือ URL Backend ของคุณ

export const tripAPI = {
  // ✅ Functions เดิมที่มีอยู่แล้ว
  createTrip: async (tripData: { name: string; days: string; detail: string }) => {
    const response = await fetch(`${API_URL}/trips/AddTrip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(tripData)
    });
    return response.json();
  },

  getMyTrips: async () => {
    const response = await fetch(`${API_URL}/trips/my-trips`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.json();
  },

  deleteTrip: async (tripId: string) => {
    const response = await fetch(`${API_URL}/trips/DeleteTrip`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ tripId })
    });
    return response.json();
  },

  generateInviteCode: async (tripId: string) => {
    const response = await fetch(`${API_URL}/trips/${tripId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.json();
  },

  joinTrip: async (inviteCode: string) => {
    const response = await fetch(`${API_URL}/trips/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ inviteCode })
    });
    return response.json();
  },

  removeMember: async (tripId: string, memberId: string) => {
    const response = await fetch(`${API_URL}/trips/${tripId}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.json();
  },

  // ⬇️ เพิ่ม 3 functions นี้เพื่อแก้ error แดง
  
  // 1. ดึงรายละเอียดทริป (สำหรับ VotePage และ SummaryPage)
  getTripDetail: async (tripCode: string) => {
    const response = await fetch(`${API_URL}/trips/${tripCode}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.json();
  },

  // 2. ส่งผลโหวตจังหวัด (สำหรับ VotePage - StepPlace)
  submitProvinceVotes: async (tripCode: string, voteData: { votes: string[]; scores: any }) => {
    const response = await fetch(`${API_URL}/trips/${tripCode}/votes/province`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(voteData)
    });
    return response.json();
  },

  // 3. ปิดการโหวต (สำหรับ VotePage - StepSummary)
  closeTrip: async (tripCode: string) => {
    const response = await fetch(`${API_URL}/trips/${tripCode}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.json();
  }
};