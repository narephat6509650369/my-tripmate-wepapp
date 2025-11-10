// import React, { useState } from 'react';
// import { VoteCategory, VoteOption } from '../../types';
// import { Card } from '../common/Card';
// import { Button } from '../common/Button';
// import { Modal } from '../common/Modal';
// import { Input } from '../common/Input';
// import { Plus } from 'lucide-react';

// interface VoteSectionProps {
//   category: VoteCategory;
// }

// export const VoteSection: React.FC<VoteSectionProps> = ({ category: initialCategory }) => {
//   const [category, setCategory] = useState(initialCategory);
//   const [userVotes, setUserVotes] = useState<{ [optionId: number]: boolean }>({});
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [newOptionText, setNewOptionText] = useState('');

//   const handleVote = (optionId: number) => {
//     setUserVotes(prev => ({
//       ...prev,
//       [optionId]: !prev[optionId]
//     }));
//   };

//   const handleAddOption = () => {
//     if (!newOptionText.trim()) return;

//     const newOption: VoteOption = {
//       id: category.options.length + 1,
//       text: newOptionText,
//       votes: [],
//     };

//     setCategory({
//       ...category,
//       options: [...category.options, newOption],
//     });

//     setNewOptionText('');
//     setShowAddModal(false);
//   };

//   return (
//     <>
//       <Card>
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-bold text-gray-800">{category.title}</h3>
//           <Button
//             size="sm"
//             variant="secondary"
//             onClick={() => setShowAddModal(true)}
//           >
//             <Plus className="w-4 h-4 mr-1" />
//             เพิ่มตัวเลือก
//           </Button>
//         </div>

//         <div className="space-y-3">
//           {category.options.map((option) => {
//             const totalVotes = option.votes.length;
//             const hasVoted = userVotes[option.id];
//             const displayVotes = hasVoted ? totalVotes + 1 : totalVotes;
//             const percentage = totalVotes > 0 ? Math.round((displayVotes / (totalVotes + 1)) * 100) : 0;

//             return (
//               <div
//                 key={option.id}
//                 className={`p-4 rounded-lg border-2 transition-all ${
//                   hasVoted ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
//                 }`}
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="font-medium text-gray-800">{option.text}</span>
//                   <span className="text-sm font-bold text-blue-600">{percentage}%</span>
//                 </div>

//                 <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
//                   <div
//                     className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
//                     style={{ width: `${percentage}%` }}
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="text-xs text-gray-500">
//                     {displayVotes} โหวต
//                     {option.votes.length > 0 && (
//                       <span className="ml-2">
//                         ({option.votes.join(', ')})
//                       </span>
//                     )}
//                   </div>
//                   <Button
//                     size="sm"
//                     variant={hasVoted ? 'secondary' : 'primary'}
//                     onClick={() => handleVote(option.id)}
//                   >
//                     {hasVoted ? 'ยกเลิก' : 'โหวต'}
//                   </Button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </Card>

//       {/* Add Option Modal */}
//       <Modal
//         isOpen={showAddModal}
//         onClose={() => setShowAddModal(false)}
//         title={`เพิ่มตัวเลือก${category.title}`}
//       >
//         <div className="space-y-4">
//           <Input
//             label="ตัวเลือกใหม่"
//             value={newOptionText}
//             onChange={(e) => setNewOptionText(e.target.value)}
//             placeholder={`เช่น 25-27 ธ.ค. 2024`}
//             required
//           />
//           <div className="flex gap-3 pt-4">
//             <Button
//               variant="secondary"
//               onClick={() => setShowAddModal(false)}
//               className="flex-1"
//             >
//               ยกเลิก
//             </Button>
//             <Button onClick={handleAddOption} className="flex-1">
//               เพิ่ม
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </>
//   );
// };
import React, { useState } from 'react';
import { VoteCategory } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';

interface VoteSectionProps {
  category: VoteCategory;
}

export const VoteSection: React.FC<VoteSectionProps> = ({ category }) => {
  const [userVotes, setUserVotes] = useState<{ [optionId: number]: boolean }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');

  const handleVote = (optionId: number) => {
    setUserVotes((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;

    // จำลองการเพิ่มตัวเลือกใหม่
    const newOption = {
      id: Date.now(), // สร้าง id ชั่วคราว
      text: newOptionText,
      votes: [],
    };

    category.options.push(newOption);
    setNewOptionText('');
    setShowAddModal(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">{category.title}</h3>
        <Button
          variant="secondary"
          onClick={() => setShowAddModal(true)}
          className="text-sm px-3 py-1"
        >
          + เพิ่มตัวเลือก
        </Button>
      </div>

      <div className="space-y-3">
        {category.options.map((option) => {
          const totalVotes = option.votes.length;
          const hasVoted = userVotes[option.id];
          const displayVotes = hasVoted ? totalVotes + 1 : totalVotes;

          const totalPossibleVotes = category.options.reduce(
            (sum, opt) => sum + (userVotes[opt.id] ? opt.votes.length + 1 : opt.votes.length),
            0
          );

          const percentage = totalPossibleVotes
            ? Math.round((displayVotes / totalPossibleVotes) * 100)
            : 0;

          return (
            <div
              key={option.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                hasVoted ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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
                <div className="text-xs text-gray-500">{displayVotes} โหวต</div>
                <Button
                  variant={hasVoted ? 'secondary' : 'primary'}
                  onClick={() => handleVote(option.id)}
                  className="text-sm px-3 py-1"
                >
                  {hasVoted ? 'ยกเลิก' : 'โหวต'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal สำหรับเพิ่มตัวเลือก */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`เพิ่มตัวเลือกใน ${category.title}`}
      >
        <div className="space-y-4">
          <Input
            label="ตัวเลือกใหม่"
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            placeholder="เช่น 25–27 ธ.ค. 2024"
            required
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAddOption} className="flex-1">
              เพิ่ม
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
