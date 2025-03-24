// src/contexts/AchievementContext.js

// 実績管理のための専用コンテキスト
// このコンテキストは学習実績の記録・取得・分析を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useSchedule } from './ScheduleContext';
import { 
  formatDateToString, 
  getWeekStartDate, 
  getWeekIdentifier,
  generateScheduleKey
} from '../utils/timeUtils';

// 実績ステータスの定義
export const ACHIEVEMENT_STATUS = {
  COMPLETED: 'completed',  // 完了
  PARTIAL: 'partial',      // 部分的に完了
  FAILED: 'failed'         // 失敗・未達成
};

// 実績アイコンの定義
export const ACHIEVEMENT_ICONS = {
  [ACHIEVEMENT_STATUS.COMPLETED]: { icon: '◎', color: 'text-white', title: '完了' },
  [ACHIEVEMENT_STATUS.PARTIAL]: { icon: '△', color: 'text-white', title: '部分的' },
  [ACHIEVEMENT_STATUS.FAILED]: { icon: '✗', color: 'text-white', title: '未達成' },
  default: { icon: '-', color: 'text-white', title: '未記録' }
};

// コンテキスト作成
const AchievementContext = createContext();

// 実績コンテキストを使用するためのカスタムフック
export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
};

export const AchievementProvider = ({ children }) => {
  const { currentUser, demoMode } = useAuth();
  const { getDateSpecificData, setDocument } = useFirestore();
  const { schedule, selectedWeek } = useSchedule();
  
  const [achievements, setAchievements] = useState({});
  // 実績ベースの集計フラグ
  // false: すべての予定を集計に含める（デフォルト値）
  // true: 実績のある予定のみを集計に含める
  const [includeAchievementsInStats, setIncludeAchievementsInStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 実績のキー生成には共通の関数を使用
  const generateUniqueKey = useCallback((date, dayKey, hourKey) => {
    if (!date || !dayKey || !hourKey) {
      console.error('実績キー生成に無効なパラメータ:', { date, dayKey, hourKey });
      throw new Error('実績キー生成に必要なパラメータが不足しています');
    }
    
    // 日付を強制的に正規化
    let normalizedDate;
    try {
      if (typeof date === 'string') {
        normalizedDate = new Date(date);
      } else if (date instanceof Date) {
        normalizedDate = new Date(date.getTime());
      } else if (date && typeof date === 'object' && 'seconds' in date) {
        // Firestoreタイムスタンプなどの場合
        normalizedDate = new Date(date.seconds * 1000);
      } else {
        console.error('未知の日付タイプ:', date);
        normalizedDate = new Date();
      }
      
      // 日付が有効か確認
      if (isNaN(normalizedDate.getTime())) {
        console.error('無効な日付:', date);
        normalizedDate = new Date();
      }
      
      // 時刻部分を確実にリセット
      normalizedDate.setHours(0, 0, 0, 0);
      
      // timeUtils.jsの共通関数を使用する前に日付を正規化
      return generateScheduleKey(normalizedDate, dayKey, hourKey);
    } catch (error) {
      console.error('実績キー生成エラー:', error, { date, dayKey, hourKey });
      throw error;
    }
  }, []);

  // 週の実績を取得する関数
  const fetchAchievements = useCallback(async (weekStart = null) => {
    const targetWeek = weekStart || selectedWeek;
    const normalizedStartDate = getWeekStartDate(targetWeek);
    const weekKey = getWeekIdentifier(normalizedStartDate);
    
    setLoading(true);
    setError(null);
    
    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsedAchievements = JSON.parse(storedData);
            setAchievements(parsedAchievements);
            return parsedAchievements;
          } catch (parseError) {
            console.error('実績データのパースエラー:', parseError);
          }
        }
        
        // データがない場合は空のオブジェクトを設定
        setAchievements({});
        return {};
      }
      
      // 認証済みユーザーの場合はFirestoreから取得
      if (currentUser) {
        const achievementsData = await getDateSpecificData('achievements', weekKey);
        
        if (!achievementsData) {
          setAchievements({});
          return {};
        }
        
        // 日付データを正規化
        const processedAchievements = {};
        
        // オブジェクトをループして処理
        Object.entries(achievementsData).forEach(([key, achievement]) => {
          if (!achievement) return;
          
          // 日付をDateオブジェクトに変換
          if (achievement.date) {
            if (typeof achievement.date === 'string') {
              achievement.date = new Date(achievement.date);
            } else if (achievement.date.toDate) {
              // Firestoreのタイムスタンプの場合
              achievement.date = achievement.date.toDate();
            }
          }
          
          processedAchievements[key] = achievement;
        });
        
        setAchievements(processedAchievements);
        return processedAchievements;
      }
      
      // 未認証かつデモモードでない場合は空のオブジェクトを返す
      setAchievements({});
      return {};
    } catch (error) {
      console.error('実績データ取得エラー:', error);
      setError('実績データの取得中にエラーが発生しました。');
      setAchievements({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, selectedWeek, getDateSpecificData]);

  // 実績を保存する関数
  const saveAchievement = useCallback(async (uniqueKey, status, comment = '') => {
    if (!uniqueKey || !status) {
      setError('実績の保存に必要なデータが不足しています。');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // キーから日付情報を抽出
      const [dateStr, dayKey, hourKey] = uniqueKey.split('_');
      if (!dateStr || !dayKey || !hourKey) {
        throw new Error('無効な実績キー形式です: ' + uniqueKey);
      }
      
      // 週の開始日を取得
      const itemDate = new Date(dateStr);
      const weekStart = getWeekStartDate(itemDate);
      const weekKey = getWeekIdentifier(weekStart);
      
      // 新しい実績データ
      const newAchievement = {
        id: `achievement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status,
        comment,
        dayKey,
        hourKey,
        date: itemDate,
        createdAt: new Date()
      };
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        
        // 現在の実績データを取得
        const storedAchievements = localStorage.getItem(storageKey);
        let currentAchievements = storedAchievements ? JSON.parse(storedAchievements) : {};
        
        // 実績データを更新
        console.log(`保存する実績キー: ${uniqueKey}`);
        console.log(`保存する実績ステータス: ${status}`);
        currentAchievements[uniqueKey] = newAchievement;
        
        // ローカルストレージに保存
        localStorage.setItem(storageKey, JSON.stringify(currentAchievements));
        
        // ステートの更新
        setAchievements(prev => ({
          ...prev,
          [uniqueKey]: newAchievement
        }));
        
        return newAchievement;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        // 現在の実績データを取得
        let currentAchievements = await getDateSpecificData('achievements', weekKey) || {};
        
        // 実績データを更新
        console.log(`Firestoreに保存: キー=${uniqueKey}、状態=${status}`);
        currentAchievements[uniqueKey] = newAchievement;
        
        // Firestoreに保存
        await setDocument('achievements', weekKey, currentAchievements);
        
        // ステートの更新
        setAchievements(prev => ({
          ...prev,
          [uniqueKey]: newAchievement
        }));
        
        return newAchievement;
      }
      
      return null;
    } catch (error) {
      console.error('実績保存エラー:', error);
      setError('実績の保存中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, getDateSpecificData, setDocument]);

  // 実績を削除する関数
  const deleteAchievement = useCallback(async (uniqueKey) => {
    if (!uniqueKey) {
      setError('実績の削除に必要なデータが不足しています。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // キーから日付情報を抽出
      const [dateStr] = uniqueKey.split('_');
      if (!dateStr) {
        throw new Error('無効な実績キー形式です: ' + uniqueKey);
      }
      
      // 週の開始日を取得
      const itemDate = new Date(dateStr);
      const weekStart = getWeekStartDate(itemDate);
      const weekKey = getWeekIdentifier(weekStart);
      
      // デモモードの場合はローカルストレージから削除
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        
        // 現在の実績データを取得
        const storedAchievements = localStorage.getItem(storageKey);
        if (!storedAchievements) return true;
        
        const currentAchievements = JSON.parse(storedAchievements);
        
        // 実績を削除
        if (uniqueKey in currentAchievements) {
          delete currentAchievements[uniqueKey];
          
          // ローカルストレージに保存
          localStorage.setItem(storageKey, JSON.stringify(currentAchievements));
          
          // ステートの更新
          setAchievements(prev => {
            const updated = { ...prev };
            delete updated[uniqueKey];
            return updated;
          });
        }
        
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreから削除
      if (currentUser) {
        // 現在の実績データを取得
        const currentAchievements = await getDateSpecificData('achievements', weekKey);
        if (!currentAchievements) return true;
        
        // 実績を削除
        if (uniqueKey in currentAchievements) {
          delete currentAchievements[uniqueKey];
          
          // Firestoreに保存
          await setDocument('achievements', weekKey, currentAchievements);
          
          // ステートの更新
          setAchievements(prev => {
            const updated = { ...prev };
            delete updated[uniqueKey];
            return updated;
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('実績削除エラー:', error);
      setError('実績の削除中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, getDateSpecificData, setDocument]);

  // 週が変更されたときに実績を取得
  useEffect(() => {
    fetchAchievements(selectedWeek);
  }, [selectedWeek, fetchAchievements]);

  // 実績アイコンを取得する関数
  const getAchievementIcon = useCallback((dayKey, hourKey) => {
    try {
      const scheduleItem = schedule?.[dayKey]?.[hourKey];
      if (!scheduleItem) return ACHIEVEMENT_ICONS.default;
      
      // スケジュールアイテムから日付を取得
      const itemDate = scheduleItem.date;
      if (!itemDate) return ACHIEVEMENT_ICONS.default;
      
      // 実績を検索するためのユニークキーを生成
      const uniqueKey = generateUniqueKey(itemDate, dayKey, hourKey);
      
      // 実績を取得
      const achievement = achievements[uniqueKey];
      
      // 実績のステータスに応じたアイコンを返す
      if (achievement && achievement.status && ACHIEVEMENT_ICONS[achievement.status]) {
        return ACHIEVEMENT_ICONS[achievement.status];
      }
      
      return ACHIEVEMENT_ICONS.default;
    } catch (error) {
      console.error('実績アイコン取得エラー:', error);
      return ACHIEVEMENT_ICONS.default;
    }
  }, [schedule, achievements, generateUniqueKey]);

  // コンテキスト値
  const value = {
    achievements,
    loading,
    error,
    includeAchievementsInStats,
    setIncludeAchievementsInStats,
    fetchAchievements,
    saveAchievement,
    deleteAchievement,
    getAchievementIcon,
    generateUniqueKey,
    ACHIEVEMENT_STATUS, // ステータス定数をエクスポート
    ACHIEVEMENT_ICONS // アイコン定数もエクスポート
  };
  
  // デバッグ用：achievements内のステータス分布を調べる
  useEffect(() => {
    if (Object.keys(achievements).length > 0) {
      const statusCount = { completed: 0, partial: 0, failed: 0, other: 0 };
      
      Object.values(achievements).forEach(achievement => {
        if (achievement && achievement.status) {
          if (statusCount[achievement.status] !== undefined) {
            statusCount[achievement.status]++;
          } else {
            statusCount.other++;
          }
        }
      });
      
      console.log('実績データ統計:', {
        total: Object.keys(achievements).length,
        statusCount,
        sampleKey: Object.keys(achievements)[0],
        sampleValue: achievements[Object.keys(achievements)[0]]
      });
    }
  }, [achievements]);

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};