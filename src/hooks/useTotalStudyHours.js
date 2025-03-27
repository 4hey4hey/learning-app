import { useState, useCallback } from 'react';

/**
 * ScheduleとAchievementのデータを使って、全期間の総学習時間を計算する
 * 独自実装バージョン（calculateTotalStudyHoursの代替）
 * 
 * @param {Object} schedules - すべての週のスケジュールデータ
 * @param {Object} achievements - すべての実績データ
 * @param {boolean} achievementsOnly - 実績のあるデータのみを含めるかどうか
 * @returns {number} 総学習時間（時間）
 */
export const calculateTotalHours = (schedules = {}, achievements = {}, achievementsOnly = true) => {
  console.log('独自実装の総学習時間計算開始:');
  console.log('- スケジュール件数:', Object.keys(schedules).length);
  console.log('- 実績データ件数:', Object.keys(achievements).length);
  console.log('- 実績ベース表示:', achievementsOnly);
  
  // 実績データの合計数をカウント
  let totalCompletedHours = 0;
  let totalPartialHours = 0;
  
  // すべての実績データをループ
  Object.values(achievements).forEach(weekData => {
    if (!weekData) return;
    
    Object.entries(weekData).forEach(([key, achievement]) => {
      // 'updatedAt'などのシステムフィールドは無視
      if (key === 'updatedAt' || !achievement || !achievement.status) return;
      
      // 実績に基づいてカウント
      if (achievement.status === 'completed') {
        totalCompletedHours++;
      } else if (achievement.status === 'partial') {
        totalPartialHours++;
      }
    });
  });
  
  // 完了と部分的に完了した時間の合計
  const totalHours = totalCompletedHours + totalPartialHours;
  console.log('独自実装の総学習時間計算結果:');
  console.log('- 完了時間:', totalCompletedHours);
  console.log('- 部分完了時間:', totalPartialHours);
  console.log('- 合計時間:', totalHours);
  
  return totalHours;
};

/**
 * 全期間の総学習時間を計算するカスタムフック
 */
export const useTotalStudyHours = () => {
  const [totalHours, setTotalHours] = useState(0);
  const [stats, setStats] = useState({
    completed: 0,
    partial: 0,
    total: 0
  });
  
  const calculateHours = useCallback((schedules, achievements, achievementsOnly) => {
    const result = calculateTotalHours(schedules, achievements, achievementsOnly);
    setTotalHours(result);
    return result;
  }, []);
  
  return {
    totalHours,
    stats,
    calculateHours
  };
};