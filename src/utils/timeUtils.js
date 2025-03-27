import { dateLogger } from './loggerUtils';
import { generateScheduleKey } from './timeUtils';

/**
 * カテゴリ別の学習時間を計算する
 * @param {Object} schedule スケジュールデータ
 * @param {Array} categories カテゴリデータ
 * @param {Object} [achievements={}] 実績データ
 * @param {boolean} [includeAchievementsOnly=false] 実績のある項目のみを含めるかどうか
 * @returns {Object} カテゴリ別の学習時間（分）
 */
export const calculateCategoryHours = (
  schedule, 
  categories, 
  achievements = {}, 
  includeAchievementsOnly = false
) => {
  if (!schedule || !categories) return {};
  
  const categoryHoursMap = categories.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, {});
  
  for (const dayKey in schedule) {
    if (!schedule[dayKey]) continue;
    
    for (const hourKey in schedule[dayKey]) {
      const scheduleItem = schedule[dayKey][hourKey];
      
      if (scheduleItem && scheduleItem.categoryId) {
        try {
          const uniqueKey = generateScheduleKey(scheduleItem.date || new Date(), dayKey, hourKey);
          const achievement = achievements[uniqueKey];
          
          const shouldInclude = !includeAchievementsOnly || 
                               (includeAchievementsOnly && achievement && 
                                (achievement.status === 'completed' || achievement.status === 'partial'));
          
          if (shouldInclude) {
            categoryHoursMap[scheduleItem.categoryId] += 60;
          }
        } catch (error) {
          dateLogger.error('時間計算中にエラーが発生しました:', error, '項目:', scheduleItem);
        }
      }
    }
  }
  
  return categoryHoursMap;
};

/**
 * 週間の合計学習時間を計算する
 * @param {Object} schedule 週間スケジュールデータ
 * @param {Object} [achievements={}] 実績データ
 * @param {boolean} [includeAchievementsInStats=false] 実績がある項目のみを集計に含めるかどうか
 * @returns {number} 学習時間の合計(時間単位、1時間=60分)
 */
export const calculateWeekStudyHours = (
  schedule, 
  achievements = {}, 
  includeAchievementsInStats = false
) => {
  if (!schedule) {
    return 0;
  }
  
  let totalMinutes = 0;
  let itemsCount = 0;
  let validItemsCount = 0;
  
  for (const dayKey in schedule) {
    if (!schedule[dayKey]) continue;
    
    for (const hourKey in schedule[dayKey]) {
      const scheduleItem = schedule[dayKey][hourKey];
      
      if (scheduleItem && scheduleItem.categoryId) {
        itemsCount++;
        try {
          const uniqueKey = generateScheduleKey(scheduleItem.date || new Date(), dayKey, hourKey);
          const achievement = achievements[uniqueKey];
          
          const shouldCount = !includeAchievementsInStats || 
                            (includeAchievementsInStats && achievement && 
                             (achievement.status === 'completed' || achievement.status === 'partial'));
                             
          if (shouldCount) {
            validItemsCount++;
            totalMinutes += 60;
          }
        } catch (error) {
          dateLogger.error('時間計算中のエラー:', error, '項目:', scheduleItem);
        }
      }
    }
  }
  
  return Math.round(totalMinutes / 60 * 10) / 10;
};

/**
 * 全期間の合計学習時間を計算する
 * @param {Object} allSchedules 全てのスケジュールデータ
 * @param {Object} [allAchievements={}] 全ての実績データ
 * @param {boolean} [includeAchievementsInStats=false] 実績がある項目のみを集計に含めるかどうか
 * @returns {number} 全期間の学習時間の合計(時間単位)
 */
export const calculateTotalStudyHours = (
  allSchedules, 
  allAchievements = {}, 
  includeAchievementsInStats = false
) => {
  if (!allSchedules || Object.keys(allSchedules).length === 0) {
    return 0;
  }
  
  let totalHours = 0;
  let totalValidItems = 0;

  const isKeyInWeekSchedule = (achievementKey, weekSchedule) => {
    try {
      const parts = achievementKey.split('_');
      if (parts.length < 3) return false;
      
      const [, dayKey, hourKey] = parts;
      
      return !!(weekSchedule[dayKey] && 
             weekSchedule[dayKey][hourKey] && 
             weekSchedule[dayKey][hourKey].categoryId);
    } catch (error) {
      console.error('スケジュールキー検証エラー:', error, { achievementKey });
      return false;
    }
  };

  for (const weekKey in allSchedules) {
    const weekSchedule = allSchedules[weekKey];
    
    const weekAchievements = {};
    const weekPrefix = weekKey.split('T')[0];
    
    for (const achievementKey in allAchievements) {
      if (
        achievementKey.startsWith(weekPrefix) || 
        (weekSchedule && isKeyInWeekSchedule(achievementKey, weekSchedule))
      ) {
        weekAchievements[achievementKey] = allAchievements[achievementKey];
      }
    }
    
    let validItemsInWeek = 0;
    if (weekSchedule) {
      for (const dayKey in weekSchedule) {
        for (const hourKey in weekSchedule[dayKey]) {
          const scheduleItem = weekSchedule[dayKey][hourKey];
          
          if (scheduleItem && scheduleItem.categoryId) {
            try {
              if (!scheduleItem.date) {
                continue;
              }
              
              const uniqueKey = generateScheduleKey(scheduleItem.date, dayKey, hourKey);
              const achievement = weekAchievements[uniqueKey];
              
              const valid = !includeAchievementsInStats || 
                          (includeAchievementsInStats && achievement && 
                          (achievement.status === 'completed' || achievement.status === 'partial'));
                         
              if (valid) {
                validItemsInWeek++;
              }
            } catch (error) {
              console.error('時間計算エラー:', error, dayKey, hourKey);
            }
          }
        }
      }
    }
    
    const weekHours = validItemsInWeek;
    totalValidItems += validItemsInWeek;
    
    totalHours += weekHours;
  }
  
  return Math.round(totalHours * 10) / 10;
};