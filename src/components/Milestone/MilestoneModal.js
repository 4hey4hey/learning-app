import React from 'react';
import { usePokemonCollection } from '../Collection/hooks/usePokemonCollection';

const MilestoneModal = ({ milestone, onClose }) => {
  const { addPokemonToCollection } = usePokemonCollection();

  const handleClaimReward = () => {
    if (milestone.rewardType === 'pokemon') {
      addPokemonToCollection({
        name: milestone.name,
        description: milestone.rewardDetails.description,
        unlockedAt: new Date()
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md transform transition-all">
        <div className="relative">
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-32 bg-yellow-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-4xl">🏆</span>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              {milestone.title}
            </h2>

            <div className="mb-6">
              <img 
                src={milestone.imageUrl} 
                alt="Milestone Reward" 
                className="mx-auto w-64 h-64 object-contain animate-bounce-slow"
              />
            </div>

            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                ${milestone.element === 'fire' ? 'bg-red-100 text-red-800' : 
                  milestone.element === 'water' ? 'bg-blue-100 text-blue-800' :
                  milestone.element === 'grass' ? 'bg-green-100 text-green-800' :
                  milestone.element === 'electric' ? 'bg-yellow-100 text-yellow-800' :
                  milestone.element === 'flying' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'}`}
              >
                {milestone.element === 'fire' ? '炎タイプ' : 
                 milestone.element === 'water' ? '水タイプ' :
                 milestone.element === 'grass' ? '草タイプ' :
                 milestone.element === 'electric' ? '電気タイプ' :
                 milestone.element === 'flying' ? 'ひこうタイプ' :
                 'ノーマルタイプ'}
              </span>
            </div>

            <p className="text-md bg-gray-50 p-3 rounded mb-3">
              {milestone.rewardDetails.description}
            </p>

            <p className="text-sm italic text-gray-600 mb-6">
              "{milestone.message}"
            </p>

            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleClaimReward}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                報酬を受け取る
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneModal;