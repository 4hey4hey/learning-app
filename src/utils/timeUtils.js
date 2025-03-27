// src/utils/timeUtils.js
import { format, startOfWeek, addDays, isValid, parse } from 'date-fns';
import { dateLogger } from './loggerUtils';

/**
 * 日付を標準形式に正規化する
 * @param {Date|string|object} date - 正規化する日付
 * @returns {Date} 正規化された日付オブジェクト
 */
export const normalizeDate = (date) => {
  try {
    // nullやundefinedの場合は現在の日付を返す
    if (!date) {
      return new Date();
    }
    
    // すでにDateオブジェクトの場合
    if (date instanceof Date) {
      // 有効な日付かチェック
      if (isNaN(date.getTime())) {
        return new Date(); // 無効な場合は現在の日付
      }
      return new Date(date); // 新しいDateオブジェクトを作成して返す
    }
    
    // 文字列の場合
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      
      // 有効な日付かチェック
      if (isNaN(parsedDate.getTime())) {
        return new Date(); // 無効な場合は現在の日付
      }
      
      return parsedDate;
    }
    
    // Firestoreのタイムスタンプの場合
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    // それ以外の場合は現在の日付
    return new Date();
  } catch (error) {
    dateLogger.error('日付正規化エラー:', error);
    return new Date(); // エラー時は現在の日付
  }
};

/**
 * 日付を YYYY-MM-DD 形式の文字列に正規化する
 * @param {Date|string|object} date - 変換する日付
 * @returns {string} 正規化された日付文字列
 */
export const formatDateToString = (date) => {
  try {
    if (!date) return '';
    
    const normalizedDate = normalizeDate(date);
    return format(normalizedDate, 'yyyy-MM-dd');
  } catch (error) {
    dateLogger.error('日付フォーマットエラー:', error);
    return '';
  }
};

/**
 * 週の開始日（月曜日）を取得する
 * @param {Date|string} date - 日付
 * @returns {Date} 週の開始日
 */
export const getWeekStartDate = (date) => {
  try {
    const normalizedDate = normalizeDate(date);
    return startOfWeek(normalizedDate, { weekStartsOn: 1 });
  } catch (error) {
    dateLogger.error('週開始日計算エラー:', error);
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }
};

/**
 * 週の識別子を生成する（YYYY-MM-DD形式）
 * @param {Date} weekStartDate - 週の開始日
 * @returns {string} 週の識別子
 */
export const getWeekIdentifier = (weekStartDate) => {
  try {
    if (!weekStartDate) return formatDateToString(getWeekStartDate(new Date()));
    return formatDateToString(getWeekStartDate(weekStartDate));
  } catch (error) {
    dateLogger.error('週識別子生成エラー:', error);
    return formatDateToString(getWeekStartDate(new Date()));
  }
};

/**
 * 日付から曜日キー（day1～day7）を取得する
 * @param {Date} date - 日付
 * @returns {string} 曜日キー
 */
export const getDayKeyFromDate = (date) => {
  try {
    const normalizedDate = normalizeDate(date);
    
    // 日曜は0、月曜は1、...、土曜は6
    const dayOfWeek = normalizedDate.getDay();
    // 月曜を1、...、日曜を7とする
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    return `day${adjustedDay}`;
  } catch (error) {
    dateLogger.error('曜日キー取得エラー:', error);
    return 'day1';
  }
};

/**
 * スケジュールの一意識別子を生成する関数
 * @param {Date|string|object} date - スケジュールの日付
 * @param {string} dayKey - 曜日キー (day1~day7)
 * @param {string} hourKey - 時間キー (hour9~hour22)
 * @returns {string} スケジュールの一意識別子
 */
export const generateScheduleKey = (date, dayKey, hourKey) => {
  try {
    const dateStr = formatDateToString(normalizeDate(date));
    // 形式: YYYY-MM-DD_dayX_hourXX
    return `${dateStr}_${dayKey}_${hourKey}`;
  } catch (error) {
    dateLogger.error('スケジュールキー生成エラー:', error);
    // エラー時は現在の日付を使用
    const today = formatDateToString(new Date());
    return `${today}_${dayKey}_${hourKey}`;
  }
};

/**
 * 空の週間スケジュールを生成する
 * @param {Date} weekStartDate - 週の開始日
 * @returns {Object} 空のスケジュール
 */
export const generateEmptyWeekSchedule = (weekStartDate) => {
  const normalizedStartDate = getWeekStartDate(weekStartDate || new Date());
  const schedule = {};
  
  // 7日分(day1～day7)のスケジュールを生成
  for (let i = 1; i <= 7; i++) {
    const dayKey = `day${i}`;
    schedule[dayKey] = {};
    
    // 9時から22時までの時間枠を設定
    for (let hour = 9; hour <= 22; hour++) {
      const hourKey = `hour${hour}`;
      schedule[dayKey][hourKey] = null;
    }
  }
  
  return schedule;
};

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
      dateLogger.error('スケジュールキー検証エラー:', error, { achievementKey });
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
              dateLogger.error('時間計算エラー:', error, dayKey, hourKey);
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

/**
 * 月間の学習時間を計算する
 * @param {Array} weeklySchedules 週間スケジュールデータの配列
 * @param {Object} [achievements={}] 実績データ
 * @param {boolean} [includeAchievementsInStats=false] 実績がある項目のみを集計に含めるかどうか
 * @returns {number} 月間学習時間の合計(時間単位)
 */
export const calculateMonthStudyHours = (
  weeklySchedules, 
  achievements = {}, 
  includeAchievementsInStats = false
) => {
  if (!weeklySchedules || !Array.isArray(weeklySchedules) || !weeklySchedules.length) return 0;
  
  let totalMonthHours = 0;
  
  try {
    for (const weekSchedule of weeklySchedules) {
      if (weekSchedule) {
        totalMonthHours += calculateWeekStudyHours(
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
};

/**
 * 実績データ構造のデバッグ情報を生成する
 * @param {Object} allAchievements 実績データ
 * @returns {Object} デバッグ情報
 */
export const debugAchievementStructure = (allAchievements) => {
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
      // updatedAtなどのシステム情報を除外
      if (achievementKey === 'updatedAt') continue;

      const achievement = achievements[achievementKey];
      
      dateDetails.totalAchievements++;
      dateDetails.achievementKeys.push(achievementKey);

      // ステータス分布をカウント
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
};