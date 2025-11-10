import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ text = 'กำลังโหลด...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};