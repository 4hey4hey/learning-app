import { 
  parseISO, 
  isWithinInterval, 
  isSameDay, 
  format 
} from 'date-fns';
import { generateAchievementKey } from './achievementUtils';
import { getDayKeyFromDate, normalizeDate } from './timeUtils';

/**
 * カテゴリ別学習時間を計算する関数
 * 実績データとスケジュールデータを元に、カテゴリ別の学習時間を計算します
 * @param {Object} scheduleData スケジュールデータ
 * @param {Array} categories カテゴリデータの配列
 * @param {Date} startDate 期間開始日
 * @param {Date} endDate 期間終了日
 * @param {Object} achievements 実績データ
 * @returns {Object} カテゴリ別学習時間と合計時間
 */
export const calculateCategoryHoursByDateRange = (
  scheduleData, 
  categories, 
  startDate, 
  endDate,
  achievements = {}
) => {
  // カテゴリ別の学習時間を保持するオブジェクト
  const categoryHours = initializeCategoryHours(categories);
  let totalHours = 0;

  // スケジュールアイテムをdayKeyとhourKeyでマップする
  const scheduleItemMap = createScheduleItemMap(scheduleData);

  // 実績データを処理して集計
  const result = processAchievements(achievements, scheduleItemMap, categoryHours);
  
  return {
    categoryHours: result.categoryHours,
    totalHours: result.totalHours
  };
};

/**
 * カテゴリごとの学習時間オブジェクトを初期化する
 * @param {Array} categories カテゴリデータの配列
 * @returns {Object} 初期化されたカテゴリ時間オブジェクト
 */
function initializeCategoryHours(categories) {
  const categoryHours = {};
  
  categories.forEach(category => {
    categoryHours[category.id] = {
      id: category.id,
      name: category.name,
      color: category.color,
      hours: 0
    };
  });
  
  return categoryHours;
}

/**
 * スケジュールデータからdayKeyとhourKeyをキーとしたマップを作成する
 * @param {Object} scheduleData スケジュールデータ
 * @returns {Object} dayKey_hourKeyをキーとしたスケジュールアイテムのマップ
 */
function createScheduleItemMap(scheduleData) {
  const scheduleItemMap = {};
  
  Object.values(scheduleData).forEach(weekData => {
    Object.entries(weekData).forEach(([dayKey, dayData]) => {
      if (!dayData) return;
      
      Object.entries(dayData).forEach(([hourKey, hourData]) => {
        if (hourData && hourData.categoryId) {
          const key = `${dayKey}_${hourKey}`;
          scheduleItemMap[key] = hourData;
        }
      });
    });
  });
  
  return scheduleItemMap;
}

/**
 * 実績データを処理して学習時間を集計する
 * @param {Object} achievements 実績データ
 * @param {Object} scheduleItemMap スケジュールアイテムのマップ
 * @param {Object} categoryHours カテゴリ別学習時間
 * @returns {Object} 更新されたカテゴリ時間と合計時間
 */
function processAchievements(achievements, scheduleItemMap, categoryHours) {
  let totalHours = 0;
  
  Object.entries(achievements).forEach(([key, achievement]) => {
    try {
      // 実績データの検証
      if (!isValidAchievement(achievement)) {
        return;
      }
      
      // スケジュールアイテムの取得
      const { scheduleItem, categoryId } = getScheduleItemFromAchievement(
        achievement, 
        scheduleItemMap
      );
      
      if (!scheduleItem || !categoryId || !categoryHours[categoryId]) {
        return;
      }
      
      // 実績時間の計算と加算
      const hoursToAdd = calculateHoursFromStatus(achievement.status);
      if (hoursToAdd > 0) {
        categoryHours[categoryId].hours += hoursToAdd;
        totalHours += hoursToAdd;
      }
    } catch (error) {
      console.error('実績処理エラー:', error);
    }
  });
  
  return { categoryHours, totalHours };
}

/**
 * 実績データが有効かどうかを確認する
 * @param {Object} achievement 実績データ
 * @returns {boolean} 有効かどうか
 */
function isValidAchievement(achievement) {
  return achievement && 
         achievement.status && 
         achievement.dayKey && 
         achievement.hourKey;
}

/**
 * 実績データから対応するスケジュールアイテムとカテゴリIDを取得する
 * @param {Object} achievement 実績データ
 * @param {Object} scheduleItemMap スケジュールアイテムのマップ
 * @returns {Object} スケジュールアイテムとカテゴリID
 */
function getScheduleItemFromAchievement(achievement, scheduleItemMap) {
  const { dayKey, hourKey } = achievement;
  const scheduleItemKey = `${dayKey}_${hourKey}`;
  const scheduleItem = scheduleItemMap[scheduleItemKey];
  
  return {
    scheduleItem,
    categoryId: scheduleItem ? scheduleItem.categoryId : null
  };
}

/**
 * 実績ステータスから学習時間を計算する
 * @param {string} status 実績ステータス
 * @returns {number} 学習時間
 */
function calculateHoursFromStatus(status) {
  switch (status) {
    case 'completed':
      return 1;
    case 'partial':
      return 0.5;
    default:
      return 0;
  }
}