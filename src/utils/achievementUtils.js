/**
 * achievementUtils.js
 * 実績関連の処理を行うユーティリティ関数
 */

import { generateScheduleKey } from './timeUtils';
import { dateLogger } from './loggerUtils';

/**
 * 実績状態の定義
 */
export const ACHIEVEMENT_STATUS = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed'
};

/**
 * 実績アイコンの定義
 */
export const ACHIEVEMENT_ICONS = {
  [ACHIEVEMENT_STATUS.COMPLETED]: { icon: '◎', color: 'text-white', title: '完了' },
  [ACHIEVEMENT_STATUS.PARTIAL]: { icon: '△', color: 'text-white', title: '部分的' },
  [ACHIEVEMENT_STATUS.FAILED]: { icon: '✗', color: 'text-white', title: '未達成' },
  default: { icon: '-', color: 'text-white', title: '未記録' }
};

/**
 * 実績データのユニークキーを生成する関数
 * @param {Date|string|object} date - スケジュールの日付
 * @param {string} dayKey - 曜日キー (day1~day7)
 * @param {string} hourKey - 時間キー (hour9~hour22)
 * @returns {string} 実績データのユニークキー
 */
export const generateAchievementKey = (date, dayKey, hourKey) => {
  const key = generateScheduleKey(date, dayKey, hourKey);
  // 日付間の短縮形式を含めてデバッグしやすくする
  let dateDebug;
  if (date instanceof Date) {
    dateDebug = date.toISOString().split('T')[0];
  } else if (typeof date === 'string') {
    dateDebug = date;
  } else if (date && typeof date === 'object' && 'seconds' in date) {
    dateDebug = new Date(date.seconds * 1000).toISOString().split('T')[0];
  } else {
    dateDebug = String(date);
  }
  
  return key;
};

/**
 * 実績記録率を計算する関数
 * @param {Object} schedule - スケジュールデータ
 * @param {Object} achievements - 実績データ
 * @param {Object} achievementStatus - 実績状態の定義
 * @returns {Object} 実績記録率と統計情報
 */
export const calculateAchievementStats = (schedule, achievements, achievementStatus = ACHIEVEMENT_STATUS) => {
  try {
    let totalPlanned = 0;
    let totalCompleted = 0;
    let totalPartial = 0;
    let totalFailed = 0;
    let totalWithAnyRecord = 0;
    
    if (!schedule) return { rate: 0, totalRecorded: 0, stats: {} };
    
    // スケジュールデータをループして実績を集計
    for (const day in schedule) {
      if (!schedule[day]) continue;
      
      for (const hour in schedule[day]) {
        const scheduleItem = schedule[day][hour];
        
        if (scheduleItem && scheduleItem.categoryId) {
          totalPlanned++;
          
          try {
            // スケジュールの日付からユニークキーを生成
            const date = scheduleItem.date instanceof Date ? scheduleItem.date : new Date(scheduleItem.date || 0);
            const uniqueKey = generateAchievementKey(date, day, hour);
            
            // 実績データを取得
            const achievement = achievements && achievements[uniqueKey];
            
            if (achievement) {
              totalWithAnyRecord++;
              
              if (achievement.status === achievementStatus.COMPLETED) {
                totalCompleted++;
              } else if (achievement.status === achievementStatus.PARTIAL) {
                totalPartial++;
              } else if (achievement.status === achievementStatus.FAILED) {
                totalFailed++;
              }
            }
          } catch (err) {
            dateLogger.error('実績集計中の日付処理エラー:', err);
          }
        }
      }
    }
    
    // 実績記録率（何らかの実績のある予定の割合）
    const recordRate = totalPlanned > 0 ? Math.round((totalWithAnyRecord / totalPlanned) * 100) : 0;
    
    // 達成率（完了または部分的な予定の割合）
    const completionRate = totalPlanned > 0 ? Math.round(((totalCompleted + totalPartial) / totalPlanned) * 100) : 0;
    
    // 成功率（完了した予定の割合）
    const successRate = totalWithAnyRecord > 0 ? Math.round((totalCompleted / totalWithAnyRecord) * 100) : 0;
    
    // 集計結果
    return {
      recordRate,        // 実績記録率
      completionRate,    // 達成率
      successRate,       // 成功率
      totalRecorded: totalWithAnyRecord, // 記録済み件数
      stats: {
        totalPlanned,    // 予定総数
        totalCompleted,  // 完了数
        totalPartial,    // 部分完了数
        totalFailed,     // 未達成数
        totalWithAnyRecord, // 記録済み総数
      }
    };
  } catch (error) {
    dateLogger.error('実績集計エラー:', error);
    return { 
      recordRate: 0, 
      completionRate: 0, 
      successRate: 0, 
      totalRecorded: 0, 
      stats: {} 
    };
  }
};

/**
 * 実績ステータスに基づくレポートを生成する関数
 * @param {Object} stats - 実績統計情報
 * @returns {string} レポート文字列
 */
export const generateAchievementReport = (stats) => {
  if (!stats || !stats.stats) {
    return "実績データがありません。";
  }
  
  const { recordRate, completionRate, successRate, totalRecorded, stats: { totalPlanned, totalCompleted, totalPartial, totalFailed } } = stats;
  
  return `
実績レポート:
----------------------------
予定数: ${totalPlanned} 件
記録済み: ${totalRecorded} 件 (${recordRate}%)

内訳:
- 完了: ${totalCompleted} 件
- 部分的: ${totalPartial} 件
- 未達成: ${totalFailed} 件
- 未記録: ${totalPlanned - totalRecorded} 件

達成率: ${completionRate}%
(完了または部分的に達成した予定の割合)

成功率: ${successRate}%
(記録済み予定のうち完了した割合)
----------------------------
`;
};
