import React, { useState } from 'react';
import { useCategory } from '../../contexts/CategoryContext';
import ConfirmDialog from '../Modal/ConfirmDialog';

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
    updateCategory,
    deleteCategory
  } = useCategory();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // アコーディオン開閉
  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
    // 閉じる時は追加フォームも閉じる
    if (isExpanded) {
      setIsAdding(false);
      setIsEditing(false);
      setEditingCategory(null);
    }
  };

  // 新規カテゴリ追加フォームの表示切替
  const toggleAddForm = () => {
    setIsAdding(!isAdding);
    setIsEditing(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setSelectedColor(PRESET_COLORS[0]);
    setError('');
  };
  
  // カテゴリの編集フォームの表示
  const startEditCategory = (category) => {
    console.log('カテゴリ編集開始', category);
    setIsEditing(true);
    setIsAdding(false);
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setError('');
  };

  // カテゴリ削除の確認ダイアログを表示
  const confirmDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  // カテゴリ削除をキャンセル
  const cancelDeleteCategory = () => {
    setCategoryToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // 新規カテゴリの追加処理
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }
    
    try {
      // オブジェクトとして渡すように修正
      await addCategory({
        name: newCategoryName,
        color: selectedColor
      });
      setNewCategoryName('');
      setSelectedColor(PRESET_COLORS[0]);
      setIsAdding(false);
      setError('');
    } catch (error) {
      console.error('カテゴリの追加エラー:', error);
      setError('カテゴリの追加に失敗しました');
    }
  };

  // カテゴリの編集処理
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }
    
    try {
      await updateCategory(editingCategory.id, {
        name: newCategoryName,
        color: selectedColor,
        updatedAt: new Date()
      });
      setNewCategoryName('');
      setSelectedColor(PRESET_COLORS[0]);
      setIsEditing(false);
      setEditingCategory(null);
      setError('');
      console.log('カテゴリ編集完了');
    } catch (error) {
      console.error('カテゴリの編集エラー:', error);
      setError('カテゴリの編集に失敗しました');
    }
  };

  // カテゴリの削除処理
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('カテゴリの削除エラー:', error);
      setError('カテゴリの削除に失敗しました');
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div 
          className="flex justify-between items-center cursor-pointer mb-4"
          onClick={toggleAccordion}
        >
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''} mr-2`}>▶</span>
            📚 教科カテゴリ
            <span className="ml-2 text-sm text-gray-500">({categories.length})</span>
          </h2>
        </div>
        
        {isExpanded && (
          <>
            <div className="flex justify-start mb-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditing) {
                    setIsEditing(false);
                    setEditingCategory(null);
                    setNewCategoryName('');
                    setSelectedColor(PRESET_COLORS[0]);
                  } else {
                    toggleAddForm();
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                {isEditing ? '編集キャンセル' : isAdding ? 'キャンセル' : '+ 追加'}
              </button>
            </div>
            
            {error && (
              <div className="mb-4 mt-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {(isAdding || isEditing) && (
              <form onSubmit={isEditing ? handleUpdateCategory : handleAddCategory} className="mb-4 mt-4 p-3 bg-gray-50 rounded">
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
                
                <div className="flex space-x-2">
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    {isEditing ? '更新' : '追加'}
                  </button>
                  
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditingCategory(null);
                        setNewCategoryName('');
                        setSelectedColor(PRESET_COLORS[0]);
                      }}
                      className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
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
                      onClick={() => startEditCategory(category)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      title="編集"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => confirmDeleteCategory(category)}
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
      
      {/* 削除確認ダイアログ */}
      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        title="カテゴリの削除"
        message={categoryToDelete ? `"${categoryToDelete.name}"を削除しますか？この操作は元に戻せません。` : ''}
        onConfirm={handleDeleteCategory}
        onCancel={cancelDeleteCategory}
      />
    </>
  );
};

export default CategoryManager;