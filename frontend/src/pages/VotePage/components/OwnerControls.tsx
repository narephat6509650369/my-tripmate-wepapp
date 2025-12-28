import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Loader2 } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config'; 
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
  const [deletingMember, setDeletingMember] = useState<string | null>(null); 
  
  const isOwner = 
    memberBudget?.role === 'owner' && 
    memberBudget?.id === trip.createdBy;
  
  console.log('🔐 Owner Check:', {
    memberRole: memberBudget?.role,
    memberId: memberBudget?.id,
    tripCreatedBy: trip.createdBy,
    isOwner
  });

  if (!isOwner) {
    console.log('❌ Not owner, hiding controls');
    return null;
  }
  console.log('✅ Is owner, showing controls');

  // ============== HANDLERS ==============
  
  /**
   * ลบทริปทั้งหมด
   */
  const handleDeleteTrip = async () => {
    if (!window.confirm(
      "⚠️ ยืนยันการลบทริป\n\n" +
      "คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้?\n\n" +
      "⚠️ การลบจะไม่สามารถกู้คืนได้"
    )) {
      return;
    }

    try {
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Deleting trip');
        await new Promise(r => setTimeout(r, 500));
      } else {
        log.api('Deleting trip via API');
        await tripAPI.deleteTrip(tripCode);
      }

      alert("✅ ลบทริปเรียบร้อยแล้ว");
      log.success('Trip deleted successfully');
      navigate("/homepage");
    } catch (error) {
      log.error('Error deleting trip:', error);
      alert("❌ เกิดข้อผิดพลาดในการลบทริป");
    }
  };

  /**
   * ลบสมาชิกออกจากทริป
   */
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    // ✅ ป้องกันการลบตัวเอง
    if (memberId === memberBudget?.id) {
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

      let response;
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Deleting member (mock)');
        response = { success: true };
        await new Promise(r => setTimeout(r, 500));
      } else {
        log.api('Deleting member via API');
        response = await tripAPI.deleteMember(tripCode, memberId);
      }

      if (response.success) {
        // อัพเดท UI
        setTrip(prev => ({
          ...prev,
          members: prev.members.filter(m => m.id !== memberId)
        }));
        
        alert(`✅ ลบ "${memberName}" ออกจากทริปสำเร็จ`);
        log.success('Member deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete member');
      }
    } catch (error) {
      log.error('Error deleting member:', error);
      alert(`❌ ไม่สามารถลบสมาชิกได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      {/* Member List */}
      {showMemberList && (
        <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">รายชื่อสมาชิก</h4>
          
          {trip.members && trip.members.length > 0 ? (
            <div className="space-y-2">
              {trip.members.map((member) => {
                const isDeleting = deletingMember === member.id;
                const isCurrentUser = member.id === memberBudget?.id;
                
                return (
                  <div
                    key={member.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg transition
                      ${isDeleting ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'}
                    `}
                  >
                    {/* ข้อมูลสมาชิก */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {member.name}
                          {isCurrentUser && <span className="text-xs text-blue-600 ml-2">(คุณ)</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.role === 'owner' ? '👑 เจ้าของทริป' : '👤 สมาชิก'}
                        </p>
                      </div>
                    </div>

                    {/* ปุ่มลบ */}
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        disabled={isDeleting}
                        className={`
                          p-2 rounded-lg transition
                          ${isDeleting 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-50'
                          }
                        `}
                        title={`ลบ ${member.name}`}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">ไม่มีสมาชิก</p>
          )}
        </div>
      )}
    </div>
  );
};