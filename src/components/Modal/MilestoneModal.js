import React from 'react';

const MilestoneModal = ({ milestone, onClose }) => {
  if (!milestone) return null;

  const getTypeLabel = () => {
    switch (milestone.element) {
      case 'fire': return '炎タイプ';
      case 'water': return '水タイプ';
      case 'grass': return '草タイプ';
      case 'electric': return '電気タイプ';
      case 'flying': return 'ひこうタイプ';
      default: return 'ノーマルタイプ';
    }
  };

  const getTypeClassName = () => {
    switch (milestone.element) {
      case 'fire': return 'bg-red-100 text-red-800';
      case 'water': return 'bg-blue-100 text-blue-800';
      case 'grass': return 'bg-green-100 text-green-800';
      case 'electric': return 'bg-yellow-100 text-yellow-800';
      case 'flying': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{milestone.name}</h2>
          
          <div className="my-6">
            <img 
              src={milestone.imageUrl} 
              alt={milestone.name} 
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>
          
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeClassName()}`}>
              {getTypeLabel()}
            </span>
          </div>
          
          <p className="text-md bg-gray-50 p-3 rounded mb-3">
            {milestone.description}
          </p>
          
          <p className="text-sm italic text-gray-600 mb-6">
            &ldquo;{milestone.message}&rdquo;
          </p>
          
          <p className="text-xs text-gray-500 mb-6">
            獲得条件: 累計{milestone.condition && milestone.condition.value ? milestone.condition.value : '??'}時間の学習
          </p>
          
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneModal;
