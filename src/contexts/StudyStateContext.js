// src/contexts/StudyStateContext.js

// 共有状態管理のためのコンテキスト
// このコンテキストは複数の機能コンテキスト間で共有される状態を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCategory } from './CategoryContext';
import { useSchedule } from './ScheduleContext';
import { useAchievement } from './AchievementContext';
import { useTemplate } from './TemplateContext';
import { calculateCategoryHours, calculateWeekStudyHours, calculateTotalStudyHours } from '../utils/timeUtils';
import { useFirestore } from '../hooks/useFirestore';

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
  const [allSchedules, setAllSchedules] = useState({});
  const [allAchievements, setAllAchievements] = useState({});
  const [totalStudyHours, setTotalStudyHours] = useState(0);
  
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
      console.log('実績データ変更イベントを受信');
      // 実績データの再取得は行わず、現在のデータから再計算する
      console.log('現在のデータから学習時間を再計算');
      
      // 実績データの詳細をログ出力
      console.log('実績データ詳細:', Object.keys(allAchievements).length, '件');
      
      // 学習時間を計算
      const total = calculateTotalStudyHours(
        allSchedules,
        allAchievements,
        includeAchievementsInStats
      );
      console.log('実績データ変更後の学習時間再計算:', total, '時間');
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
      console.log('実績データ刷新開始');
      const achievements = await getAllDocuments('achievements');
      console.log('実績データ刷新完了:', achievements ? Object.keys(achievements).length : 0, '件');
      
      // 実績データの設定は外部から行うようにし、無限ループを避ける
      // setAllAchievements(achievements || {});
      
      return achievements || {};
    } catch (err) {
      console.error('実績データ刷新エラー:', err);
      return {};
    }
  }, [getAllDocuments]);

  // 全てのスケジュールと実績データを取得
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log('全てのデータの取得開始');
        // 全てのスケジュールを取得
        const schedules = await getAllDocuments('schedules');
        console.log('取得したスケジュール:', schedules ? Object.keys(schedules).length : 0, '件');
        setAllSchedules(schedules || {});
        
        // 全ての実績を取得
        const achievements = await getAllDocuments('achievements');
        console.log('取得した実績:', achievements ? Object.keys(achievements).length : 0, '件');
        
        // 実績データの詳細をログ出力
        if (achievements && Object.keys(achievements).length > 0) {
          const sampleKey = Object.keys(achievements)[0];
          console.log('実績データサンプル:', sampleKey, achievements[sampleKey]);
        }
        
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
        console.log('学習時間計算: スケジュール件数 =', Object.keys(allSchedules).length);
        console.log('学習時間計算: 実績件数 =', Object.keys(allAchievements).length);
        console.log('学習時間計算: 実績ベース表示 =', includeAchievementsInStats);
      
        // 実績データサンプルを出力
        if (Object.keys(allAchievements).length > 0) {
          const sampleKeys = Object.keys(allAchievements).slice(0, 3);
          console.log('実績データサンプルキー:', sampleKeys);
          
          // 実績データの内容を確認
          sampleKeys.forEach(key => {
            console.log(`実績[${key}]:`, allAchievements[key]);
          });
        }
        
        // 通常の計算を実行
        const total = calculateTotalStudyHours(
          allSchedules,
          allAchievements,
          includeAchievementsInStats
        );
        console.log('学習時間計算結果:', total, '時間');
        setTotalStudyHours(total);
      } else {
        console.log('学習時間計算: データなし');
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
        console.log('既に再取得中のためスキップします', isRefreshing.current);
        return;
      }

      // 実績データが必要で、不足している場合のみ再取得
      if (includeAchievementsInStats && 
          Object.keys(allAchievements).length === 0 && 
          Object.keys(allSchedules).length > 0) {
        
        console.log('再取得フラグ設定前:', isRefreshing.current);
        isRefreshing.current = true; // 再取得中フラグをセット
        console.log('再取得フラグ設定後:', isRefreshing.current);

        try {
          console.log('実績データが不足しているため再取得します (一度のみ)');
          const achievements = await refreshAchievementData();
          
          if (achievements && Object.keys(achievements).length > 0) {
            console.log('実績データ再取得成功:', Object.keys(achievements).length, '件');
            
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
            console.log('再取得フラグをリセットしました:', isRefreshing.current);
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
          console.log('スケジュール変更後に再取得しました:', Object.keys(schedules).length, '件');
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
    console.log(`実績設定直接変更: ${value}`);
    setIncludeAchievementsInStats(value);
  }, [setIncludeAchievementsInStats]);

  // 統計設定の切り替え（実績ベースの統計表示）
  // includeAchievementsInStatsの値を切り替える
  // false: すべての予定を集計に含める（デフォルト）
  // true: 実績のある項目のみを集計に含める
  const toggleAchievementsInStats = useCallback((value) => {
    const newValue = typeof value === 'boolean' ? value : !includeAchievementsInStats;
    console.log(`実績設定変更（StudyStateContext）: ${includeAchievementsInStats} -> ${newValue}`);
    setIncludeAchievementsInStats(newValue);
    
    // 変更が確実に反映されるようにログ出力
    setTimeout(() => {
      console.log('実績設定確認（StudyStateContext）:', { 
        newValue,
        currentValue: includeAchievementsInStats
      });
    }, 100);
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
    setIsLoading
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
    refreshAchievementData
  ]);

  return (
    <StudyStateContext.Provider value={value}>
      {children}
    </StudyStateContext.Provider>
  );
};