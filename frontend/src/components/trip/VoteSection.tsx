import React, { useState } from 'react';
import { VoteCategory } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface VoteSectionProps {
  category: VoteCategory;
}

export const VoteSection: React.FC<VoteSectionProps> = ({ category }) => {
  const [userVotes, setUserVotes] = useState<{ [optionId: number]: boolean }>({});

  const handleVote = (optionId: number) => {
    setUserVotes(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-800 mb-4">{category.title}</h3>
      <div className="space-y-3">
        {category.options.map((option) => {
          const totalVotes = option.votes.length;
          const hasVoted = userVotes[option.id];
          const displayVotes = hasVoted ? totalVotes + 1 : totalVotes;
          const percentage = totalVotes > 0 ? Math.round((displayVotes / (totalVotes + 1)) * 100) : 0;

          return (
            <div
              key={option.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                hasVoted ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{option.text}</span>
                <span className="text-sm font-bold text-blue-600">{percentage}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {displayVotes} โหวต
                  {option.votes.length > 0 && (
                    <span className="ml-2">
                      ({option.votes.join(', ')})
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={hasVoted ? 'secondary' : 'primary'}
                  onClick={() => handleVote(option.id)}
                >
                  {hasVoted ? 'ยกเลิก' : 'โหวต'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};