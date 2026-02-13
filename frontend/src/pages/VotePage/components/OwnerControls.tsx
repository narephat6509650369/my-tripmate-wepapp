// src/pages/VotePage/components/OwnerControls.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Loader2, Trash2 } from 'lucide-react';
import { tripAPI } from '../../../services/tripService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TripDetail } from '../../../types';

// ============== TYPES ==============
interface OwnerControlsProps {
  trip: TripDetail;
}

// ============== COMPONENT ==============
export const OwnerControls: React.FC<OwnerControlsProps> = ({ trip }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showMemberList, setShowMemberList] = useState(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✅ เช็คว่าเป็น Owner หรือไม่
<<<<<<< HEAD
  const isOwner = user?.user_id === trip.owner_id;
=======
  const isOwner = user?.user_id === trip.ownerid;
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
  
  if (!isOwner) return null;

  // ============== HANDLERS ==============
  
  /**
   * ลบทริปทั้งหมด
   */
  const handleDeleteTrip = async () => {
    if (!window.confirm(
      "⚠️ ยืนยันการลบทริป\n\n" +
      "คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้?\n\n" +
      "⚠️ การลบจะไม่สามารถกู้คืนได้\n" +
      "• ข้อมูลทั้งหมดจะถูกลบ\n" +
      "• สมาชิกทั้งหมดจะไม่สามารถเข้าถึงทริปนี้ได้"
    )) {
      return;
    }

    try {
      setIsDeleting(true);

<<<<<<< HEAD
      const response = await tripAPI.deleteTrip(trip.trip_id);
=======
      const response = await tripAPI.deleteTrip(trip.tripid);
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

      if (response.success) {
        alert("✅ ลบทริปเรียบร้อยแล้ว");
        navigate("/homepage");
      } else {
        throw new Error(response.message || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert("❌ เกิดข้อผิดพลาดในการลบทริป");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ลบสมาชิกออกจากทริป
   */
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    // ✅ ป้องกันการลบตัวเอง
    if (memberId === user?.user_id) {
      alert(
        '⚠️ ไม่สามารถลบตัวเองออกจากทริปได้\n\n' +
        'หากต้องการออกจากทริป กรุณา:\n' +
        '• โอนสิทธิ์ Owner ให้สมาชิกคนอื่นก่อน หรือ\n' +
        '• ลบทริปทั้งหมด'
      );
      return;
    }

    // Confirmation
    if (!window.confirm(
      `⚠️ ยืนยันการลบสมาชิก\n\n` +
      `คุณต้องการลบ "${memberName}" ออกจากทริปใช่หรือไม่?\n\n` +
      `⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้`
    )) {
      return;
    }

    try {
      setDeletingMember(memberId);

<<<<<<< HEAD
      const response = await tripAPI.removeMember(trip.trip_id, memberId);
=======
      const response = await tripAPI.removeMember(trip.tripid, memberId);
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25

      if (response.success) {
        alert(`✅ ลบ "${memberName}" ออกจากทริปสำเร็จ`);
        // Reload page to update member list
        window.location.reload();
      } else {
        throw new Error(response.message || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(`❌ ไม่สามารถลบสมาชิกได้`);
    } finally {
      setDeletingMember(null);
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
<<<<<<< HEAD
          จัดการสมาชิก ({trip.member_count})
=======
          จัดการสมาชิก ({trip.membercount})
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
        </button>

        {/* ปุ่มลบทริป */}
        <button
          onClick={handleDeleteTrip}
          disabled={isDeleting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังลบ...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              ลบทริปนี้
            </>
          )}
        </button>
      </div>

      {/* Member List */}
      {showMemberList && (
        <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">รายชื่อสมาชิก</h4>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-3 rounded text-sm">
            <p className="text-yellow-800">
              💡 <strong>หมายเหตุ:</strong> รายชื่อสมาชิกจะแสดงเมื่อ Backend รองรับ API สำหรับดึงรายชื่อสมาชิก
            </p>
          </div>

          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              ฟีเจอร์นี้ต้องการ API GET /api/trips/:tripId/members
            </p>
            <p className="text-xs mt-1">
              กำลังรอการพัฒนา Backend
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerControls;