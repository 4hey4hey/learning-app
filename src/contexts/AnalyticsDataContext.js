import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCategory } from './CategoryContext';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useDateRange } from './DateRangeContext';
import { calculateCategoryHoursByDateRange } from '../utils/analyticsUtils';
import { generateAchievementKey } from '../utils/achievementUtils';
import { normalizeDate } from '../utils/timeUtils';

// コンテキスト作成
const AnalyticsDataContext = createContext();

// カスタムフック
export const useAnalyticsData = () => {
  const context = useContext(AnalyticsDataContext);
  if (!context) {
    throw new Error('useAnalyticsData must be used within an AnalyticsDataProvider');
  }
  return context;
};

export const AnalyticsDataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { categories } = useCategory();
  const { getSchedulesByDateRange, getAchievementsByDateRange } = useFirestore();
  const { startDate, endDate } = useDateRange();

  // データ状態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [achievementData, setAchievementData] = useState({});
  const [categoryStats, setCategoryStats] = useState({ categoryHours: {}, totalHours: 0 });
  const [dailyData, setDailyData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // 前回のフェッチパラメータを追跡して重複呼び出しを防止
  const lastFetchParams = useRef({
    startDate: null,
    endDate: null,
    userId: null,
    categoriesLength: 0
  });
  
  // データ取得中フラグ
  const isFetchingRef = useRef(false);

  // データ取得関数
  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    // 強制更新時は前回のパラメータをリセット
    if (forceRefresh) {
      console.log('強制更新要求が検出されました - キャッシュを無視します');
      // 最終更新時間を一旦nullにセット
      setLastUpdated(null);
    }
    
    // 必要なデータがない場合はスキップ
    if (!currentUser || !startDate || !endDate || categories.length === 0) {
      console.log('必要なデータが不足しているため、分析データの取得をスキップします。');
      return;
    }
    
    // 既にロード中の場合はスキップ
    if (isFetchingRef.current && !forceRefresh) {
      console.log('既にデータを取得中です。リクエストをスキップします。');
      return;
    }
    
    // 前回と同じパラメータでの取得をスキップ（強制更新でない場合）
    const currentParams = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      userId: currentUser.uid,
      categoriesLength: categories.length
    };
    
    // lastFetchParamsが初期化されていない場合は初期化
    if (!lastFetchParams.current.startDate) {
      lastFetchParams.current = {
        startDate: 0,
        endDate: 0,
        userId: '',
        categoriesLength: 0
      };
    }
    
    if (
      !forceRefresh &&
      lastFetchParams.current.startDate === currentParams.startDate &&
      lastFetchParams.current.endDate === currentParams.endDate &&
      lastFetchParams.current.userId === currentParams.userId &&
      lastFetchParams.current.categoriesLength === currentParams.categoriesLength
    ) {
      console.log('パラメータが前回と同じです。データ取得をスキップします。');
      return;
    }
    
    // データ取得開始
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    console.log('分析データ取得開始 - パラメータ:', {
      startTime: startDate?.getTime(),
      endTime: endDate?.getTime(),
      開始日: startDate?.toISOString(),
      終了日: endDate?.toISOString(),
      ユーザーID: currentUser?.uid,
      カテゴリ数: categories.length,
      強制更新: forceRefresh
    });
    
    try {
      // 1. スケジュールデータの取得
      const schedules = await getSchedulesByDateRange(startDate, endDate);
      setScheduleData(schedules);
      
      console.log('スケジュールデータ取得完了:', {
        キー数: Object.keys(schedules).length
      });
      
      // 2. 実績データの取得
      const achievements = await getAchievementsByDateRange(startDate, endDate);
      setAchievementData(achievements);
      
      console.log('実績データ取得完了:', {
        キー数: Object.keys(achievements).length
      });
      
      // 3. カテゴリ別学習時間の計算 (実績データを元に計算)
      const stats = calculateCategoryHoursByDateRange(
        schedules,
        categories,
        startDate,
        endDate,
        achievements
      );
      setCategoryStats(stats);
      
      console.log('カテゴリ統計計算完了:', stats);
      
      // 4. 日別データの生成
      const dailyPoints = generateDailyData(schedules, achievements, startDate, endDate);
      setDailyData(dailyPoints);
      
      console.log('日別データ生成完了:', {
        データポイント数: dailyPoints.length
      });
      
      // パラメータを更新
      lastFetchParams.current = { ...currentParams };
      
      // 最終更新日時を更新
      const now = new Date();
      console.log('最終更新時刻を設定:', now.toLocaleString());
      setLastUpdated(now);
      
      console.log('分析データの取得が完了しました:', {
        更新日時: now.toLocaleString(),
        総学習時間: stats.totalHours,
        カテゴリ数: Object.keys(stats.categoryHours).length,
        日別データ数: dailyPoints.length
      });
    } catch (err) {
      console.error('分析データ取得エラー:', err);
      setError('データの読み込み中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentUser, startDate, endDate, categories, getSchedulesByDateRange, getAchievementsByDateRange]);
  
  // 日別データ生成処理を分離
  const generateDailyData = useCallback((schedules, achievements, start, end) => {
    const dailyPoints = [];
    let currentDate = new Date(start);
    
    // 毎日のデータポイントを初期化
    while (currentDate <= end) {
      dailyPoints.push({
        date: new Date(currentDate),
        label: currentDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' }),
        計画時間: 0,
        完了時間: 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // スケジュールデータと実績データから集計
    Object.values(schedules).forEach(weekData => {
      Object.entries(weekData).forEach(([dayKey, dayData]) => {
        if (!dayData) return;
        
        Object.entries(dayData).forEach(([hourKey, hourData]) => {
          if (hourData && hourData.categoryId && hourData.date) {
            try {
              // 日付の正規化
              // タイムスタンプや文字列などさまざまな形式の日付を正規化
              const itemDate = normalizeDate(hourData.date);
              
              // 対応する日付のデータポイントを探す
              const dataPoint = dailyPoints.find(point => 
                point.date.toDateString() === itemDate.toDateString()
              );
              
              if (dataPoint) {
                dataPoint.計画時間 += 1;
                
                // 実績の確認 - generateAchievementKeyを使用して統一性を確保
                const uniqueKey = generateAchievementKey(itemDate, dayKey, hourKey);
                const achievement = achievements[uniqueKey];
                
                if (achievement) {
                  if (achievement.status === 'completed') {
                    dataPoint.完了時間 += 1;
                  } else if (achievement.status === 'partial') {
                    dataPoint.完了時間 += 0.5;
                  }
                }
              }
            } catch (error) {
              console.error('日付処理エラー:', error);
            }
          }
        });
      });
    });
    
    return dailyPoints;
  }, []);
  
  // 必要なデータが変更されたときにのみデータを取得
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const fetchData = async () => {
      if (!isMounted || !currentUser || !startDate || !endDate || categories.length === 0) {
        return;
      }
      
      // 連続更新を防止するため、更新要求をデバウンス処理する
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        console.log('日付範囲変更を検知:', {
          開始日: startDate.toISOString(),
          終了日: endDate.toISOString()
        });
        
        // データ取得実行（強制更新あり）
        if (isMounted) {
          await fetchAnalyticsData(true); // 強制更新フラグをtrueに設定
        }
      }, 300);
    };
    
    fetchData();
    
    // クリーンアップ関数
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentUser?.uid, startDate?.getTime(), endDate?.getTime(), categories.length, fetchAnalyticsData]);
  
  // 強制更新用の関数
  const refreshData = useCallback(() => {
    console.log('refreshData関数が呼び出されました');
    return fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);
  
  // メモ化されたコンテキスト値
  const contextValue = useMemo(() => {
    console.log('分析データコンテキスト値更新:', { 
      isLoading,
      categoryStats: {
        totalHours: categoryStats.totalHours,
        カテゴリ数: Object.keys(categoryStats.categoryHours || {}).length
      },
      dailyData: dailyData.length,
      achievements: Object.keys(achievementData).length,
      最終更新: lastUpdated ? lastUpdated.toLocaleString() : 'なし'
    });
    
    return {
      isLoading,
      error,
      scheduleData,
      achievementData,
      categoryStats,
      dailyData,
      refreshData,
      lastUpdated
    };
  }, [
    isLoading,
    error,
    scheduleData,
    achievementData,
    categoryStats,
    dailyData,
    refreshData,
    lastUpdated
  ]);
  
  return (
    <AnalyticsDataContext.Provider value={contextValue}>
      {children}
    </AnalyticsDataContext.Provider>
  );
};