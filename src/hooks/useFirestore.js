import { useState, useCallback, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

export const useFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // エラーハンドリングの共通関数
  const handleFirestoreError = (error) => {
    console.error('Firestoreエラー:', error);
    const errorMessages = {
      'permission-denied': 'アクセス権限がありません',
      'not-found': 'データが見つかりません',
      'network-request-failed': 'ネットワーク接続に問題があります'
    };
    return errorMessages[error.code] || '予期せぬエラーが発生しました';
  };

  // コレクションパス生成（useMemoを使用して最適化）
  const buildCollectionPath = useMemo(() => {
    return (collectionPath) => {
      return `users/${currentUser?.uid}/${collectionPath}`;
    };
  }, [currentUser]);

  // データの日付をサニタイズする関数
  const sanitizeDates = useCallback((data) => {
    if (!data) return data;
    
    // オブジェクトでない場合はそのまま返す
    if (typeof data !== 'object') return data;
    
    // 配列の場合は各要素を再帰的に処理
    if (Array.isArray(data)) {
      return data.map(item => sanitizeDates(item));
    }
    
    // Dateオブジェクトを安全な形式に変換
    const result = {};
    
    for (const key in data) {
      const value = data[key];
      
      if (value instanceof Date) {
        // 日付が有効か確認
        if (isNaN(value.getTime())) {
          // 無効な日付は現在時刻に置き換え
          console.warn(`無効な日付を修正しました: ${key}`);
          result[key] = new Date();
        } else {
          result[key] = value;
        }
      } else if (value && typeof value === 'object') {
        // ネストしたオブジェクトや配列は再帰的に処理
        result[key] = sanitizeDates(value);
      } else {
        // その他の値はそのまま返す
        result[key] = value;
      }
    }
    
    return result;
  }, []);

  // コレクションからデータ取得
  const getCollection = useCallback(async (collectionPath, queryConstraints = []) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const fullPath = buildCollectionPath(collectionPath);
      const collectionRef = collection(db, fullPath);
      
      const querySnapshot = await getDocs(collectionRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath]);

  // 日付固有のデータ取得
  const getDateSpecificData = useCallback(async (collectionName, dateStr) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPath = buildCollectionPath(collectionName);
      const docRef = doc(db, fullPath, dateStr);
      const docSnap = await getDoc(docRef);

      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath]);

  // 期間指定のスケジュールデータ取得
  const getSchedulesByDateRange = useCallback(async (startDate, endDate) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // weekIdベースで必要な週のスケジュールを特定する
      // 正規化した日付の形式（YYYY-MM-DD）から最初の週の月曜日を計算
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      
      // スタート日の週の月曜日を計算
      const firstDayOfStartWeek = new Date(normalizedStartDate);
      const dayOfWeek = firstDayOfStartWeek.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 日曜日は-6、それ以外は1-曜日
      firstDayOfStartWeek.setDate(normalizedStartDate.getDate() + diff);
      
      // 必要な週IDを生成する関数
      const getWeekId = (date) => {
        const weekStartDate = new Date(date);
        const day = weekStartDate.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStartDate.setDate(date.getDate() + diff);
        weekStartDate.setHours(0, 0, 0, 0);
        
        return `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;
      };
      
      // 期間内のすべての週IDを生成
      const weekIds = [];
      let currentDate = new Date(firstDayOfStartWeek);
      
      while (currentDate <= normalizedEndDate) {
        const weekId = getWeekId(currentDate);
        if (!weekIds.includes(weekId)) {
          weekIds.push(weekId);
        }
        // 次の週に進む
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      // 各週のスケジュールを取得
      const schedulesPath = buildCollectionPath('schedules');
      const scheduleData = {};
      
      for (const weekId of weekIds) {
        try {
          const scheduleRef = doc(db, schedulesPath, weekId);
          const docSnap = await getDoc(scheduleRef);
          
          if (docSnap.exists()) {
            scheduleData[weekId] = docSnap.data();
          }
        } catch (error) {
          console.error(`週${weekId}のデータ取得中のエラー:`, error);
        }
      }
      
      return scheduleData;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath]);

  // 期間指定の達成状況データ取得
  const getAchievementsByDateRange = useCallback(async (startDate, endDate) => {
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
      
      // Firestoreのタイムスタンプに変換
      const startTimestamp = Timestamp.fromDate(normalizedStartDate);
      const endTimestamp = Timestamp.fromDate(normalizedEndDate);
      
      // クエリを作成
      const achievementsPath = buildCollectionPath('achievements');
      const q = query(
        collection(db, achievementsPath),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      
      // 結果を取得
      const querySnapshot = await getDocs(q);
      const achievements = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        achievements[doc.id] = {
          id: doc.id,
          ...data
        };
      });
      
      return achievements;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath]);

  // ドキュメントの追加または更新
  const setDocument = useCallback(async (collectionPath, documentId, data) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const fullPath = buildCollectionPath(collectionPath);
      
      if (documentId) {
        const docRef = doc(db, fullPath, documentId);
        
        // データの日付をサニタイズ
        const sanitizedData = sanitizeDates(data);
        
        await setDoc(docRef, {
          ...sanitizedData,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return documentId;
      }

      const collectionRef = collection(db, fullPath);
      
      // データの日付をサニタイズ
      const sanitizedData = sanitizeDates(data);
      
      const docRef = await addDoc(collectionRef, {
        ...sanitizedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath, sanitizeDates]);

  // ドキュメントの削除
  const deleteDocument = useCallback(async (collectionPath, documentId) => {
    if (!currentUser) {
      setError(new Error('ユーザーが認証されていません'));
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const fullPath = buildCollectionPath(collectionPath);
      const docRef = doc(db, fullPath, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      const errorMessage = handleFirestoreError(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildCollectionPath, sanitizeDates]);

  return {
    getCollection,
    getDateSpecificData,
    getSchedulesByDateRange,
    getAchievementsByDateRange,
    setDocument,
    deleteDocument,
    loading,
    error
  };
};