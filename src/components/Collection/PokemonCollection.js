import React, { useState } from 'react';
import { useStudyState } from '../../contexts/StudyStateContext';
import { usePokemonCollection } from './hooks/usePokemonCollection';

const PokemonCollection = () => {
  const { totalStudyHours } = useStudyState();
  const { pokemonCollection, loading, error, effectiveStudyHours } = usePokemonCollection();
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // バッジ詳細モーダル表示
  const showBadgeDetails = (badge) => {
    if (badge.collected) {
      setSelectedBadge(badge);
    }
  };
  
  // 獲得済みバッジをカウント
  const collectedCount = pokemonCollection ? pokemonCollection.filter(badge => badge.collected).length : 0;
  
  // 次に獲得可能なバッジを見つける
  const nextBadge = pokemonCollection ? pokemonCollection.find(badge => 
    !badge.collected && badge.condition.type === "totalHours"
  ) : null;
  
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">🏆 ポケモンコレクション</h1>
            <span className="text-lg text-gray-600 font-medium">
              獲得: {collectedCount}/{pokemonCollection ? pokemonCollection.length : 0}
            </span>
          </div>
          
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-blue-800">現在の累計学習時間</h2>
                <p className="text-3xl font-bold text-blue-600">{Math.round(effectiveStudyHours * 10) / 10}時間</p>
              </div>
              {nextBadge && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">次のポケモンまで</p>
                  <p className="text-xl font-bold text-green-600">あと{Math.round((nextBadge.condition.value - effectiveStudyHours) * 10) / 10}時間</p>
                  <p className="text-xs text-gray-500">（{nextBadge.name}: {nextBadge.condition.value}時間）</p>
                </div>
              )}
            </div>
            
            {nextBadge && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-blue-600" 
                       style={{ width: `${Math.min(100, (effectiveStudyHours / nextBadge.condition.value) * 100)}%` }}>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 text-center">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pokemonCollection && pokemonCollection.map(badge => (
                <div 
                  key={badge.id} 
                  className={`p-4 rounded-lg border ${badge.collected ? 'bg-white cursor-pointer hover:bg-gray-50' : 'bg-gray-100'}`}
                  onClick={() => showBadgeDetails(badge)}
                >
                  {badge.collected ? (
                    <>
                      <div className="relative">
                        <img 
                          src={badge.imageUrl} 
                          alt={badge.name} 
                          className="w-full h-32 object-contain mb-2"
                        />
                        <span className="absolute bottom-2 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full">GET!</span>
                      </div>
                      <h3 className="font-bold text-center">{badge.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {badge.description.split('！')[0] + '！'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-md mb-2 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* 透かし画像を表示しないように修正 */}
                        </div>
                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-xl">???</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-center text-gray-500">???</h3>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        累計{badge.condition.value}時間で解放
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* バッジ詳細モーダル */}
      {selectedBadge && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">{selectedBadge.name}</h3>
              
              <div className="my-6">
                <img 
                  src={selectedBadge.imageUrl} 
                  alt={selectedBadge.name} 
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>
              
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                  ${selectedBadge.element === 'fire' ? 'bg-red-100 text-red-800' : 
                    selectedBadge.element === 'water' ? 'bg-blue-100 text-blue-800' :
                    selectedBadge.element === 'grass' ? 'bg-green-100 text-green-800' :
                    selectedBadge.element === 'electric' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBadge.element === 'flying' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'}`}
                >
                  {selectedBadge.element === 'fire' ? '炎タイプ' : 
                   selectedBadge.element === 'water' ? '水タイプ' :
                   selectedBadge.element === 'grass' ? '草タイプ' :
                   selectedBadge.element === 'electric' ? '電気タイプ' :
                   selectedBadge.element === 'flying' ? 'ひこうタイプ' :
                   'ノーマルタイプ'}
                </span>
              </div>
              
              <p className="text-md bg-gray-50 p-3 rounded mb-3">
                {selectedBadge.description}
              </p>
              
              <p className="text-sm italic text-gray-600 mb-6">
                &quot;{selectedBadge.message}&quot;
              </p>
              
              <p className="text-xs text-gray-500 mb-6">
                獲得条件: 累計{selectedBadge.condition.value}時間の学習
              </p>
              
              <button 
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500 text-center">
        ©Pokémon ポケモンイラストラボの素材を使用しています
      </div>
    </div>
  );
};

export default PokemonCollection;