import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { useFirestore } from '../useFirestore';
import { orderBy, serverTimestamp } from 'firebase/firestore';

export const useCategoryManagement = () => {
  const { currentUser } = useAuth();
  const { getCollection, setDocument, deleteDocument, loading: firestoreLoading } = useFirestore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初期カテゴリ
  const defaultCategories = [
    { name: '国語', color: '#FF5252' },
    { name: '数学', color: '#4CAF50' },
    { name: '英語', color: '#2196F3' },
    { name: '理科', color: '#FFC107' },
    { name: '社会', color: '#9C27B0' }
  ];

  const getCategoriesPath = useCallback(() => {
    return `users/${currentUser?.uid}/categories`;
  }, [currentUser]);

  const fetchCategories = useCallback(async () => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const categoriesPath = getCategoriesPath();
      const categoriesData = await getCollection(categoriesPath, [
        orderBy('createdAt', 'asc')
      ]);
      
      // カテゴリが空の場合はデフォルトを作成
      if (categoriesData.length === 0) {
        const createdCategories = [];
        
        for (const category of defaultCategories) {
          const categoryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const categoryData = {
            ...category,
            createdAt: serverTimestamp()
          };
          
          await setDocument(categoriesPath, categoryId, categoryData);
          
          createdCategories.push({
            id: categoryId,
            ...categoryData
          });
        }
        
        setCategories(createdCategories);
        return createdCategories;
      }
      
      setCategories(categoriesData);
      return categoriesData;
    } catch (fetchError) {
      console.error('カテゴリ取得エラー:', fetchError);
      setError(fetchError);
      return categories;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCollection, setDocument, categories, getCategoriesPath]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name, color) => {
    // バリデーション
    if (!name || !color) {
      const validationError = new Error('カテゴリ名と色は必須です');
      setError(validationError);
      throw validationError;
    }



    if (!currentUser) {
      const authError = new Error('ユーザーが認証されていません');
      setError(authError);
      throw authError;
    }

    setLoading(true);
    setError(null);
    
    try {
      const categoriesPath = getCategoriesPath();
      const categoryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // カテゴリデータの作成
      const categoryData = {
        name,
        color,
        createdAt: serverTimestamp()
      };
      
      // カテゴリの保存
      await setDocument(categoriesPath, categoryId, categoryData);
      
      // ローカルステートの更新
      const newCategory = {
        id: categoryId,
        ...categoryData
      };
      
      setCategories(prev => [...prev, newCategory]);
      return categoryId;
    } catch (addError) {
      console.error('カテゴリ追加エラー:', addError);
      setError(addError);
      throw addError;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setDocument, categories, getCategoriesPath]);

  const deleteCategory = useCallback(async (categoryId) => {
    // バリデーション
    if (!categoryId) {
      const validationError = new Error('カテゴリIDは必須です');
      setError(validationError);
      throw validationError;
    }



    if (!currentUser) {
      const authError = new Error('ユーザーが認証されていません');
      setError(authError);
      throw authError;
    }

    setLoading(true);
    setError(null);
    
    try {
      const categoriesPath = getCategoriesPath();
      await deleteDocument(categoriesPath, categoryId);
      
      // ローカルステートの更新
      setCategories(prev => prev.filter(category => category.id !== categoryId));
      return true;
    } catch (deleteError) {
      console.error('カテゴリ削除エラー:', deleteError);
      setError(deleteError);
      throw deleteError;
    } finally {
      setLoading(false);
    }
  }, [currentUser, deleteDocument, getCategoriesPath]);

  return {
    categories,
    loading: loading || firestoreLoading,
    error,
    fetchCategories,
    addCategory,
    deleteCategory
  };
};
