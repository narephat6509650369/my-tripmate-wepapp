// ==========================================
// 📁 src/components/vote/VoteOption.tsx
// ==========================================

import React from 'react';
import { VoteOption as VoteOptionType } from '../../types';
import { CheckCircle } from 'lucide-react';

interface VoteOptionProps {
  option: VoteOptionType;
  onVote: () => void;
  currentUserId: number;
}

export const VoteOption: React.FC<VoteOptionProps> = ({
  option,
  onVote,
  currentUserId,
}) => {
  const hasVoted = option.votes?.some((vote) => vote.user_id === currentUserId);
  const voteCount = option.votes?.length || 0;
  const percentage = option.vote_count ? Math.round((voteCount / option.vote_count) * 100) : 0;

  return (
    <div
      onClick={onVote}
      className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
        hasVoted
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {hasVoted && <CheckCircle className="w-5 h-5 text-blue-600" />}
          <span className="font-medium text-gray-800">{option.option_text}</span>
        </div>
        <span className="text-sm font-bold text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">{voteCount} โหวต</div>
    </div>
  );
};
