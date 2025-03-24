// src/contexts/StudyStateContext.js

// 共有状態管理のためのコンテキスト
// このコンテキストは複数の機能コンテキスト間で共有される状態を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { useCategory } from './CategoryContext';
import { useSchedule } from './ScheduleContext';
import { useAchievement } from './AchievementContext';
import { useTemplate } from './TemplateContext';
import { calculateCategoryHours, calculateWeekStudyHours } from '../utils/timeUtils';

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
  
  // 全てのデータがロードされたか確認
  useEffect(() => {
    // 各コンテキストのローディング状態を確認
    const allLoaded = !categoriesLoading && !scheduleLoading && !achievementsLoading && !templatesLoading;
    
    // 全てのデータがロードされた場合はローディング状態を解除
    if (allLoaded) {
      setIsLoading(false);
    }
  }, [categoriesLoading, scheduleLoading, achievementsLoading, templatesLoading]);

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
  }, []);

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
    includeAchievementsInStats,
    
    // 状態
    isLoading,
    error,
    
    // 関数
    toggleAchievementsInStats,
    setAchievementsInStats,
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
    includeAchievementsInStats,
    isLoading,
    error,
    toggleAchievementsInStats
  ]);

  return (
    <StudyStateContext.Provider value={value}>
      {children}
    </StudyStateContext.Provider>
  );
};