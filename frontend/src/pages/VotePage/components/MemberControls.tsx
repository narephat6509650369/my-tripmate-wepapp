// src/pages/VotePage/components/MemberControls.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { tripAPI } from '../../../services/tripService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TripDetail } from '../../../types';

// ============== TYPES ==============
interface MemberControlsProps {
  trip: TripDetail;
}

// ============== COMPONENT ==============
export const MemberControls: React.FC<MemberControlsProps> = ({ trip }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);

  // ✅ เช็คว่าเป็น Member หรือไม่ (ไม่ใช่ Owner)
<<<<<<< HEAD
  const isMember = user?.user_id !== trip.owner_id;
=======
  const isMember = user?.user_id !== trip.ownerid;
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
  
  if (!isMember) return null;

  // ============== HANDLERS ==============
  const handleLeaveTrip = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ ยืนยันการออกจากทริป\n\n` +
<<<<<<< HEAD
      `คุณต้องการออกจากทริป "${trip.trip_name}" ใช่หรือไม่?\n\n` +
=======
      `คุณต้องการออกจากทริป "${trip.tripname}" ใช่หรือไม่?\n\n` +
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      `⚠️ หากออกจากทริป:\n` +
      `• ข้อมูลโหวตของคุณจะถูกลบ\n` +
      `• คุณจะไม่สามารถเข้าถึงทริปนี้ได้อีก\n` +
      `• หากต้องการกลับเข้าร่วม ต้องใช้รหัสเชิญใหม่\n\n` +
      `การกระทำนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    try {
      setIsLeaving(true);

      // ❌ ฟังก์ชัน leaveTrip อาจไม่มีใน Backend
      // ใช้ removeMember แทน (Owner ต้องทำเอง)
      
      alert(
        '⚠️ การออกจากทริป\n\n' +
        'กรุณาติดต่อเจ้าของทริปเพื่อลบคุณออกจากทริป\n\n' +
<<<<<<< HEAD
        `รหัสทริป: ${trip.invite_code}`
=======
        `รหัสทริป: ${trip.invitecode}`
>>>>>>> f492aee28674c43c171d6934ee550a04ec49bb25
      );
      
    } catch (error) {
      console.error('Error leaving trip:', error);  
      alert(`❌ เกิดข้อผิดพลาด`);
    } finally {
      setIsLeaving(false);
    }
  };

  // ============== RENDER ==============
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            สมาชิกทริปนี้
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            คุณเป็นสมาชิกที่ถูกเชิญเข้าร่วมทริปนี้ 
            หากต้องการออกจากทริป กรุณาติดต่อเจ้าของทริป
          </p>
          
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <span>👑</span>
            <span>เจ้าของทริปสามารถจัดการสมาชิกได้</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberControls;