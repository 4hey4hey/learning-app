// src/utils/timeUtils.js
import { format, startOfWeek, addDays, isValid, parse } from 'date-fns';
import { dateLogger } from './loggerUtils';

// オブジェクトとして関数をエクスポート
const TimeUtils = {
  normalizeDate: (date) => {
    try {
      if (!date) return new Date();
      
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? new Date() : new Date(date);
      }
      
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      
      if (typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
      }
      
      return new Date();
    } catch (error) {
      dateLogger.error('日付正規化エラー:', error);
      return new Date();
    }
  },

  formatDateToString: (date) => {
    try {
      if (!date) return '';
      const normalizedDate = TimeUtils.normalizeDate(date);
      return format(normalizedDate, 'yyyy-MM-dd');
    } catch (error) {
      dateLogger.error('日付フォーマットエラー:', error);
      return '';
    }
  },

  getWeekStartDate: (date) => {
    try {
      const normalizedDate = TimeUtils.normalizeDate(date);
      return startOfWeek(normalizedDate, { weekStartsOn: 1 });
    } catch (error) {
      dateLogger.error('週開始日計算エラー:', error);
      return startOfWeek(new Date(), { weekStartsOn: 1 });
    }
  },

  getWeekIdentifier: (weekStartDate) => {
    try {
      if (!weekStartDate) return TimeUtils.formatDateToString(TimeUtils.getWeekStartDate(new Date()));
      return TimeUtils.formatDateToString(TimeUtils.getWeekStartDate(weekStartDate));
    } catch (error) {
      dateLogger.error('週識別子生成エラー:', error);
      return TimeUtils.formatDateToString(TimeUtils.getWeekStartDate(new Date()));
    }
  },

  getDayKeyFromDate: (date) => {
    try {
      const normalizedDate = TimeUtils.normalizeDate(date);
      const dayOfWeek = normalizedDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return `day${adjustedDay}`;
    } catch (error) {
      dateLogger.error('曜日キー取得エラー:', error);
      return 'day1';
    }
  },

  generateScheduleKey: (date, dayKey, hourKey) => {
    try {
      const dateStr = TimeUtils.formatDateToString(TimeUtils.normalizeDate(date));
      return `${dateStr}_${dayKey}_${hourKey}`;
    } catch (error) {
      dateLogger.error('スケジュールキー生成エラー:', error);
      const today = TimeUtils.formatDateToString(new Date());
      return `${today}_${dayKey}_${hourKey}`;
    }
  },

  generateEmptyWeekSchedule: (weekStartDate) => {
    const normalizedStartDate = TimeUtils.getWeekStartDate(weekStartDate || new Date());
    const schedule = {};
    
    for (let i = 1; i <= 7; i++) {
      const dayKey = `day${i}`;
      schedule[dayKey] = {};
      
      for (let hour = 9; hour <= 22; hour++) {
        const hourKey = `hour${hour}`;
        schedule[dayKey][hourKey] = null;
      }
    }
    
    return schedule;
  },

  calculateCategoryHours: (
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
            const uniqueKey = TimeUtils.generateScheduleKey(scheduleItem.date || new Date(), dayKey, hourKey);
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
  },

  calculateWeekStudyHours: (
    schedule, 
    achievements = {}, 
    includeAchievementsInStats = false
  ) => {
    if (!schedule) return 0;
    
    let totalMinutes = 0;
    
    for (const dayKey in schedule) {
      if (!schedule[dayKey]) continue;
      
      for (const hourKey in schedule[dayKey]) {
        const scheduleItem = schedule[dayKey][hourKey];
        
        if (scheduleItem && scheduleItem.categoryId) {
          try {
            const uniqueKey = TimeUtils.generateScheduleKey(scheduleItem.date || new Date(), dayKey, hourKey);
            const achievement = achievements[uniqueKey];
            
            const shouldCount = !includeAchievementsInStats || 
                              (includeAchievementsInStats && achievement && 
                               (achievement.status === 'completed' || achievement.status === 'partial'));
                               
            if (shouldCount) {
              totalMinutes += 60;
            }
          } catch (error) {
            dateLogger.error('時間計算中のエラー:', error, '項目:', scheduleItem);
          }
        }
      }
    }
    
    return Math.round(totalMinutes / 60 * 10) / 10;
  },

  calculateTotalStudyHours: (
    allSchedules, 
    allAchievements = {}, 
    includeAchievementsInStats = false
  ) => {
    if (!allSchedules || Object.keys(allSchedules).length === 0) return 0;
    
    let totalHours = 0;

    for (const weekKey in allSchedules) {
      const weekSchedule = allSchedules[weekKey];
      
      if (!weekSchedule) continue;
      
      const weekAchievements = {};
      const weekPrefix = weekKey.split('T')[0];
      
      for (const achievementKey in allAchievements) {
        if (achievementKey.startsWith(weekPrefix)) {
          weekAchievements[achievementKey] = allAchievements[achievementKey];
        }
      }
      
      let validItemsInWeek = 0;
      for (const dayKey in weekSchedule) {
        for (const hourKey in weekSchedule[dayKey]) {
          const scheduleItem = weekSchedule[dayKey][hourKey];
          
          if (scheduleItem && scheduleItem.categoryId) {
            try {
              if (!scheduleItem.date) continue;
              
              const uniqueKey = TimeUtils.generateScheduleKey(scheduleItem.date, dayKey, hourKey);
              const achievement = weekAchievements[uniqueKey];
              
              const valid = !includeAchievementsInStats || 
                          (includeAchievementsInStats && achievement && 
                          (achievement.status === 'completed' || achievement.status === 'partial'));
                         
              if (valid) {
                validItemsInWeek++;
              }
            } catch (error) {
              dateLogger.error('時間計算エラー:', error, dayKey, hourKey);
            }
          }
        }
      }
      
      totalHours += validItemsInWeek;
    }
    
    return Math.round(totalHours * 10) / 10;
  },

  calculateMonthStudyHours: (
    weeklySchedules, 
    achievements = {}, 
    includeAchievementsInStats = false
  ) => {
    if (!weeklySchedules || !Array.isArray(weeklySchedules) || !weeklySchedules.length) return 0;
    
    let totalMonthHours = 0;
    
    try {
      for (const weekSchedule of weeklySchedules) {
        if (weekSchedule) {
          totalMonthHours += TimeUtils.calculateWeekStudyHours(
            weekSchedule, 
            achievements, 
            includeAchievementsInStats
          );
        }
      }
    } catch (error) {
      dateLogger.error('月間学習時間計算中にエラーが発生しました:', error);
    }
    
    return Math.round(totalMonthHours * 10) / 10;
  },

  debugAchievementStructure: (allAchievements) => {
    const debugResult = {
      totalDateKeys: Object.keys(allAchievements).length,
      achievementDetails: {},
      statusDistribution: {
        completed: 0,
        partial: 0,
        failed: 0,
        other: 0
      }
    };

    for (const dateKey in allAchievements) {
      const achievements = allAchievements[dateKey];
      
      if (typeof achievements !== 'object' || achievements === null) continue;

      const dateDetails = {
        totalAchievements: 0,
        achievementKeys: []
      };

      for (const achievementKey in achievements) {
        if (achievementKey === 'updatedAt') continue;

        const achievement = achievements[achievementKey];
        
        dateDetails.totalAchievements++;
        dateDetails.achievementKeys.push(achievementKey);

        switch (achievement.status) {
          case 'completed':
            debugResult.statusDistribution.completed++;
            break;
          case 'partial':
            debugResult.statusDistribution.partial++;
            break;
          case 'failed':
            debugResult.statusDistribution.failed++;
            break;
          default:
            debugResult.statusDistribution.other++;
        }
      }

      debugResult.achievementDetails[dateKey] = dateDetails;
    }

    return debugResult;
  }
};

// 各関数を個別にもエクスポート
export const {
  normalizeDate,
  formatDateToString,
  getWeekStartDate,
  getWeekIdentifier,
  getDayKeyFromDate,
  generateScheduleKey,
  generateEmptyWeekSchedule,
  calculateCategoryHours,
  calculateWeekStudyHours,
  calculateTotalStudyHours,
  calculateMonthStudyHours,
  debugAchievementStructure
} = TimeUtils;

// デフォルトエクスポート
export default TimeUtils;
