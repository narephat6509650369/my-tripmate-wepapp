// ==========================================
// 📁 src/pages/TripDetailPage.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Loading } from '../components/common/Loading';
import { VoteSection } from '../components/vote/VoteSection';
import { Badge } from '../components/common/Badge';
import { ArrowLeft, Users, Plus, Settings } from 'lucide-react';
import { Trip, VoteCategory } from '../types';
import { tripService } from '../services/tripService';
import { voteService } from '../services/voteService';
import { useAuth } from '../contexts/AuthContext';

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [categories, setCategories] = useState<VoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTripData();
    }
  }, [id]);

  const loadTripData = async () => {
    try {
      const [tripData, voteData] = await Promise.all([
        tripService.getById(Number(id)),
        voteService.getCategories(Number(id)),
      ]);
      setTrip(tripData);
      setCategories(voteData);
    } catch (error) {
      console.error('Failed to load trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      await tripService.inviteMember(Number(id), inviteEmail);
      setInviteEmail('');
      setShowInviteModal(false);
      await loadTripData();
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleAddOption = async (categoryId: number, text: string) => {
    await voteService.addOption(categoryId, text);
    await loadTripData();
  };

  const handleVote = async (optionId: number) => {
    try {
      await voteService.castVote(optionId);
      await loadTripData();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <Loading text="กำลังโหลดข้อมูลทริป..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 text-lg mb-4">ไม่พบทริปที่คุณต้องการ</p>
          <Button onClick={() => navigate('/')}>กลับไปหน้าหลัก</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-5 h-5" />}
          onClick={() => navigate('/')}
          className="mb-6"
        >
          กลับไปทริปทั้งหมด
        </Button>

        {/* Trip Header */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{trip.name}</h1>
              {trip.description && (
                <p className="text-gray-600 mb-3">{trip.description}</p>
              )}
              <Badge variant="warning">กำลังวางแผน</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowInviteModal(true)}
              >
                เชิญเพื่อน
              </Button>
              <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
                ตั้งค่า
              </Button>
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">สมาชิก ({trip.members?.length || 0})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trip.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {member.user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {member.user?.name}
                  </span>
                  {member.role === 'creator' && (
                    <Badge variant="info" size="sm">
                      ผู้สร้าง
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vote Sections */}
        <div className="space-y-6">
          {categories.map((category) => (
            <VoteSection
              key={category.id}
              category={category}
              onAddOption={handleAddOption}
              onVote={handleVote}
              currentUserId={user?.id || 0}
            />
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="เชิญเพื่อนเข้าร่วมทริป"
      >
        <div className="space-y-4">
          <Input
            type="email"
            label="อีเมลเพื่อน"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleInvite} loading={inviting} className="flex-1">
              ส่งคำเชิญ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripDetailPage;