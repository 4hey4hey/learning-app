import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// カテゴリのデフォルトデータ
const DEFAULT_CATEGORIES = [
  { name: '国語', color: '#FF5252' },
  { name: '数学', color: '#4CAF50' },
  { name: '英語', color: '#2196F3' },
  { name: '理科', color: '#FFC107' },
  { name: '社会', color: '#9C27B0' }
];

export const CategoryContext = createContext();

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryはCategoryProviderの内部で使用してください');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // カテゴリの取得
  const fetchCategories = useCallback(async () => {
    if (!currentUser) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const categoriesRef = collection(db, `users/${currentUser.uid}/categories`);
      const q = query(categoriesRef);

      const querySnapshot = await getDocs(q);
      
      const fetchedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCategories(fetchedCategories);
      return fetchedCategories;
    } catch (error) {
      setError('カテゴリの取得に失敗しました。');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 初期カテゴリの作成
  const createInitialCategories = useCallback(async () => {
    if (!currentUser) return;

    const categoriesRef = collection(db, `users/${currentUser.uid}/categories`);

    for (const category of DEFAULT_CATEGORIES) {
      const newCategoryRef = doc(categoriesRef);
      await setDoc(newCategoryRef, {
        ...category,
        createdAt: serverTimestamp()
      });
    }

    await fetchCategories();
  }, [currentUser, fetchCategories]);

  // 新規カテゴリの追加
  const addCategory = useCallback(async (categoryData) => {
    if (!currentUser) {
      setError('ユーザーが認証されていません');
      return null;
    }

    try {
      const categoriesRef = collection(db, `users/${currentUser.uid}/categories`);
      const newCategoryRef = doc(categoriesRef);
      
      await setDoc(newCategoryRef, {
        ...categoryData,
        createdAt: serverTimestamp()
      });

      await fetchCategories();
      return newCategoryRef.id;
    } catch (error) {
      setError('カテゴリの追加に失敗しました');
      return null;
    }
  }, [currentUser, fetchCategories]);

  // カテゴリの更新
  const updateCategory = useCallback(async (categoryId, updatedData) => {
    if (!currentUser) {
      setError('ユーザーが認証されていません');
      return false;
    }

    try {
      const categoryRef = doc(db, `users/${currentUser.uid}/categories`, categoryId);
      
      await setDoc(categoryRef, updatedData, { merge: true });
      
      await fetchCategories();
      return true;
    } catch (error) {
      setError('カテゴリの更新に失敗しました');
      return false;
    }
  }, [currentUser, fetchCategories]);

  // カテゴリの削除
  const deleteCategory = useCallback(async (categoryId) => {
    if (!currentUser) {
      setError('ユーザーが認証されていません');
      return false;
    }

    try {
      const categoryRef = doc(db, `users/${currentUser.uid}/categories`, categoryId);
      
      await deleteDoc(categoryRef);
      
      await fetchCategories();
      return true;
    } catch (error) {
      setError('カテゴリの削除に失敗しました');
      return false;
    }
  }, [currentUser, fetchCategories]);

  // 初回レンダリング時にカテゴリを取得
  useEffect(() => {
    if (currentUser) {
      const checkAndCreateCategories = async () => {
        const existingCategories = await fetchCategories();
        
        if (existingCategories.length === 0) {
          await createInitialCategories();
        }
      };

      checkAndCreateCategories();
    }
  }, [currentUser, fetchCategories, createInitialCategories]);

  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    createInitialCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};