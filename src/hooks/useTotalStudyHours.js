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
  // 総学習時間計算処理の開始
  
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
            // 学習時間計算中のエラー処理
          }
        }
      }
    }
  }
  
  // 完了と部分的に完了した時間の合計
  // 部分的に完了した項目は0.7時間として計算
  const totalHours = totalCompletedItems + (totalPartialItems * 0.7);
  
  // 総学習時間の計算結果
  
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
