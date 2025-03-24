import React, { useState } from 'react';
import { useCategory } from '../../contexts/CategoryContext';

const PRESET_COLORS = [
  '#FF5252', // 赤
  '#4CAF50', // 緑
  '#2196F3', // 青
  '#FFC107', // 黄
  '#9C27B0', // 紫
  '#FF9800', // オレンジ
  '#795548', // 茶
  '#607D8B'  // 青灰
];

const CategoryManager = () => {
  const { 
    categories, 
    addCategory,
    deleteCategory
  } = useCategory();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  // アコーディオン開閉
  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
    // 閉じる時は追加フォームも閉じる
    if (isExpanded) {
      setIsAdding(false);
    }
  };

  // 新規カテゴリ追加フォームの表示切替
  const toggleAddForm = () => {
    setIsAdding(!isAdding);
    setNewCategoryName('');
    setSelectedColor(PRESET_COLORS[0]);
    setError('');
  };

  // 新規カテゴリの追加処理
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }
    
    try {
      await addCategory(newCategoryName, selectedColor);
      setNewCategoryName('');
      setSelectedColor(PRESET_COLORS[0]);
      setIsAdding(false);
      setError('');
    } catch (error) {
      console.error('カテゴリの追加エラー:', error);
      setError('カテゴリの追加に失敗しました');
    }
  };

  // カテゴリの削除処理
  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      console.error('カテゴリの削除エラー:', error);
      setError('カテゴリの削除に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleAccordion}
      >
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''} mr-2`}>▶</span>
          📚 教科カテゴリ
          <span className="ml-2 text-sm text-gray-500">({categories.length})</span>
        </h2>
        {isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleAddForm();
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {isAdding ? 'キャンセル' : '+ 追加'}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <>
          {error && (
            <div className="mb-4 mt-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {isAdding && (
            <form onSubmit={handleAddCategory} className="mb-4 mt-4 p-3 bg-gray-50 rounded">
              <div className="mb-3">
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ名
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="国語、数学など"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カラー
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    ></div>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                追加
              </button>
            </form>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">カテゴリがありません</p>
            ) : (
              categories.map(category => (
                <div key={category.id} className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="flex-1">{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-500 hover:text-red-700"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryManager;
