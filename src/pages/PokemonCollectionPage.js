import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import PokemonCollection from '../components/Collection/PokemonCollection';
// AllTimeStats import削除
import { useStudyState } from '../contexts/StudyStateContext';
import { useMilestoneModal } from '../hooks/useMilestoneModal';

const PokemonCollectionPage = () => {
  const { isLoading } = useStudyState();
  const { milestone, closeMilestoneModal, showMilestoneDirectly } = useMilestoneModal();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">ポケモンコレクション</h1>
        <p className="text-gray-600">学習の進捗に応じてポケモンをコレクションしよう！</p>
      </div>
      
      {/* 全期間統計コンポーネント削除 */}
      
      <PokemonCollection />
      
      {/* マイルストーンモーダル */}
      {milestone && (
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
                {milestone.description}
              </p>
              
              <p className="text-sm italic text-gray-600 mb-6">
                &ldquo;{milestone.message}&rdquo;
              </p>
              
              <p className="text-xs text-gray-500 mb-6">
                獲得条件: 累計{milestone.condition && milestone.condition.value ? milestone.condition.value : '??'}時間の学習
              </p>
              
              <div className="flex space-x-4 justify-center">
                <button 
                  onClick={closeMilestoneModal}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  閉じる
                </button>
                
                <button 
                  onClick={() => showMilestoneDirectly(milestone)}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  直接表示
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PokemonCollectionPage;
