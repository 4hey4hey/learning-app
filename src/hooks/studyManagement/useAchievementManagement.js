import { useState, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { useFirestore } from '../useFirestore';
import { formatDateToString, getWeekStartDate } from '../../utils/timeUtils';

/**
 * 実績管理カスタムフック
 * スケジュールに対する実績を記録、取得する
 */
export const useAchievementManagement = () => {
  const { currentUser } = useAuth();
  const { getDateSpecificData, setDocument, loading: firestoreLoading } = useFirestore();
  const [achievements, setAchievements] = useState({});
  const [loading, setLoading] = useState(false);
  const [includeAchievementsInStats, setIncludeAchievementsInStats] = useState(false);
  
  /**
   * 一意のキーを生成（日付、曜日、時間に基づく）
   * @param {Date|string} date - 日付
   * @param {string} dayKey - 曜日キー
   * @param {string} hourKey - 時間キー
   * @returns {string} 一意のキー
   */
  const generateUniqueKey = (date, dayKey, hourKey) => {
    if (!date || !dayKey || !hourKey) {
      console.error('キー生成に無効なパラメータ:', { date, dayKey, hourKey });
      throw new Error('キー生成に必要なパラメータが不足しています');
    }

    // 日付が文字列なら日付オブジェクトに変換
    const processedDate = typeof date === 'string' ? new Date(date) : date;
    
    // 日付がDateオブジェクトであることを確認
    if (!(processedDate instanceof Date) || isNaN(processedDate)) {
      console.error('無効な日付:', date);
      throw new Error('キー生成のための有効な日付が必要です');
    }
    
    const dateStr = formatDateToString(processedDate);
    return `${dateStr}_${dayKey}_${hourKey}`;
  };

  /**
   * 実績データの取得
   * @param {Date} weekStart - 週の開始日
   * @returns {Promise<Object>} 実績データ
   */
  const fetchAchievements = useCallback(async (weekStart) => {
    if (!weekStart) {
      console.error('週の開始日が指定されていません');
      return {};
    }
    
    setLoading(true);

    try {
      // 週の開始日を取得
      const startDate = getWeekStartDate(weekStart);
      const dateStr = formatDateToString(startDate);
      
      // Firestoreから特定の週の実績データを取得
      const achievementsData = await getDateSpecificData('achievements', dateStr);
      
      // 実績データが存在しない場合は空のオブジェクトを作成
      if (!achievementsData) {
        setAchievements({});
        return {};
      }
      
      // 日付文字列をDateオブジェクトに変換
      const processedAchievements = {};
      
      // Firestoreから取得したデータを処理
      Object.entries(achievementsData).forEach(([key, achievement]) => {
        if (!achievement) return;
        
        // 日付がタイムスタンプまたは文字列の場合はDateオブジェクトに変換
        if (achievement.date) {
          if (typeof achievement.date === 'string') {
            achievement.date = new Date(achievement.date);
          } else if (achievement.date.toDate) {
            achievement.date = achievement.date.toDate();
          }
        }
        
        processedAchievements[key] = achievement;
      });
      
      setAchievements(processedAchievements);
      return processedAchievements;
    } catch (error) {
      console.error('実績データ取得エラー:', error);
      setAchievements({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser, getDateSpecificData]);

  /**
   * 実績の保存
   * @param {string} uniqueKey - 一意キー
   * @param {string} status - 実績ステータス
   * @param {string} comment - 実績コメント
   * @returns {Promise<Object>} 保存された実績データ
   */
  const saveAchievement = useCallback(async (uniqueKey, status, comment = '') => {
    if (!uniqueKey || !status) {
      throw new Error('実績保存に必要なデータが不足しています');
    }

    try {
      setLoading(true);
      
      // キーから日付情報を抽出
      const [dateStr, dayKey, hourKey] = uniqueKey.split('_');
      if (!dateStr || !dayKey || !hourKey) {
        throw new Error('無効な実績キーの形式です: ' + uniqueKey);
      }
      
      // 実績データを作成
      const newAchievement = {
        id: `achievement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status,
        comment,
        dayKey,
        hourKey,
        date: new Date(dateStr),
        createdAt: new Date(),
      };
      
      // 週の開始日を取得
      const startDate = getWeekStartDate(new Date(dateStr));
      const weekDateStr = formatDateToString(startDate);
      
      if (currentUser) {
        // 現在の週の実績データを取得
        let currentAchievements = await getDateSpecificData('achievements', weekDateStr) || {};
        
        // 実績データを更新
        currentAchievements[uniqueKey] = newAchievement;
        
        // Firestoreに保存
        await setDocument('achievements', weekDateStr, currentAchievements);
        
        // ローカルステートを更新
        setAchievements(prevAchievements => ({
          ...prevAchievements,
          [uniqueKey]: newAchievement
        }));
        
        return newAchievement;
      }
      
      // デモモードでもログインしていない場合も実績を返す
      // ローカルステートのみ更新
      setAchievements(prevAchievements => ({
        ...prevAchievements,
        [uniqueKey]: newAchievement
      }));
      
      return newAchievement;
    } catch (error) {
      console.error('実績データ保存エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, getDateSpecificData, setDocument]);

  return {
    achievements,
    loading: loading || firestoreLoading,
    includeAchievementsInStats,
    setIncludeAchievementsInStats,
    fetchAchievements,
    saveAchievement
  };
};
