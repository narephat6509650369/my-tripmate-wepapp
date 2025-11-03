// ==========================================
// 📁 src/components/vote/VoteSection.tsx
// ==========================================

import React, { useState } from 'react';
import { VoteCategory } from '../../types';
import { Plus, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { VoteOption as VoteOptionComponent } from './VoteOption';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';

interface VoteSectionProps {
  category: VoteCategory;
  onAddOption: (categoryId: number, text: string) => Promise<void>;
  onVote: (optionId: number) => Promise<void>;
  currentUserId: number;
}

export const VoteSection: React.FC<VoteSectionProps> = ({
  category,
  onAddOption,
  onVote,
  currentUserId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(false);

  const getCategoryIcon = () => {
    switch (category.category) {
      case 'dates':
        return <Calendar className="w-5 h-5" />;
      case 'places':
        return <MapPin className="w-5 h-5" />;
      case 'budget':
        return <DollarSign className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    setLoading(true);
    try {
      await onAddOption(category.id, newOption);
      setNewOption('');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to add option:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {getCategoryIcon()}
            {category.title}
          </h3>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            เพิ่มตัวเลือก
          </Button>
        </div>

        {category.description && (
          <p className="text-gray-600 text-sm mb-4">{category.description}</p>
        )}

        <div className="space-y-3">
          {category.options?.map((option) => (
            <VoteOptionComponent
              key={option.id}
              option={option}
              onVote={() => onVote(option.id)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`เพิ่มตัวเลือก${category.title}`}
      >
        <div className="space-y-4">
          <Input
            label="ตัวเลือก"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder={`ระบุ${category.title}`}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddOption}
              loading={loading}
              className="flex-1"
            >
              เพิ่ม
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};