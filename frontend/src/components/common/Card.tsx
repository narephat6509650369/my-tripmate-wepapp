import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md border border-gray-100 ${
        onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};