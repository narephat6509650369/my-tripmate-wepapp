import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG } from '../../../config/app.config';
import { TripData, Member } from '../../../data/mockData';

// ============== TYPES ==============
interface OwnerControlsProps {
  trip: TripData;
  setTrip: React.Dispatch<React.SetStateAction<TripData>>;
  memberBudget: Member | null;
  tripCode: string;
}

// ============== COMPONENT ==============
export const OwnerControls: React.FC<OwnerControlsProps> = ({
  trip,
  setTrip,
  memberBudget,
  tripCode
}) => {
  const navigate = useNavigate();
  const [showMemberList, setShowMemberList] = useState(false);
  
  // ตรวจสอบว่าเป็น owner หรือไม่
  const isOwner = memberBudget?.role === 'owner';

  // ถ้าไม่ใช่ owner ไม่แสดงอะไร
  if (!isOwner) return null;

  // ============== HANDLERS ==============
  
  /**
   * ลบทริปทั้งหมด
   */
  const handleDeleteTrip = async () => {
    if (!confirm(
      "⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้?\n\n" +
      "การลบจะไม่สามารถกู้คืนได้"
    )) {
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        console.log('🎭 Mock: Deleting trip');
        await new Promise(r => setTimeout(r, 500));
      } else {
        await tripAPI.deleteTrip(tripCode);
      }

      alert("✓ ลบทริปเรียบร้อยแล้ว");
      navigate("/homepage");
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert("เกิดข้อผิดพลาดในการลบทริป");
    }
  };

  /**
   * ลบสมาชิกออกจากทริป
   */
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`ต้องการลบ "${memberName}" ออกจากทริป?`)) {
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        console.log('🎭 Mock: Deleting member');
        await new Promise(r => setTimeout(r, 300));
      } else {
        await tripAPI.deleteMember(tripCode, memberId);
      }

      // อัปเดต state
      setTrip(prev => ({
        ...prev,
        members: prev.members?.filter(m => m.id !== memberId) || []
      }));

      alert(`✓ ลบ "${memberName}" ออกจากทริปแล้ว`);
    } catch (error) {
      console.error('Error deleting member:', error);
      alert("เกิดข้อผิดพลาดในการลบสมาชิก");
    }
  };

  // ============== RENDER ==============
  return (
    <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            👑 เจ้าของทริป
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            ตัวเลือกสำหรับเจ้าของ
          </h3>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ปุ่มจัดการสมาชิก */}
        <button
          onClick={() => setShowMemberList(!showMemberList)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
        >
          <Users className="w-5 h-5" />
          จัดการสมาชิก ({trip.members?.length || 0})
        </button>

        {/* ปุ่มลบทริป */}
        <button
          onClick={handleDeleteTrip}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
        >
          <X className="w-5 h-5" />
          ลบทริปนี้
        </button>
      </div>

      {/* Member List (แสดงเมื่อกดปุ่มจัดการสมาชิก) */}
      {showMemberList && (
        <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">รายชื่อสมาชิก</h4>
          
          {trip.members && trip.members.length > 0 ? (
            <div className="space-y-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  {/* ข้อมูลสมาชิก */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'owner' ? '👑 เจ้าของ' : 'สมาชิก'}
                      </p>
                    </div>
                  </div>

                  {/* ปุ่มลบ (ไม่แสดงถ้าเป็น owner) */}
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title={`ลบ ${member.name}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">ไม่มีสมาชิก</p>
          )}
        </div>
      )}
    </div>
  );
};