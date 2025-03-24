import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, getDay, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// デバッグログ用のダミー関数（本番環境用）
const debugLog = {
  info: () => {},
  error: () => {},
  group: () => {},
  groupEnd: () => {}
};

export const formatDateToString = (date) => {
  if (!date) {
    console.warn('formatDateToString: 日付が未定義です');
    return new Date().toISOString().split('T')[0];
  }
  
  try {
    let d;
    
    if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      d = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
    }
    else if (date instanceof Timestamp) {
      d = date.toDate();
    } 
    else if (typeof date === 'string') {
      try {
        d = new Date(date);
        if (isNaN(d.getTime())) {
          d = parseISO(date);
        }
      } catch (error) {
        console.error('無効な日付文字列:', date, error);
        return '';
      }
    } 
    else if (date instanceof Date) {
      d = date;
    } 
    else {
      console.error('無効な日付タイプ:', typeof date, date);
      return '';
    }
    
    d.setHours(0, 0, 0, 0);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日付のフォーマットエラー:', error, date);
    return '';
  }
};

export const getDayKeyFromDate = (date) => {
  let processedDate;

  if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    processedDate = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
  } else if (date instanceof Timestamp) {
    processedDate = date.toDate();
  } else if (typeof date === 'string') {
    processedDate = new Date(date);
  } else if (date instanceof Date) {
    processedDate = date;
  } else {
    console.warn('無効な日付:', date);
    return 'day1';
  }

  const dayOfWeek = processedDate.getDay();
  return `day${dayOfWeek === 0 ? 7 : dayOfWeek}`;
};

export const getWeekStartDate = (date) => {
  let targetDate = date || new Date();
  
  if (!(targetDate instanceof Date)) {
    try {
      targetDate = new Date(targetDate);
    } catch (error) {
      console.warn('日付の変換に失敗しました。現在の日付を使用します。', error);
      targetDate = new Date();
    }
  }
  
  if (isNaN(targetDate.getTime())) {
    console.warn('無効な日付です。現在の日付を使用します。');
    targetDate = new Date();
  }
  
  const day = targetDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  
  const mondayDate = new Date(targetDate);
  mondayDate.setDate(targetDate.getDate() + diff);
  
  mondayDate.setHours(0, 0, 0, 0);
  mondayDate.setMinutes(0);
  mondayDate.setSeconds(0);
  mondayDate.setMilliseconds(0);
  
  return mondayDate;
};

export const getWeekIdentifier = (date) => {
  const weekStart = getWeekStartDate(date);
  return formatDateToString(weekStart);
};

export const normalizeDate = (date) => {
  if (!date) return new Date();
  
  let normalizedDate;
  
  try {
    if (date && typeof date === 'object' && 'seconds' in date) {
      normalizedDate = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
    }
    else if (date instanceof Date) {
      normalizedDate = new Date(date);
    }
    else if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        normalizedDate = parsedDate;
      } else {
        try {
          normalizedDate = parseISO(date);
        } catch (e) {
          console.error('無効な日付文字列:', date, e);
          normalizedDate = new Date();
        }
      }
    }
    else if (typeof date === 'number') {
      normalizedDate = new Date(date);
    }
    else {
      console.warn('未知の日付型:', typeof date);
      normalizedDate = new Date();
    }
    
    // 日付が有効かチェック
    if (isNaN(normalizedDate.getTime())) {
      console.warn('無効な日付結果、デフォルト日付を使用:', date);
      normalizedDate = new Date();
    }
  } catch (error) {
    console.error('日付正規化エラー:', error, date);
    normalizedDate = new Date(); // エラー時はデフォルト日付を使用
  }
  
  // 時刻をリセット
  normalizedDate.setHours(0, 0, 0, 0);
  
  return normalizedDate;
};

// スケジュールキーの生成
// 重要: この関数は実績のキーとも一致させる必要があります
export const generateScheduleKey = (date, dayKey, hourKey) => {
  if (!date) {
    console.warn('generateScheduleKey: 日付が未定義です。デフォルトの日付を使用します。');
    const defaultDate = new Date();
    defaultDate.setHours(0, 0, 0, 0);
    return `${defaultDate.toISOString().split('T')[0]}_${dayKey}_${hourKey}`;
  }
  
  if (!dayKey || !hourKey) {
    console.error('generateScheduleKey: dayKeyまたはhourKeyが未定義です:', { date, dayKey, hourKey });
    throw new Error('キー生成に必要なパラメータが不足しています');
  }
  
  try {
    // 注意: ここで日付を必ず正規化しておく
    const normalizedDate = normalizeDate(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // 日付文字列型を生成
    const dateStr = formatDateToString(normalizedDate);
    
    // デバッグ用ログ
    console.log('キー生成プロセス:', {
      元の日付: date,
      正規化後: normalizedDate,
      日付文字列: dateStr,
      生成キー: `${dateStr}_${dayKey}_${hourKey}`
    });
    
    return `${dateStr}_${dayKey}_${hourKey}`;
  } catch (error) {
    console.error('キー生成エラー:', error, { date, dayKey, hourKey });
    // エラーの場合は現在の日付を使用してキーを生成
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return `${fallbackDate.toISOString().split('T')[0]}_${dayKey}_${hourKey}`;
  }
};

export const generateEmptyWeekSchedule = (startDate) => {
  const schedule = {};
  
  let weekStart = startDate ? new Date(startDate) : getWeekStartDate(new Date());
  weekStart.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const dayKey = `day${i + 1}`;
    schedule[dayKey] = {};
    
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);
    
    for (let hour = 9; hour <= 22; hour++) {
      const hourKey = `hour${hour}`;
      schedule[dayKey][hourKey] = null;
    }
  }
  
  return schedule;
};

export const calculateCategoryHours = (schedule, categories, achievements = {}, includeAchievementsOnly = false) => {
  if (!schedule || !categories) return {};
  
  const categoryHoursMap = categories.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, {});
  
  // デバッグ情報
  console.log('calculateCategoryHours - 実績計算ログ:', {
    scheduleItemCount: countScheduleItems(schedule),
    categoriesCount: categories.length,
    achievementsCount: Object.keys(achievements).length,
    includeAchievementsOnly
  });
  
  let countIncluded = 0;
  let countExcluded = 0;
  
  for (const dayKey in schedule) {
    if (!schedule[dayKey]) continue;
    
    for (const hourKey in schedule[dayKey]) {
      const scheduleItem = schedule[dayKey][hourKey];
      
      if (scheduleItem && scheduleItem.categoryId) {
        try {
          // 計画された勉強時間をすべて集計に含めるか、実績のある項目のみを含めるか判断
          const uniqueKey = generateScheduleKey(scheduleItem.date, dayKey, hourKey);
          const achievement = achievements ? achievements[uniqueKey] : null;
          
          // includeAchievementsOnly=true の場合、実績のある項目のみを集計
          // includeAchievementsOnly=false の場合、すべての計画項目を集計（実績の有無に関わらず）
          const shouldInclude = !includeAchievementsOnly || 
                               (includeAchievementsOnly && achievement && 
                                (achievement.status === 'completed' || achievement.status === 'partial'));
          
          if (shouldInclude) {
            categoryHoursMap[scheduleItem.categoryId] += 60;
            countIncluded++;
          } else {
            countExcluded++;
          }
          
          // デバッグ情報を追加
          if (includeAchievementsOnly) {
            console.log(`項目チェック: ${uniqueKey}`, {
              hasAchievement: !!achievement,
              status: achievement ? achievement.status : 'none',
              included: shouldInclude
            });
          }
        } catch (error) {
          console.error('時間計算中にエラーが発生しました:', error, '項目:', scheduleItem);
        }
      }
    }
  }
  
  console.log('集計結果:', { 
    countIncluded,
    countExcluded,
    totalItems: countIncluded + countExcluded,
    categoryHoursMap
  });
  
  return categoryHoursMap;
};

// スケジュール項目数を数えるヘルパー関数
function countScheduleItems(schedule) {
  let count = 0;
  for (const day in schedule) {
    for (const hour in schedule[day]) {
      if (schedule[day][hour]) {
        count++;
      }
    }
  }
  return count;
}

export const calculateWeekStudyHours = (schedule, achievements = {}, includeAchievementsInStats = false) => {
  if (!schedule) return 0;
  
  let totalMinutes = 0;
  let countedItems = 0;
  let skippedItems = 0;
  
  // デバッグ情報
  console.log('calculateWeekStudyHours - 実績計算ログ:', {
    includeAchievementsInStats,
    achievementsCount: Object.keys(achievements).length
  });
  
  // 実績の種類ごとのカウント
  const achievementStats = {
    completed: 0,
    partial: 0,
    failed: 0,
    none: 0
  };
  
  for (const dayKey in schedule) {
    if (!schedule[dayKey]) continue;
    
    for (const hourKey in schedule[dayKey]) {
      const scheduleItem = schedule[dayKey][hourKey];
      
      if (scheduleItem && scheduleItem.categoryId) {
        try {
          const uniqueKey = generateScheduleKey(scheduleItem.date, dayKey, hourKey);
          const achievement = achievements ? achievements[uniqueKey] : null;
          
          // 実績の状態を統計
          if (achievement) {
            if (achievement.status === 'completed') achievementStats.completed++;
            else if (achievement.status === 'partial') achievementStats.partial++;
            else if (achievement.status === 'failed') achievementStats.failed++;
          } else {
            achievementStats.none++;
          }
          
          // includeAchievementsInStats=true: 実績のある項目だけカウント
          // includeAchievementsInStats=false: すべての計画された項目をカウント
          // 重要：下記の条件討符は「!」（否定）から始まるので、論理が反転しています。
          // 「!includeAchievementsInStats」は「実績のみを含める」がオフのときに真となります
          const shouldCount = !includeAchievementsInStats || 
                            (includeAchievementsInStats && achievement && 
                             (achievement.status === 'completed' || achievement.status === 'partial'));
          
          // 条件決定のデバッグ出力
          console.log(`状態確認[${uniqueKey}]:`, {
            includeAchievementsInStats, 
            hasAchievement: !!achievement,
            status: achievement ? achievement.status : 'none',
            shouldCount
          });
          
          if (shouldCount) {
            totalMinutes += 60;
            countedItems++;
          } else {
            skippedItems++;
          }
        } catch (error) {
          console.error('時間計算中のエラー:', error, '項目:', scheduleItem);
        }
      }
    }
  }
  
  // 計算結果のデバッグ情報
  console.log('集計結果 - 週間合計:', {
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    countedItems,
    skippedItems,
    achievementStats
  });
  
  return Math.round(totalMinutes / 60 * 10) / 10;
};

export const calculateMonthStudyHours = (weeklySchedules, achievements = {}, includeAchievementsInStats = false) => {
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
    console.error('月間学習時間計算中にエラーが発生しました:', error);
  }
  
  return Math.round(totalMonthHours * 10) / 10;
};