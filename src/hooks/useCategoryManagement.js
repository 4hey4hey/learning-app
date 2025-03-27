import { useState, useCallback, useContext } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthContext } from '../contexts/AuthContext';
import { COLLECTION_ID } from '../utils/firebase';

export const useCategoryManagement = () => {
  const { currentUser, demoMode } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // デモモード用のデフォルトカテゴリ
  const demoCategories = [
    { id: 'demo-cat-1', name: '国語', color: '#FF5252', createdAt: new Date() },
    { id: 'demo-cat-2', name: '数学', color: '#4CAF50', createdAt: new Date() },
    { id: 'demo-cat-3', name: '英語', color: '#2196F3', createdAt: new Date() },
    { id: 'demo-cat-4', name: '理科', color: '#FFC107', createdAt: new Date() },
    { id: 'demo-cat-5', name: '社会', color: '#9C27B0', createdAt: new Date() }
  ];

  const defaultCategories = [
    { id: 'default-cat-1', name: '記憶', color: '#3498db', createdAt: new Date() },
    { id: 'default-cat-2', name: '問題演習', color: '#e74c3c', createdAt: new Date() },
    { id: 'default-cat-3', name: '読書', color: '#2ecc71', createdAt: new Date() }
  ];

  // カテゴリ取得
  const fetchCategories = useCallback(async () => {
    if (!currentUser && !demoMode) return [];
    
    try {
      setLoading(true);
      
      // デモモード処理
      if (demoMode) {
        const savedCategories = JSON.parse(localStorage.getItem('studyCategories') || '[]');
        const categoriesResult = savedCategories.length > 0 
          ? savedCategories 
          : demoCategories;
        
        if (savedCategories.length === 0) {
          localStorage.setItem('studyCategories', JSON.stringify(demoCategories));
        }
        
        setCategories(categoriesResult);
        return categoriesResult;
      }
      
      // Firestore処理
      const categoriesRef = collection(db, `${COLLECTION_ID}/users/${currentUser.uid}/categories`);
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // デフォルトカテゴリの追加処理
      if (categoriesData.length === 0) {
        const addPromises = defaultCategories.map(category => 
          addDoc(categoriesRef, {
            name: category.name,
            color: category.color,
            createdAt: serverTimestamp()
          })
        );
        
        const results = await Promise.all(addPromises);
        const newCategories = defaultCategories.map((category, index) => ({
          id: results[index].id,
          name: category.name,
          color: category.color,
          createdAt: new Date()
        }));
        
        setCategories(newCategories);
        return newCategories;
      }
      
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode]);

  // カテゴリ追加
  const addCategory = async (name, color) => {
    if (!currentUser && !demoMode) return null;
    
    // デモモード処理
    if (demoMode) {
      const newId = `demo-cat-${Date.now()}`;
      const newCategory = {
        id: newId,
        name,
        color,
        createdAt: new Date()
      };
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      try {
        localStorage.setItem('studyCategories', JSON.stringify(updatedCategories));
      } catch (error) {
        console.error('カテゴリ保存エラー:', error);
      }
      
      return newId;
    }
    
    // Firestore処理
    try {
      const categoriesRef = collection(db, `${COLLECTION_ID}/users/${currentUser.uid}/categories`);
      const docRef = await addDoc(categoriesRef, {
        name,
        color,
        createdAt: serverTimestamp()
      });
      
      const newCategory = {
        id: docRef.id,
        name,
        color,
        createdAt: new Date()
      };
      
      setCategories([...categories, newCategory]);
      return docRef.id;
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      throw error;
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    addCategory
  };
};
