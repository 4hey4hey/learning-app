import { useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, query, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * データ削除用カスタムフック
 * Firestoreからユーザーの学習データを削除する機能を提供
 */
export const useDataDeletion = () => {
  const { currentUser, demoMode } = useAuth();

  /**
   * 指定したコレクションからユーザーのデータをすべて削除
   * @param {string} collectionName - 削除対象のコレクション名
   * @returns {Promise<boolean>} - 削除成功時はtrue
   */
  const deleteCollection = useCallback(async (collectionName) => {
    if (demoMode || !currentUser) {
      console.warn('デモモードまたはログインしていないため削除をスキップします');
      return false;
    }

    try {
      // ユーザーのコレクションへの参照
      const collectionRef = collection(db, `users/${currentUser.uid}/${collectionName}`);
      const q = query(collectionRef);
      const querySnapshot = await getDocs(q);

      // 削除するドキュメントが多い場合はバッチ処理を使用
      const batch = writeBatch(db);
      
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, `users/${currentUser.uid}/${collectionName}/${docSnapshot.id}`));
      });

      // バッチ書き込みを実行
      await batch.commit();
      console.log(`${collectionName}コレクションの削除が完了しました`);
      return true;
    } catch (error) {
      console.error(`${collectionName}削除中にエラーが発生しました:`, error);
      throw error;
    }
  }, [currentUser, demoMode]);

  /**
   * スケジュールデータのみを削除
   * @returns {Promise<{success: boolean, message: string}>} - 処理結果
   */
  const deleteScheduleData = useCallback(async () => {
    if (demoMode) {
      return { success: false, message: 'デモモードでは削除機能は使用できません' };
    }

    if (!currentUser) {
      return { success: false, message: 'ログインしていないため削除できません' };
    }

    try {
      // スケジュールのみを削除
      const result = await deleteCollection('schedules');
      
      return { 
        success: result, 
        message: result 
          ? '予定データが正常に削除されました' 
          : '予定データの削除に失敗しました'
      };
    } catch (error) {
      console.error('予定データ削除中にエラーが発生しました:', error);
      return { 
        success: false, 
        message: `削除中にエラーが発生しました: ${error.message}` 
      };
    }
  }, [currentUser, demoMode, deleteCollection]);

  return {
    deleteScheduleData,
    deleteCollection
  };
};
