import React from 'react';
import { useNavigate } from 'react-router-dom';

// ポケモンタイプに応じた色クラスを取得する関数
const getTypeColorClass = (element) => {
  switch (element) {
    case 'fire':
      return 'bg-red-100 text-red-800';
    case 'water':
      return 'bg-blue-100 text-blue-800';
    case 'grass':
      return 'bg-green-100 text-green-800';
    case 'electric':
      return 'bg-yellow-100 text-yellow-800';
    case 'flying':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ポケモンタイプのラベルを取得する関数
const getTypeLabel = (element) => {
  switch (element) {
    case 'fire':
      return '炎タイプ';
    case 'water':
      return '水タイプ';
    case 'grass':
      return '草タイプ';
    case 'electric':
      return '電気タイプ';
    case 'flying':
      return 'ひこうタイプ';
    default:
      return 'ノーマルタイプ';
  }
};

const PokemonAchievementModal = ({ pokemon, onClose }) => {
  const navigate = useNavigate();
  
  if (!pokemon) return null;
  
  // コレクション画面に移動する関数
  const handleViewCollection = () => {
    onClose();
    navigate('/pokemon-collection');
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2 text-indigo-600">
            おめでとう！新しいポケモンをゲットしました！
          </h3>
          
          <div className="py-4 mb-2">
            <img 
              src={pokemon.imageUrl} 
              alt={pokemon.name} 
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{pokemon.name}</h2>
          
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
              ${getTypeColorClass(pokemon.element)}`}>
              {getTypeLabel(pokemon.element)}
            </span>
          </div>
          
          <p className="text-md bg-yellow-50 p-3 rounded mb-3">
            {pokemon.description}
          </p>
          
          <p className="text-sm italic text-indigo-600 mb-4">
            &quot;{pokemon.message}&quot;
          </p>
          
          <div className="flex justify-between mb-6">
            <button 
              onClick={handleViewCollection}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              コレクションを見る
            </button>
            
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonAchievementModal;
