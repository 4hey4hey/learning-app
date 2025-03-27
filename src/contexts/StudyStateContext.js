// src/contexts/StudyStateContext.js

// 共有状態管理のためのコンテキスト
// このコンテキストは複数の機能コンテキスト間で共有される状態を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCategory } from './CategoryContext';
import { useSchedule } from './ScheduleContext';
import { useAchievement } from './AchievementContext';
import { useTemplate } from './TemplateContext';
import { calculateCategoryHours, calculateWeekStudyHours, calculateTotalStudyHours } from '../utils/timeUtils';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { calculateTotalHours } from '../hooks/useTotalStudyHours';

// コンテキスト作成
const StudyStateContext = createContext();

// 共有状態コンテキストを使用するためのカスタムフック
export const useStudyState = () => {
  const context = useContext(StudyStateContext);
  if (!context) {
    throw new Error('useStudyState must be used within a StudyStateProvider');
  }
  return context;
};

export const StudyStateProvider = ({ children }) => {
  // 共有状態
  const [isLoading, setIsLoading] = useState(true); // データロード中は初期値をtrueに設定
  const [error, setError] = useState(null);
  const { getAllDocuments } = useFirestore();
  const { currentUser, demoMode } = useAuth();
  const [allSchedules, setAllSchedules] = useState({});
  const [allAchievements, setAllAchievements] = useState({});
  const [totalStudyHours, setTotalStudyHours] = useState(0);
  
  // 全期間データを管理する状態
  const [allTimeData, setAllTimeData] = useState({
    totalHours: 0,
    completedCount: 0,
    partialCount: 0,
    totalCount: 0
  });
  const [allTimeLoading, setAllTimeLoading] = useState(true);
  const [allTimeError, setAllTimeError] = useState(null);
  
  // 全期間データを取得する関数
  const fetchAllTimeData = useCallback(async () => {
    if (!currentUser && !demoMode) {
      setAllTimeLoading(false);
      return;
    }

    setAllTimeLoading(true);
    setAllTimeError(null);

    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        // デモモード処理
        // ...
        setAllTimeLoading(false);
        return;
      }
      
      // Firestore からデータを取得
      const firestoreSchedules = {};
      const firestoreAchievements = {};
      
      // スケジュールデータの取得
      const schedulesRef = collection(db, `users/${currentUser.uid}/schedules`);
      const schedulesSnapshot = await getDocs(schedulesRef);
      
      schedulesSnapshot.forEach(doc => {
        firestoreSchedules[doc.id] = doc.data();
      });
        
      // 実績データの取得
      const achievementsRef = collection(db, `users/${currentUser.uid}/achievements`);
      const achievementsSnapshot = await getDocs(achievementsRef);
      
      achievementsSnapshot.forEach(doc => {
        firestoreAchievements[doc.id] = doc.data();
      });
      
      // 手動で実績データを処理
      let manualCompletedCount = 0;
      let manualPartialCount = 0;
      let manualTotalCount = 0;
      
      // 各週の実績データを確認
      Object.values(firestoreAchievements).forEach(weekData => {
        if (!weekData) return;
        
        Object.entries(weekData).forEach(([key, achievement]) => {
          if (key === 'updatedAt' || !achievement || !achievement.status) return;
          
          manualTotalCount++;
          if (achievement.status === 'completed') {
            manualCompletedCount++;
          } else if (achievement.status === 'partial') {
            manualPartialCount++;
          }
        });
      });
      
      // 実際に関数を使って計算
      const totalHours = calculateTotalStudyHours(firestoreSchedules, firestoreAchievements, true);
      
      // 独自実装の計算関数を使用
      const backupTotalHours = calculateTotalHours(firestoreSchedules, firestoreAchievements, true);
      
      // 全ての実績データの合計を計算
      let calculatedTotalHours = totalHours;
      if (calculatedTotalHours === 0) {
        // 独自実装の計算結果があればそれを使用
        if (backupTotalHours > 0) {
          calculatedTotalHours = backupTotalHours;
        }
        // それでもゼロなら手動カウントの値を使用
        else if (manualCompletedCount > 0 || manualPartialCount > 0) {
          // 1実績=1時間として計算
          calculatedTotalHours = manualCompletedCount + manualPartialCount;
        }
      }
      
      setAllTimeData({
        totalHours: calculatedTotalHours,
        completedCount: manualCompletedCount,
        partialCount: manualPartialCount,
        totalCount: manualTotalCount
      });
      
    } catch (error) {
      console.error('全期間データ取得エラー:', error);
      setAllTimeError('データの取得中にエラーが発生しました。');
    } finally {
      setAllTimeLoading(false);
    }
  }, [currentUser, demoMode]);
  
  // 初回マウント時に全期間データを取得
  useEffect(() => {
    fetchAllTimeData();
  }, [fetchAllTimeData]);
  
  // データを再取得中かどうかを追跡するref（コンポーネントのトップレベルで定義）
  const isRefreshing = useRef(false);
  // 初回レンダリングかどうかを追跡するref
  const isFirstRender = useRef(true);
  
  // 各機能コンテキストからデータを取得
  const { categories, loading: categoriesLoading } = useCategory();
  const { schedule, selectedWeek, loading: scheduleLoading } = useSchedule();
  const { 
    achievements, 
    includeAchievementsInStats, 
    setIncludeAchievementsInStats,
    loading: achievementsLoading
  } = useAchievement();
  const { templates, loading: templatesLoading } = useTemplate();
  
  // 実績データ変更イベントをリッスン
  useEffect(() => {
    const handleAchievementDataChanged = async () => {
      // 実績データの再取得は行わず、現在のデータから再計算する
      
      // 学習時間を計算
      const total = calculateTotalStudyHours(
        allSchedules,
        allAchievements,
        includeAchievementsInStats
      );
      setTotalStudyHours(total);
    };
    
    // イベントリスナーを追加
    window.addEventListener('achievementDataChanged', handleAchievementDataChanged);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('achievementDataChanged', handleAchievementDataChanged);
    };
  }, [includeAchievementsInStats, allSchedules, allAchievements]);
  
  // 全てのデータがロードされたか確認
  useEffect(() => {
    // 各コンテキストのローディング状態を確認
    const allLoaded = !categoriesLoading && !scheduleLoading && !achievementsLoading && !templatesLoading;
    
    // 全てのデータがロードされた場合はローディング状態を解除
    if (allLoaded) {
      setIsLoading(false);
    }
  }, [categoriesLoading, scheduleLoading, achievementsLoading, templatesLoading]);
  
  // 実績データを再取得する関数
  const refreshAchievementData = useCallback(async () => {
    try {
      const achievements = await getAllDocuments('achievements');
      return achievements || {};
    } catch (err) {
      console.error('実績データ再取得エラー:', err);
      return {};
    }
  }, [getAllDocuments]);

  // 全てのスケジュールと実績データを取得
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 全てのスケジュールを取得
        const schedules = await getAllDocuments('schedules');
        setAllSchedules(schedules || {});
        
        // 全ての実績を取得
        const achievements = await getAllDocuments('achievements');
        setAllAchievements(achievements || {});
      } catch (err) {
        console.error('データ取得エラー:', err);
      }
    };
    
    // ログイン状態になったらデータの取得を開始
    if (!categoriesLoading && !scheduleLoading && !achievementsLoading) {
      fetchAllData();
    }
  }, [getAllDocuments, categoriesLoading, scheduleLoading, achievementsLoading]);
  
  // 全期間の学習時間を計算
  useEffect(() => {
    // 学習時間計算処理
    const processStudyHours = () => {
      if (Object.keys(allSchedules).length > 0) {
        // 通常の計算を実行
        const total = calculateTotalStudyHours(
          allSchedules,
          allAchievements,
          includeAchievementsInStats
        );
        setTotalStudyHours(total);
      }
    };

    // 通常の計算処理を実行
    processStudyHours();

    // 必要な場合のみ実績データを再取得
    const refreshAchievementDataIfNeeded = async () => {
      // 初回レンダリング時はスキップ
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      
      // 既に再取得中ならスキップ
      if (isRefreshing.current) {
        return;
      }

      // 実績データが必要で、不足している場合のみ再取得
      if (includeAchievementsInStats && 
          Object.keys(allAchievements).length === 0 && 
          Object.keys(allSchedules).length > 0) {
        
        isRefreshing.current = true; // 再取得中フラグをセット

        try {
          const achievements = await refreshAchievementData();
          
          if (achievements && Object.keys(achievements).length > 0) {
            // 実績データをそのまま設定する（変換せずに）
            setAllAchievements(achievements);
            
            // 再計算が必要になるため、次のレンダリングサイクルでtotalStudyHoursが更新される
          }
        } catch (error) {
          console.error('実績データ再取得エラー:', error);
        } finally {
          // 処理完了後にフラグをリセット
          setTimeout(() => {
            isRefreshing.current = false;
          }, 1000); // 少し遅延させて確実にフラグをリセット
        }
      }
    };

    // 実績データ再取得を非同期で実行 (メインの計算処理と分離)
    refreshAchievementDataIfNeeded();

  }, [allSchedules, allAchievements, includeAchievementsInStats, refreshAchievementData]);
  
  // スケジュール変更時にデータを再取得
  useEffect(() => {
    if (schedule && Object.keys(schedule).length > 0) {
      // スケジュール変更があれば、すべてのスケジュールを再取得
      getAllDocuments('schedules').then(schedules => {
        if (schedules) {
          setAllSchedules(schedules);
        }
      });
    }
  }, [schedule, getAllDocuments]);

  // カテゴリ別学習時間の計算
  const categoryHours = useMemo(() => {
    return calculateCategoryHours(
      schedule, 
      categories, 
      achievements, 
      includeAchievementsInStats
    );
  }, [schedule, categories, achievements, includeAchievementsInStats]);

  // 週間総学習時間の計算
  const weekTotalHours = useMemo(() => {
    return calculateWeekStudyHours(
      schedule, 
      achievements, 
      includeAchievementsInStats
    );
  }, [schedule, achievements, includeAchievementsInStats]);

  // 直接値を設定する関数
  const setAchievementsInStats = useCallback((value) => {
    setIncludeAchievementsInStats(value);
  }, [setIncludeAchievementsInStats]);

  // 統計設定の切り替え（実績ベースの統計表示）
  // includeAchievementsInStatsの値を切り替える
  // false: すべての予定を集計に含める（デフォルト）
  // true: 実績のある項目のみを集計に含める
  const toggleAchievementsInStats = useCallback((value) => {
    const newValue = typeof value === 'boolean' ? value : !includeAchievementsInStats;
    setIncludeAchievementsInStats(newValue);
  }, [includeAchievementsInStats, setIncludeAchievementsInStats]);

  // コンテキスト値のメモ化
  const value = useMemo(() => ({
    // データ
    categories: categories || [],
    schedule: schedule || {},
    achievements: achievements || {},
    templates: templates || [],
    selectedWeek,
    
    // 統計
    categoryHours,
    weekTotalHours,
    totalStudyHours,
    includeAchievementsInStats,
    
    // 状態
    isLoading,
    error,
    
    // 関数
    toggleAchievementsInStats,
    setAchievementsInStats,
    refreshAchievementData,
    setError,
    setIsLoading,
    
    // 全期間データ
    allTimeData,
    allTimeLoading,
    allTimeError,
    refreshAllTimeData: fetchAllTimeData
  }), [
    categories,
    schedule,
    achievements,
    templates,
    selectedWeek,
    categoryHours,
    weekTotalHours,
    totalStudyHours,
    includeAchievementsInStats,
    isLoading,
    error,
    toggleAchievementsInStats,
    setAchievementsInStats,
    refreshAchievementData,
    allTimeData,
    allTimeLoading,
    allTimeError,
    fetchAllTimeData
  ]);

  return (
    <StudyStateContext.Provider value={value}>
      {children}
    </StudyStateContext.Provider>
  );
};