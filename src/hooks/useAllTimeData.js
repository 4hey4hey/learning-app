import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { calculateTotalStudyHours } from '../utils/timeUtils';
import { calculateTotalHours } from './useTotalStudyHours';

export const useAllTimeData = () => {
  const { currentUser, demoMode } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTimeData, setAllTimeData] = useState({
    totalHours: 0,
    completedCount: 0,
    partialCount: 0,
    totalCount: 0
  });

  const fetchAllTimeData = useCallback(async () => {
    if (!currentUser && !demoMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('全期間データの取得開始');
      
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const allSchedules = {};
        const allAchievements = {};
        
        // ローカルストレージのすべてのキーを取得
        const allKeys = Object.keys(localStorage);
        
        // スケジュールデータを取得
        const scheduleKeys = allKeys.filter(key => key.startsWith('demo_schedule_'));
        scheduleKeys.forEach(key => {
          try {
            const weekId = key.replace('demo_schedule_', '');
            const data = JSON.parse(localStorage.getItem(key));
            allSchedules[weekId] = data;
          } catch (e) {
            console.error('ローカルストレージデータのパースエラー:', e);
          }
        });
        
        // 実績データを取得
        const achievementKeys = allKeys.filter(key => key.startsWith('demo_achievements_'));
        achievementKeys.forEach(key => {
          try {
            const weekId = key.replace('demo_achievements_', '');
            const data = JSON.parse(localStorage.getItem(key));
            allAchievements[weekId] = data;
          } catch (e) {
            console.error('ローカルストレージデータのパースエラー:', e);
          }
        });
        
        // 総時間を計算
        const totalHours = calculateTotalStudyHours(allSchedules, allAchievements, true);
        
        // 実績の数をカウント
        let completedCount = 0;
        let partialCount = 0;
        let totalCount = 0;
        
        Object.values(allAchievements).forEach(weekData => {
          Object.entries(weekData).forEach(([key, achievement]) => {
            if (achievement && achievement.status) {
              totalCount++;
              if (achievement.status === 'completed') {
                completedCount++;
              } else if (achievement.status === 'partial') {
                partialCount++;
              }
            }
          });
        });
        
        setAllTimeData({
          totalHours,
          completedCount,
          partialCount,
          totalCount
        });
        
        setLoading(false);
        return;
      }
      
      // Firestore からデータを取得
      const allSchedules = {};
      const allAchievements = {};
      
      // スケジュールデータの取得
      const schedulesRef = collection(db, `users/${currentUser.uid}/schedules`);
      const schedulesSnapshot = await getDocs(schedulesRef);
      
      schedulesSnapshot.forEach(doc => {
      allSchedules[doc.id] = doc.data();
      });
      
      console.log('全期間データ: スケジュール取得完了', Object.keys(allSchedules).length, '件');
      // スケジュールのサンプルをログ出力
      if (Object.keys(allSchedules).length > 0) {
          const sampleKey = Object.keys(allSchedules)[0];
          console.log('スケジュールサンプル:', sampleKey, allSchedules[sampleKey]);
        }
        
        // 実績データの取得
        const achievementsRef = collection(db, `users/${currentUser.uid}/achievements`);
        const achievementsSnapshot = await getDocs(achievementsRef);
        
        achievementsSnapshot.forEach(doc => {
          allAchievements[doc.id] = doc.data();
        });
        
        console.log('全期間データ: 実績取得完了', Object.keys(allAchievements).length, '件');
        // 実績データのサンプルをログ出力
        if (Object.keys(allAchievements).length > 0) {
          const sampleKey = Object.keys(allAchievements)[0];
          console.log('実績データサンプル:', sampleKey, allAchievements[sampleKey]);
          // 実績データ内の項目数を確認
          const itemCount = Object.keys(allAchievements[sampleKey]).filter(k => k !== 'updatedAt').length;
          console.log('実績データ内の項目数:', itemCount);
        }
      
      achievementsSnapshot.forEach(doc => {
        allAchievements[doc.id] = doc.data();
      });
      
      // 総時間を計算
      console.log('全期間データ: 学習時間計算開始');
      console.log('- スケジュール件数:', Object.keys(allSchedules).length);
      console.log('- 実績データ件数:', Object.keys(allAchievements).length);
      
      // 手動で実績データをもう一度処理してカウント
      let manualCompletedCount = 0;
      let manualPartialCount = 0;
      let manualTotalCount = 0;
      let validScheduleItems = 0;
      
      // 各週のスケジュールを確認
      Object.values(allSchedules).forEach(weekSchedule => {
        // 各曜日を確認
        for (const dayKey in weekSchedule) {
          if (!weekSchedule[dayKey]) continue;
          
          // 各時間枠を確認
          for (const hourKey in weekSchedule[dayKey]) {
            const scheduleItem = weekSchedule[dayKey][hourKey];
            
            if (scheduleItem && scheduleItem.categoryId && scheduleItem.date) {
              validScheduleItems++;
            }
          }
        }
      });
      
      // 各週の実績データを確認
      Object.values(allAchievements).forEach(weekData => {
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
      
      console.log('有効なスケジュール項目数:', validScheduleItems);
      console.log('手動カウント - 合計実績数:', manualTotalCount);
      console.log('手動カウント - 完了数:', manualCompletedCount);
      console.log('手動カウント - 部分完了数:', manualPartialCount);
      
      // 実際に関数を使って計算
      const totalHours = calculateTotalStudyHours(allSchedules, allAchievements, true);
      console.log('calculateTotalStudyHours の結果:', totalHours, '時間');
      
      // 独自実装の計算関数を使用
      const backupTotalHours = calculateTotalHours(allSchedules, allAchievements, true);
      console.log('独自実装 calculateTotalHours の結果:', backupTotalHours, '時間');
      
      
      // 実績の数をカウント
      let completedCount = 0;
      let partialCount = 0;
      let totalCount = 0;
      
      achievementsSnapshot.forEach(doc => {
        const data = doc.data();
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'updatedAt' && value && value.status) {
            totalCount++;
            if (value.status === 'completed') {
              completedCount++;
            } else if (value.status === 'partial') {
              partialCount++;
            }
          }
        });
      });
      
      
      // 全ての実績データの合計（完了または部分的に完了）を計算
      // calculateTotalStudyHours が0を返す場合の代替手段
      let calculatedTotalHours = totalHours;
      if (calculatedTotalHours === 0) {
        // 独自実装の計算結果があればそれを使用
        if (backupTotalHours > 0) {
          calculatedTotalHours = backupTotalHours;
          console.log('独自実装の計算結果を使用します:', calculatedTotalHours, '時間');
        }
        // それでもゼロなら手動カウントの値を使用
        else if (manualCompletedCount > 0 || manualPartialCount > 0) {
          // 1実績=1時間として計算
          calculatedTotalHours = manualCompletedCount + manualPartialCount;
          console.log('代替計算による合計時間:', calculatedTotalHours, '時間');
        }
      }
      
      setAllTimeData({
        totalHours: calculatedTotalHours,
        completedCount: manualCompletedCount,
        partialCount: manualPartialCount,
        totalCount: manualTotalCount
      });
      
      console.log('全期間データ取得完了', {
        totalHours: calculatedTotalHours,
        completedCount: manualCompletedCount,
        partialCount: manualPartialCount,
        totalCount: manualTotalCount
      });
      
    } catch (error) {
      console.error('全期間データ取得エラー:', error);
      setError('データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode]);

  // コンポーネントがマウントされたときにデータを取得
  useEffect(() => {
    console.log('全期間データ: useEffect が実行されました');
    fetchAllTimeData();
  }, [fetchAllTimeData]);

  // 明示的に再度データ取得を行う
  useEffect(() => {
    console.log('全期間データ: 明示的なデータ取得を実行します');
    const timer = setTimeout(() => {
      if (!allTimeData.totalHours && !loading) {
        console.log('全期間データ: データがないため再取得します');
        fetchAllTimeData();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [allTimeData.totalHours, loading, fetchAllTimeData]);

  return {
    allTimeData,
    loading,
    error,
    refreshAllTimeData: fetchAllTimeData
  };
};