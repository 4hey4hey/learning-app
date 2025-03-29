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
  let totalCompletedItems = 0;
  let totalPartialItems = 0;
  
  // すべてのスケジュールをループ
  for (const weekKey in schedules) {
    const weekSchedule = schedules[weekKey];
    
    for (const dayKey in weekSchedule) {
      for (const hourKey in weekSchedule[dayKey]) {
        const scheduleItem = weekSchedule[dayKey][hourKey];
        
        if (scheduleItem && scheduleItem.categoryId) {
          try {
            // 一意のキーを生成
            const uniqueKey = `${weekKey}_${dayKey}_${hourKey}`;
            const achievement = achievements[uniqueKey];
            
            // 実績ベースか、実績に関わらず全てをカウント
            const shouldCount = !achievementsOnly || 
                              (achievement && 
                               (achievement.status === 'completed' || 
                                achievement.status === 'partial'));
            
            if (shouldCount) {
              if (achievement && achievement.status === 'completed') {
                totalCompletedItems++;
              } else if (achievement && achievement.status === 'partial') {
                totalPartialItems++;
              } else {
                // 実績がない場合も1時間としてカウント
                totalCompletedItems++;
              }
            }
          } catch (error) {
            console.error('学習時間計算中のエラー:', error);
          }
        }
      }
    }
  }
  
  // 完了と部分的に完了した時間の合計
  const totalHours = totalCompletedItems + totalPartialItems;
  
  console.log('独自実装の総学習時間計算結果:');
  console.log('- 完了時間:', totalCompletedItems);
  console.log('- 部分完了時間:', totalPartialItems);
  console.log('- 合計時間:', totalHours);
  
  return Math.round(totalHours * 10) / 10;
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
