import { useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, query, getDocs, doc, deleteDoc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { getWeekIdentifier } from '../utils/timeUtils';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from './useAuth';
import { useSchedule } from '../contexts/ScheduleContext';
import { useAchievement } from '../contexts/AchievementContext';

/**
 * データ削除用カスタムフック
 * Firestoreからユーザーの学習データを削除する機能を提供
 */
export const useDataDeletion = () => {
  const { currentUser, demoMode } = useAuth();
  const { showSuccess, showError } = useToast();
  const { fetchSchedule } = useSchedule();
  const { fetchAchievements, resetAchievements } = useAchievement();

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

  /**
   * デモモードの場合のデータ削除処理
   * @param {string} weekId - 週の識別子
   * @private
   */
  const _clearLocalData = useCallback((weekId) => {
    try {
      localStorage.removeItem(`demo_schedules_${weekId}`);
      localStorage.removeItem(`demo_achievements_${weekId}`);
      return true;
    } catch (error) {
      console.error('ローカルデータ削除エラー:', error);
      return false;
    }
  }, []);

  /**
   * Firestoreのデータ削除処理
   * @param {string} weekId - 週の識別子
   * @private
   */
  const _clearFirestoreData = useCallback(async (weekId) => {
    if (!currentUser) return false;
    
    try {
      // スケジュールと実績データのドキュメント参照
      const scheduleDocRef = doc(db, `users/${currentUser.uid}/schedules`, weekId);
      const achievementDocRef = doc(db, `users/${currentUser.uid}/achievements`, weekId);
      
      // 削除前のデータ確認（デバッグ用）
      const beforeScheduleDoc = await getDoc(scheduleDocRef);
      const beforeAchievementDoc = await getDoc(achievementDocRef);
      console.log('削除前データ状態:', {
        スケジュール: beforeScheduleDoc.exists() ? Object.keys(beforeScheduleDoc.data()).length + '項目' : 'なし',
        実績: beforeAchievementDoc.exists() ? Object.keys(beforeAchievementDoc.data()).length + '項目' : 'なし'
      });
      
      // 確実にデータを削除するための処理
      // 1. ドキュメントが存在する場合は削除
      if (beforeScheduleDoc.exists()) {
        try {
          await deleteDoc(scheduleDocRef);
          console.log('スケジュールドキュメントを削除しました');
        } catch (deleteError) {
          console.error('スケジュール削除エラー:', deleteError);
        }
      }
      
      if (beforeAchievementDoc.exists()) {
        try {
          await deleteDoc(achievementDocRef);
          console.log('実績ドキュメントを削除しました');
        } catch (deleteError) {
          console.error('実績削除エラー:', deleteError);
        }
      }
      
      // 2. 空のドキュメントを作成
      await setDoc(scheduleDocRef, {});
      await setDoc(achievementDocRef, {});
      
      // 削除後のデータ確認（デバッグ用）
      const afterScheduleDoc = await getDoc(scheduleDocRef);
      const afterAchievementDoc = await getDoc(achievementDocRef);
      console.log('削除後データ状態:', {
        スケジュール: afterScheduleDoc.exists() ? Object.keys(afterScheduleDoc.data()).length + '項目' : 'なし',
        実績: afterAchievementDoc.exists() ? Object.keys(afterAchievementDoc.data()).length + '項目' : 'なし'
      });
      
      return true;
    } catch (error) {
      console.error('Firestoreデータ削除エラー:', error, {weekId});
      return false;
    }
  }, [currentUser]);

  /**
   * 画面更新処理
   * @param {Date} weekDate - 週の日付
   * @private
   */
  const _refreshUI = useCallback(async (weekDate) => {
    try {
      console.log('データ再取得開始:', { 週: getWeekIdentifier(weekDate) });
      
      // 確実にデータを取得するための処理
      // 1. 状態をリセット
      // 2. 再取得するまで少し待つ
      if (resetAchievements) {
        resetAchievements();
        // 少し待つ
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // データ再取得
      await fetchSchedule(weekDate);
      await fetchAchievements(weekDate);
      
      console.log('データ再取得完了:', { 週: getWeekIdentifier(weekDate) });
      return true;
    } catch (error) {
      console.error('データ再取得エラー:', error);
      return false;
    }
  }, [fetchSchedule, fetchAchievements, resetAchievements]);

  /**
   * 特定の週のスケジュールと実績データをクリア
   * @param {Date} weekDate - クリア対象の週の日付
   * @returns {Promise<boolean>} - 削除成功時はtrue
   */
  const clearWeekData = useCallback(async (weekDate) => {
    try {
      // 週の識別子を取得
      const weekId = getWeekIdentifier(weekDate);
      let success = false;
      
      // モードに応じたデータ削除
      if (demoMode) {
        success = _clearLocalData(weekId);
      } else if (currentUser) {
        success = await _clearFirestoreData(weekId);
      }
      
      // データ削除結果に基づく処理
      if (success) {
        // UIの更新
        await _refreshUI(weekDate);
        showSuccess('今週のデータを削除しました');
        return true;
      } else {
        showError('データの削除に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('週間データ削除エラー:', error);
      showError('データの削除に失敗しました');
      return false;
    }
  }, [currentUser, demoMode, _clearLocalData, _clearFirestoreData, _refreshUI, showSuccess, showError]);

  return {
    deleteScheduleData,
    deleteCollection,
    clearWeekData
  };
};
