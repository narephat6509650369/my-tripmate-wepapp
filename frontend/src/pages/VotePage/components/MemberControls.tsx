import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { tripAPI } from '../../../services/api';
import { CONFIG, log } from '../../../config/app.config';
import type { TripData, Member } from '../../../data/mockData';

// ============== TYPES ==============
interface MemberControlsProps {
  trip: TripData;
  memberBudget: Member;
  tripCode: string;
}

// ============== COMPONENT ==============
export const MemberControls: React.FC<MemberControlsProps> = ({
  trip,
  memberBudget,
  tripCode
}) => {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  // ✅ แสดงเฉพาะ Member (ไม่ใช่ Owner)
  const isMember = memberBudget?.role === 'member';
  
  if (!isMember) return null;

  // ============== HANDLERS ==============
  const handleLeaveTrip = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ ยืนยันการออกจากทริป\n\n` +
      `คุณต้องการออกจากทริป "${trip.name}" ใช่หรือไม่?\n\n` +
      `⚠️ หากออกจากทริป:\n` +
      `• ข้อมูลโหวตของคุณจะถูกลบ\n` +
      `• คุณจะไม่สามารถเข้าถึงทริปนี้ได้อีก\n` +
      `• หากต้องการกลับเข้าร่วม ต้องใช้รหัสเชิญใหม่\n\n` +
      `การกระทำนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    try {
      setIsLeaving(true);

      let response;
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Leaving trip (mock)');
        response = { success: true };
        await new Promise(r => setTimeout(r, 500));
      } else {
        log.api('Leaving trip via API');
        response = await tripAPI.leaveTrip(tripCode);
      }

      if (response.success) {
        alert('✅ ออกจากทริปสำเร็จ\n\nคุณสามารถกลับเข้าร่วมได้อีกครั้งด้วยรหัสเชิญ');
        log.success('Left trip successfully');
        navigate('/homepage');
      } else {
        throw new Error(response.message || 'Failed to leave trip');
      }
    } catch (error) {
      log.error('Error leaving trip:', error);
      alert(`❌ ไม่สามารถออกจากทริปได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLeaving(false);
    }
  };

  // ============== RENDER ==============
  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">
            สมาชิกทริปนี้
          </h3>
          <p className="text-sm text-red-700 mb-3">
            คุณเป็นสมาชิกที่ถูกเชิญเข้าร่วมทริปนี้ 
            หากต้องการออกจากทริป กดปุ่มด้านล่าง
          </p>
          
          <button
            onClick={handleLeaveTrip}
            disabled={isLeaving}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isLeaving 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
              }
            `}
          >
            {isLeaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังออกจากทริป...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>ออกจากทริป</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};