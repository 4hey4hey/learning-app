import { 
  useState, 
  useCallback 
} from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

export const useFirestore = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFirestoreError = (error) => {
    console.error('Firestoreエラー:', error);
    const errorMessages = {
      'permission-denied': 'アクセス権限がありません',
      'not-found': 'データが見つかりません',
      'network-request-failed': 'ネットワーク接続に問題があります'
    };
    return errorMessages[error.code] || '予期せぬエラーが発生しました';
  };

  const buildCollectionPath = (collectionPath) => {
    return `users/${currentUser?.uid}/${collectionPath}`;
  };

  // コレクション内のすべてのドキュメントを取得するメソッド（配列形式）
  const getCollection = useCallback(async (collectionName) => {
    if (!currentUser) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, `users/${currentUser.uid}/${collectionName}`);
      const q = query(collectionRef);
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`${collectionName} コレクション取得成功:`, documents.length, '件');
      return documents;
    } catch (error) {
      console.error(`${collectionName} コレクション取得エラー:`, error);
      setError(`コレクションの取得中にエラーが発生しました: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // すべてのドキュメントを取得するメソッド（オブジェクト形式）
  const getAllDocuments = useCallback(async (collectionName) => {
    if (!currentUser) {
      return {};
    }

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, `users/${currentUser.uid}/${collectionName}`);
      const q = query(collectionRef);
      const querySnapshot = await getDocs(q);
      
      console.log(`${collectionName} コレクション取得開始: ドキュメント数=${querySnapshot.size}`);
      
      const documents = {};
      querySnapshot.forEach((doc) => {
        documents[doc.id] = doc.data();
      });
      
      console.log(`${collectionName} コレクション取得成功: ドキュメント数=${Object.keys(documents).length}`);
      return documents;
    } catch (error) {
      console.error(`${collectionName} コレクション取得エラー:`, error);
      setError(`コレクションの取得中にエラーが発生しました: ${error.message}`);
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ドキュメントを削除するメソッド
  const deleteDocument = useCallback(async (collectionName, documentId) => {
    if (!currentUser) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, `users/${currentUser.uid}/${collectionName}`, documentId);
      await deleteDoc(docRef);
      console.log(`${collectionName}/${documentId} データ削除成功`);
      return true;
    } catch (error) {
      console.error(`${collectionName}/${documentId} データ削除エラー:`, error);
      setError(`データの削除中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 特定のコレクションのドキュメントを取得するメソッド
  const getDateSpecificData = useCallback(async (collectionName, documentId) => {
    if (!currentUser) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, `users/${currentUser.uid}/${collectionName}`, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log(`${collectionName}/${documentId} データ取得成功:`, docSnap.id);
        return docSnap.data();
      } else {
        console.log(`${collectionName}/${documentId} データが存在しません`);
        return null;
      }
    } catch (error) {
      console.error(`${collectionName}/${documentId} データ取得エラー:`, error);
      setError(`データの取得中にエラーが発生しました: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ドキュメントを作成または更新するメソッド
  const setDocument = useCallback(async (collectionName, documentId, data) => {
    if (!currentUser) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, `users/${currentUser.uid}/${collectionName}`, documentId);
      await setDoc(docRef, data);
      console.log(`${collectionName}/${documentId} データ保存成功`);
      return true;
    } catch (error) {
      console.error(`${collectionName}/${documentId} データ保存エラー:`, error);
      setError(`データの保存中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getSchedulesByDateRange = useCallback(async (startDate, endDate) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return {};
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      
      const getWeekId = (date) => {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(date.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      };

      const weekIds = new Set();
      let currentDate = new Date(normalizedStartDate);
      while (currentDate <= normalizedEndDate) {
        weekIds.add(getWeekId(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }

      const schedules = {};
      
      for (const weekId of weekIds) {
        const scheduleRef = doc(
          db, 
          `users/${currentUser.uid}/schedules`, 
          weekId
        );

        const scheduleSnap = await getDoc(scheduleRef);

        if (scheduleSnap.exists()) {
          schedules[weekId] = scheduleSnap.data();
        }
      }

      return schedules;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getAchievementsByDateRange = useCallback(async (startDate, endDate) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return {};
    }
    
    console.log('実績データ取得開始:', {
      開始日: startDate,
      終了日: endDate
    });

    setLoading(true);
    setError(null);

    try {
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      
      const getWeekId = (date) => {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(date.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      };

      const weekIds = new Set();
      let currentDate = new Date(normalizedStartDate);
      while (currentDate <= normalizedEndDate) {
        weekIds.add(getWeekId(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }

      const achievements = {};
      
      for (const weekId of weekIds) {
        const achievementRef = doc(
          db, 
          `users/${currentUser.uid}/achievements`, 
          weekId
        );

        const achievementSnap = await getDoc(achievementRef);

        if (achievementSnap.exists()) {
          const weekData = achievementSnap.data();
          
          Object.entries(weekData).forEach(([key, achievement]) => {
            const achievementDate = achievement.date instanceof Timestamp 
              ? achievement.date.toDate() 
              : new Date(achievement.date);

            if (
              achievementDate >= normalizedStartDate && 
              achievementDate <= normalizedEndDate
            ) {
              achievements[key] = {
                ...achievement,
                date: achievementDate
              };
            }
          });
        }
      }

      console.log('実績データ取得完了:', {
        件数: Object.keys(achievements).length,
        サンプル: Object.entries(achievements).slice(0, 3).map(([key, data]) => ({
          key,
          categoryId: data.categoryId,
          status: data.status
        }))
      });
      
      return achievements;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      console.error('実績データ取得エラー:', error);
      setError(errorMessage);
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    getSchedulesByDateRange,
    getAchievementsByDateRange,
    getDateSpecificData,
    getDocument: getDateSpecificData,  // 別名で同じ関数を提供
    setDocument,
    getCollection,     // ドキュメントリストを配列で取得
    getAllDocuments,   // ドキュメントをオブジェクトで取得
    deleteDocument,    // ドキュメントを削除するメソッド
    loading,
    error
  };
};