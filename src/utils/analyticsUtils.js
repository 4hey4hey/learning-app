/**
 * 期間の長さに基づいて適切な間隔のデータポイントを生成する
 * @param {Date} startDate - 期間開始日
 * @param {Date} endDate - 期間終了日
 * @returns {Object} 間隔とデータポイントの配列
 */
export const generatePeriodDataPoints = (startDate, endDate) => {
  // 期間に基づいて適切な間隔でデータをグループ化
  const totalDays = differenceInDays(endDate, startDate) + 1;
  let interval;
  let intervalLabel;
  
  // 期間の長さに応じて適切な間隔を選択
  if (totalDays <= 14) {
    // 2週間以内: 日ごと
    interval = 'day';
    intervalLabel = '日別';
  } else if (totalDays <= 90) {
    // 3ヶ月以内: 週ごと
    interval = 'week';
    intervalLabel = '週別';
  } else {
    // それ以上: 月ごと
    interval = 'month';
    intervalLabel = '月別';
  }
  
  // 時間間隔に応じたデータポイントを生成
  let dataPoints = [];
  
  if (interval === 'day') {
    // 日ごとのデータポイント
    for (let date = new Date(startDate); isBefore(date, endDate) || date.getTime() === endDate.getTime(); date = addDays(date, 1)) {
      dataPoints.push({
        start: new Date(date),
        end: new Date(date),
        label: format(date, 'MM/dd (E)', { locale: ja })
      });
    }
  } else if (interval === 'week') {
    // 週ごとのデータポイント
    const weekStarts = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 } // 月曜始まり
    );
    
    weekStarts.forEach(weekStart => {
      const weekEnd = addDays(weekStart, 6);
      // 終了日が期間の終了日を超えないようにする
      const actualEnd = isBefore(weekEnd, endDate) ? weekEnd : endDate;
      
      dataPoints.push({
        start: weekStart,
        end: actualEnd,
        label: `${format(weekStart, 'MM/dd', { locale: ja })}週`
      });
    });
  } else {
    // 月ごとのデータポイント
    let currentMonth = startOfMonth(startDate);
    
    while (isBefore(currentMonth, endDate)) {
      const monthEnd = endOfMonth(currentMonth);
      // 終了日が期間の終了日を超えないようにする
      const actualEnd = isBefore(monthEnd, endDate) ? monthEnd : endDate;
      // 開始日が期間の開始日より前にならないようにする
      const actualStart = isBefore(startDate, currentMonth) ? currentMonth : startDate;
      
      dataPoints.push({
        start: actualStart,
        end: actualEnd,
        label: format(currentMonth, 'yyyy年MM月', { locale: ja })
      });
      
      // 次の月へ
      currentMonth = startOfMonth(addDays(endOfMonth(currentMonth), 1));
    }
  }
  
  return { interval, intervalLabel, dataPoints };
};// src/utils/analyticsUtils.js
import { isWithinInterval, parseISO, isSameDay, differenceInDays, addDays, startOfMonth, endOfMonth, eachWeekOfInterval, isBefore, format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付を正規化して比較可能な形式に変換する
 * @param {Date|string|Object} date - 様々な形式の日付 (Date, ISO文字列, Firestoreタイムスタンプなど)
 * @returns {Date} 正規化されたDateオブジェクト
 */
export const normalizeItemDate = (date) => {
  try {
    if (!date) return new Date();
    
    // Dateオブジェクトの場合
    if (date instanceof Date) {
      return date;
    }
    
    // 文字列の場合
    if (typeof date === 'string') {
      return parseISO(date);
    }
    
    // Firestoreタイムスタンプの場合
    if (date.seconds) {
      return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
    }
    
    // その他の場合はデフォルト日付
    return new Date();
  } catch (error) {
    console.error('日付の正規化エラー:', error);
    return new Date();
  }
};

/**
 * スケジュールアイテムが指定された日付範囲内かどうかを判断する
 * @param {Object} item - スケジュールアイテム
 * @param {Date} startDate - 範囲の開始日
 * @param {Date} endDate - 範囲の終了日
 * @returns {boolean} 範囲内ならtrue、そうでなければfalse
 */
export const isItemInDateRange = (item, startDate, endDate) => {
  if (!item || !item.date) return false;
  
  try {
    const itemDate = normalizeItemDate(item.date);
    
    return (
      isWithinInterval(itemDate, { start: startDate, end: endDate }) ||
      isSameDay(itemDate, startDate) ||
      isSameDay(itemDate, endDate)
    );
  } catch (error) {
    console.error('日付範囲チェックエラー:', error, item);
    return false;
  }
};

/**
 * スケジュールデータから指定された期間内のカテゴリ別時間を集計する
 * @param {Object} schedulesByDateRange - 期間内のスケジュールデータ
 * @param {Array} categories - カテゴリ一覧
 * @param {Date} startDate - 期間開始日
 * @param {Date} endDate - 期間終了日
 * @returns {Object} カテゴリIDをキーとした時間集計オブジェクト
 */
export const calculateCategoryHoursByDateRange = (schedulesByDateRange, categories, startDate, endDate) => {
  // カテゴリごとの時間を保持するオブジェクト
  const categoryHours = {};
  let totalHours = 0;
  
  // 各カテゴリを初期化
  categories.forEach(category => {
    categoryHours[category.id] = {
      id: category.id,
      name: category.name,
      hours: 0,
      color: category.color
    };
  });
  
  // 週間スケジュールデータから期間内のカテゴリ別時間を集計
  Object.values(schedulesByDateRange).forEach(weekData => {
    Object.entries(weekData).forEach(([dayKey, dayData]) => {
      if (!dayData) return;
      
      Object.entries(dayData).forEach(([hourKey, item]) => {
        if (!item || !item.categoryId) return;
        
        // 日付が指定期間内かチェック
        if (isItemInDateRange(item, startDate, endDate)) {
          const categoryId = item.categoryId;
          if (categoryHours[categoryId]) {
            categoryHours[categoryId].hours += 1;
            totalHours += 1;
          }
        }
      });
    });
  });
  
  return { categoryHours, totalHours };
};
