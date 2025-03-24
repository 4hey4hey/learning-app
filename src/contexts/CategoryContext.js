// src/contexts/CategoryContext.js

// カテゴリ管理のための専用コンテキスト
// このコンテキストはカテゴリの追加・削除・更新・取得を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

// 初期カテゴリデータ
const DEFAULT_CATEGORIES = [
  { name: '国語', color: '#FF5252' },
  { name: '数学', color: '#4CAF50' },
  { name: '英語', color: '#2196F3' },
  { name: '理科', color: '#FFC107' },
  { name: '社会', color: '#9C27B0' }
];

// コンテキスト作成
const CategoryContext = createContext();

// カテゴリコンテキストを使用するためのカスタムフック
export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { getCollection, setDocument, deleteDocument } = useFirestore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // カテゴリのコレクションパスを取得
  const getCategoriesPath = useCallback(() => {
    if (!currentUser) return null;
    return `users/${currentUser.uid}/categories`;
  }, [currentUser]);

  // カテゴリ一覧の取得
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 認証済みユーザーの場合はFirestoreから取得
      if (currentUser) {
        const categoriesPath = getCategoriesPath();
        const fetchedCategories = await getCollection(categoriesPath);
        
        if (!fetchedCategories || fetchedCategories.length === 0) {
          // カテゴリが存在しない場合はデフォルトカテゴリを作成
          const createdCategories = [];
          
          for (const category of DEFAULT_CATEGORIES) {
            const categoryId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            await setDocument(categoriesPath, categoryId, {
              ...category,
              createdAt: serverTimestamp()
            });
            
            createdCategories.push({
              id: categoryId,
              ...category
            });
          }
          
          setCategories(createdCategories);
          return createdCategories;
        }
        
        setCategories(fetchedCategories);
        return fetchedCategories;
      }
      
      // ユーザーが認証されていない場合は空の配列を返す
      setCategories([]);
      return [];
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      setError('カテゴリの取得中にエラーが発生しました。');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCategoriesPath, getCollection, setDocument]);

  // カテゴリの追加
  const addCategory = useCallback(async (name, color) => {
    if (!name || !color) {
      setError('カテゴリ名と色は必須です。');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const categoryId = `category_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newCategory = {
        id: categoryId,
        name,
        color,
        createdAt: new Date()
      };
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        const categoriesPath = getCategoriesPath();
        
        await setDocument(categoriesPath, categoryId, {
          name,
          color,
          createdAt: serverTimestamp()
        });
        
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
      
      return null;
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      setError('カテゴリの追加中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCategoriesPath, setDocument]);

  // カテゴリの削除
  const deleteCategory = useCallback(async (categoryId) => {
    if (!categoryId) {
      setError('カテゴリIDは必須です。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 認証済みユーザーの場合はFirestoreから削除
      if (currentUser) {
        const categoriesPath = getCategoriesPath();
        await deleteDocument(categoriesPath, categoryId);
        
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('カテゴリ削除エラー:', error);
      setError('カテゴリの削除中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCategoriesPath, deleteDocument]);

  // カテゴリの更新
  const updateCategory = useCallback(async (categoryId, updates) => {
    if (!categoryId || !updates) {
      setError('カテゴリIDと更新データは必須です。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 認証済みユーザーの場合はFirestoreを更新
      if (currentUser) {
        const categoriesPath = getCategoriesPath();
        
        await setDocument(categoriesPath, categoryId, {
          ...updates,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        setCategories(prev => 
          prev.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
      setError('カテゴリの更新中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getCategoriesPath, setDocument]);

  // カテゴリデータの初期化
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // コンテキスト値のメモ化
  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    deleteCategory,
    updateCategory
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};