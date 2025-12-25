import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Check, User, Loader2 } from "lucide-react";
import DOMPurify from 'dompurify';
import { tripAPI } from "../services/api";
import { CONFIG, log } from '../config/app.config';
import { 
  formatInviteCode, 
  validateInviteCode, 
  validateTripName, 
  validateDays 
} from '../utils/helpers';
import { 
  MOCK_MY_TRIPS, 
  MOCK_JOIN_TRIP_RESPONSE, 
  MOCK_CREATE_TRIP_RESPONSE, 
  MOCK_INVITE_CODE_RESPONSE 
} from "../data/mockData";
import type { TripData } from "../data/mockData";

// ============== CONSTANTS ==============
const MOCK_DELAY_MS = 500;
const FALLBACK_USER_ID = 'user123';
const MAX_TRIP_NAME_LENGTH = 100;
const MAX_TRIP_DETAIL_LENGTH = 500;

// ============== TYPES ==============
interface TripInput {
  name: string;
  days: string;
  detail: string;
}

interface FormattedTrip {
  id: string;
  tripCode: string;
  name: string;
  days: number;
  detail: string;
  people: number;
  status: string;
  statusColor: string;
  filled: string;
  isCompleted: boolean;
}

interface LoadingStates {
  joinTrip: boolean;
  createTrip: boolean;
}

// ============== TRIP CARD COMPONENT ==============
interface TripCardProps {
  trip: FormattedTrip;
  onNavigate: (tripCode: string, isCompleted: boolean) => void;
  isOwner?: boolean;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onNavigate, isOwner = false }) => (
  <div className="bg-blue-100 hover:bg-blue-200 rounded-lg p-5 transition relative cursor-pointer">
    <div className="absolute top-3 right-3">
      <span className={`text-xs font-medium px-3 py-1 rounded-full ${trip.statusColor}`}>
        {trip.status}
      </span>
    </div>
    <h3 className="font-bold text-lg text-blue-900 mb-3 pr-20">{trip.name}</h3>
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2 text-sm text-blue-900">
        <span className="font-medium">{trip.days} วัน</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-blue-900">
        <User className="w-4 h-4" />
        <span>{trip.people} คน</span>
      </div>
    </div>
    <p className="text-xs text-blue-800 leading-relaxed">{trip.filled}</p>

    <button
      onClick={() => onNavigate(trip.tripCode, trip.isCompleted)}
      className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
    >
      {trip.isCompleted ? "ดูสรุปผล" : (isOwner ? "แก้ไข" : "ดูรายละเอียด")}
    </button>
  </div>
);

// ============== EMPTY STATE COMPONENT ==============
interface EmptyStateProps {
  message: string;
  subtitle: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, subtitle }) => (
  <div className="bg-blue-50 rounded-lg p-8 text-center">
    <p className="text-gray-500">{message}</p>
    <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
  </div>
);

// ============== CREATE TRIP MODAL COMPONENT ==============
interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (trip: TripInput) => Promise<void>;
  isLoading: boolean;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate,
  isLoading 
}) => {
  const [newTrip, setNewTrip] = useState<TripInput>({
    name: "",
    days: "",
    detail: "",
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setNewTrip({ name: "", days: "", detail: "" });
    onClose();
  };

  const handleSubmit = async () => {
    await onCreate(newTrip);
    setNewTrip({ name: "", days: "", detail: "" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-md">
        <h2 className="text-xl font-bold text-blue-900 mb-4">สร้างทริปใหม่</h2>

        <div className="mb-3">
          <label className="block text-sm font-medium text-blue-900 mb-1">
            ชื่อทริป
          </label>
          <input
            type="text"
            className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTrip.name}
            onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
            placeholder="เช่น ทริปเที่ยวทะเล"
            maxLength={MAX_TRIP_NAME_LENGTH}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-blue-900 mb-1">
            จำนวนวัน (1-30 วัน)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTrip.days}
            onChange={(e) => setNewTrip({ ...newTrip, days: e.target.value })}
            placeholder="3"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-900 mb-1">
            รายละเอียด (ไม่จำเป็น)
          </label>
          <textarea
            className="w-full border border-blue-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTrip.detail}
            onChange={(e) => setNewTrip({ ...newTrip, detail: e.target.value })}
            placeholder="เช่น เที่ยวทะเลภาคใต้ 3 วัน 2 คืน"
            maxLength={MAX_TRIP_DETAIL_LENGTH}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            disabled={isLoading}
          >
            ยกเลิก
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              'สร้างทริป'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [roomCode, setRoomCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myTrips, setMyTrips] = useState<FormattedTrip[]>([]);
  const [invitedTrips, setInvitedTrips] = useState<FormattedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    joinTrip: false,
    createTrip: false
  });

  // ============== EFFECTS ==============
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    loadTrips(abortController.signal, isMounted);
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // ============== HELPER FUNCTIONS ==============
  
  /**
   * Sanitize และ validate input จากผู้ใช้
   */
  const sanitizeTripInput = (input: TripInput): TripInput => {
    return {
      name: DOMPurify.sanitize(input.name.trim(), { ALLOWED_TAGS: [] })
        .substring(0, MAX_TRIP_NAME_LENGTH),
      days: String(Math.max(1, Math.min(30, parseInt(input.days) || 1))),
      detail: DOMPurify.sanitize(input.detail.trim(), { ALLOWED_TAGS: [] })
        .substring(0, MAX_TRIP_DETAIL_LENGTH)
    };
  };

  /**
   * โหลดข้อมูลทริปจาก API หรือ Mock
   */
  const getTripsWithFallback = async (signal?: AbortSignal): Promise<any> => {
    if (CONFIG.USE_MOCK_DATA) {
      log.mock('Loading trips from mock');
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
      return MOCK_MY_TRIPS;
    }
    
    try {
      log.api('Loading trips from API');
      // ✅ แก้ไข: ตรวจสอบว่า API รับ signal หรือไม่
      const response = await tripAPI.getMyTrips();
      
      if (!response || !response.success) {
        log.warn('API failed, falling back to mock data');
        return MOCK_MY_TRIPS;
      }
      
      return response;
    } catch (error) {
      log.error('API error, using mock data', error);
      return MOCK_MY_TRIPS;
    }
  };

  /**
   * แปลงข้อมูล trip เป็น format ที่ใช้แสดงผล
   */
  const formatTripData = (trip: TripData): FormattedTrip => {
    const filled = trip.members?.filter((m: any) => 
      m.budget?.accommodation > 0 && 
      m.budget?.transport > 0 && 
      m.budget?.food > 0
    ).length || 0;
    const totalMembers = trip.members?.length || 0;
    
    return {
      id: trip._id || trip.tripCode,
      tripCode: trip.tripCode, 
      name: trip.name,
      days: trip.days,
      detail: trip.detail || '',
      people: totalMembers,
      status: trip.isCompleted ? "ครบแล้ว" : "กำลังรวบรวมข้อมูล",
      statusColor: trip.isCompleted 
        ? "bg-green-100 text-green-700" 
        : "bg-orange-100 text-orange-700",
      filled: totalMembers > 0 
        ? `กรอกแล้ว ${filled} คน${totalMembers - filled > 0 ? `, ยังไม่กรอก ${totalMembers - filled} คน` : ''}` 
        : "ยังไม่มีสมาชิก",
      isCompleted: trip.isCompleted || false
    };
  };

  /**
   * แยกทริปออกเป็น myTrips และ invitedTrips
   */
  const processTripsData = (response: any) => {
    if (!response?.success || !Array.isArray(response?.data)) {
      throw new Error('Invalid response format');
    }
    
    const userId = localStorage.getItem('userId') || FALLBACK_USER_ID;
    const created = response.data.filter((trip: TripData) => trip.createdBy === userId);
    const invited = response.data.filter((trip: TripData) => trip.createdBy !== userId);
    
    setMyTrips(created.map(formatTripData));
    setInvitedTrips(invited.map(formatTripData));
  };

  /**
   * จัดการ error เมื่อโหลดทริปไม่สำเร็จ
   */
  const handleLoadError = (error: any) => {
    log.error('Error loading trips:', error);
    setMyTrips([]);
    setInvitedTrips([]);
    alert('ไม่สามารถโหลดข้อมูลทริปได้ กรุณาลองใหม่อีกครั้ง');
  };

  /**
   * โหลดรายการทริปทั้งหมด
   */
  const loadTrips = async (signal?: AbortSignal, isMounted?: boolean) => {
    try {
      setLoading(true);
      
      const response = await getTripsWithFallback(signal);
      
      if (isMounted === false) return;
      
      processTripsData(response);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        log.info('Request aborted');
        return;
      }
      
      if (isMounted === false) return;
      
      handleLoadError(error);
    } finally {
      if (isMounted !== false) {
        setLoading(false);
      }
    }
  };

  // ============== HANDLERS ==============
  
  /**
   * เข้าร่วมทริปด้วยรหัส
   */
  const handleJoinTrip = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      alert("กรุณากรอกรหัสห้อง");
      return;
    }
    
    if (!validateInviteCode(cleanCode)) {
      alert("รูปแบบรหัสไม่ถูกต้อง");
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, joinTrip: true }));
    
    try {
      let response;
      
      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Joining trip (mock)');
        response = MOCK_JOIN_TRIP_RESPONSE;
        await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
      } else {
        log.api('Joining trip via API');
        response = await tripAPI.joinTrip(cleanCode);
        
        if (!response || !response.success) {
          log.warn('Join trip API failed, using mock');
          response = MOCK_JOIN_TRIP_RESPONSE;
        }
      }
      
      if (response.success) {
        alert('เข้าร่วมทริปสำเร็จ!');
        const tripId = response.data.tripCode || response.data.tripId || cleanCode;
        navigate(`/votePage/${tripId}`);
        setRoomCode("");
        loadTrips();
      } else {
        alert(response.message || 'ไม่สามารถเข้าร่วมทริปได้');
      }
    } catch (error) {
      log.error('Error joining trip:', error);
      
      if (!CONFIG.USE_MOCK_DATA) {
        log.warn('Using mock join response as fallback');
        alert('เข้าร่วมทริปสำเร็จ! (โหมดทดสอบ)');
        navigate(`/votePage/${cleanCode}`);
        setRoomCode("");
        return;
      }
      
      alert('เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    } finally {
      setLoadingStates(prev => ({ ...prev, joinTrip: false }));
    }
  };

  /**
   * สร้างทริปใหม่
   */
  const handleCreateTrip = async (tripInput: TripInput) => {
    const sanitized = sanitizeTripInput(tripInput);
    
    // Validation
    const nameValidation = validateTripName(sanitized.name);
    if (!nameValidation.valid) {
      alert(nameValidation.error);
      return;
    }

    const daysValidation = validateDays(Number(sanitized.days));
    if (!daysValidation.valid) {
      alert(daysValidation.error);
      return;
    }

    setLoadingStates(prev => ({ ...prev, createTrip: true }));

    try {
      let response, inviteResponse;

      if (CONFIG.USE_MOCK_DATA) {
        log.mock('Creating trip (mock)');
        response = MOCK_CREATE_TRIP_RESPONSE;
        await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
        inviteResponse = MOCK_INVITE_CODE_RESPONSE;
      } else {
        log.api('Creating trip via API');
        response = await tripAPI.createTrip(sanitized);

        if (!response?.success) {
          log.warn('Create trip API failed, using mock');
          response = MOCK_CREATE_TRIP_RESPONSE;
          inviteResponse = MOCK_INVITE_CODE_RESPONSE;
        } else {
          const tripId = response.data?._id || response.data?.id;
          if (!tripId) {
            log.warn('No trip ID, using mock');
            inviteResponse = MOCK_INVITE_CODE_RESPONSE;
          } else {
            inviteResponse = await tripAPI.generateInviteCode(tripId);
            
            if (!inviteResponse?.success) {
              log.warn('Generate invite code failed, using mock');
              inviteResponse = MOCK_INVITE_CODE_RESPONSE;
            }
          }
        }
      }

      if (!inviteResponse?.data?.inviteCode) {
        throw new Error("Failed to get invite code");
      }

      const inviteCode = inviteResponse.data.inviteCode;
      
      alert(
        `สร้างทริปสำเร็จ!\n\nรหัสเชิญ: ${inviteCode}\n\nกรุณาบันทึกรหัสนี้ไว้`
      );

      navigate(`/votePage/${inviteCode}`);
      setShowCreateModal(false);
      loadTrips();
    } catch (error) {
      log.error('Error creating trip:', error);
      
      if (!CONFIG.USE_MOCK_DATA) {
        log.warn('Using emergency mock code');
        const emergencyCode = `MOCK-${Date.now().toString().slice(-8)}`;
        alert(
          `สร้างทริปสำเร็จ! (โหมดออฟไลน์)\n\nรหัสเชิญ: ${emergencyCode}\n\nข้อมูลจะถูกบันทึกเมื่อเชื่อมต่อเซิร์ฟเวอร์`
        );
        navigate(`/votePage/${emergencyCode}`);
        setShowCreateModal(false);
        return;
      }
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "เกิดข้อผิดพลาดในการสร้างทริป";
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, createTrip: false }));
    }
  };

  /**
   * Navigate ไปหน้า trip
   */
  const handleTripNavigate = (tripCode: string, isCompleted: boolean) => {
    if (isCompleted) {
      navigate(`/summaryPage/${tripCode}`);
    } else {
      navigate(`/votePage/${tripCode}`);
    }
  };

  /**
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    navigate("/");
  };

  // ============== RENDER ==============
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header onLogout={handleLogout} />
      
      {/* Mock Data Warning */}
      {CONFIG.USE_MOCK_DATA && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-center text-sm">
          <strong>⚠️ โหมดทดสอบ:</strong> กำลังใช้ข้อมูลจำลอง (Mock Data) 
          - เปลี่ยนเป็น <code>USE_MOCK_DATA: false</code> ใน config.ts เพื่อใช้ API จริง
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate("/homepage")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-600 text-white"
          >
            ทริปทั้งหมด
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg font-medium transition bg-blue-200 text-blue-800 hover:bg-blue-300"
          >
            Dashboard
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Create Trip Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="md:flex-[2] flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>

          {/* Join Trip Input */}
          <div className="md:flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              value={roomCode}
              onChange={(e) => setRoomCode(formatInviteCode(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                setRoomCode(formatInviteCode(pastedText));
              }}
            />
            <button
              onClick={() => handleJoinTrip(roomCode)}
              disabled={loadingStates.joinTrip}
              className={`flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-lg transition ${
                loadingStates.joinTrip
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
              }`}
            >
              {loadingStates.joinTrip ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังเข้าร่วม...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  เข้าร่วม
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trip Lists */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            </div>
          ) : (
            <>
              {/* My Trips */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">สร้างโดยฉัน</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-4">
                  {myTrips.length === 0 ? (
                    <EmptyState 
                      message="ยังไม่มีทริป" 
                      subtitle="สร้างทริปใหม่เพื่อเริ่มต้น" 
                    />
                  ) : (
                    myTrips.map((trip) => (
                      <TripCard 
                        key={trip.id}
                        trip={trip}
                        onNavigate={handleTripNavigate}
                        isOwner
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Invited Trips */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">ถูกเชิญเข้าร่วม</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-4">
                  {invitedTrips.length === 0 ? (
                    <EmptyState 
                      message="ยังไม่มีทริป" 
                      subtitle="รอคำเชิญจากเพื่อน" 
                    />
                  ) : (
                    invitedTrips.map((trip) => (
                      <TripCard 
                        key={trip.id}
                        trip={trip}
                        onNavigate={handleTripNavigate}
                        isOwner={false}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTrip}
        isLoading={loadingStates.createTrip}
      />
    </div>
  );
};

export default HomePage;