import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { useFirestore } from '../useFirestore';
import { generateEmptyWeekSchedule, formatDateToString, getWeekStartDate, getWeekIdentifier } from '../../utils/timeUtils';

/**
 * スケジュール管理カスタムフック
 * 週単位のスケジュールを管理
 * @param {Date} externalSelectedWeek - 外部から渡される選択中の週
 * @param {Function} onWeekChange - 週が変更されたときに呼ばれるコールバック
 */
export const useScheduleManagement = (externalSelectedWeek, onWeekChange) => {
  const { currentUser } = useAuth();
  const { getDateSpecificData, setDocument, loading: firestoreLoading } = useFirestore();
  const [schedule, setSchedule] = useState(() => generateEmptyWeekSchedule());
  const [internalSelectedWeek, setInternalSelectedWeek] = useState(() => {
    // 外部から渡された週があればそれを使用
    if (externalSelectedWeek) {
      const normalizedWeek = getWeekStartDate(externalSelectedWeek);
      normalizedWeek.setHours(0, 0, 0, 0);
      return normalizedWeek;
    }
    
    // ローカルストレージから選択中の週を取得する試み
    try {
      const savedWeek = localStorage.getItem('selectedWeek');
      if (savedWeek) {
        const parsedDate = new Date(savedWeek);
        // 有効な日付か確認
        if (!isNaN(parsedDate.getTime())) {
          console.log('ローカルストレージから週を復元:', parsedDate.toISOString());
          return parsedDate;
        }
      }
    } catch (error) {
      console.warn('選択中の週の読み込みエラー:', error);
    }

    // デフォルトは今週
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    // 月曜日を週の開始に設定
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });
  const [loading, setLoading] = useState(true);
  
  // 外部からの週の変更を監視
  useEffect(() => {
    if (externalSelectedWeek) {
      const normalizedWeek = getWeekStartDate(externalSelectedWeek);
      normalizedWeek.setHours(0, 0, 0, 0);
      setInternalSelectedWeek(normalizedWeek);
    }
  }, [externalSelectedWeek]);
  

  /**
   * データの変更を検出する関数
   * @param {Object} oldData - 変更前のデータ
   * @param {Object} newData - 変更後のデータ
   * @returns {boolean} 変更があるかどうか
   */
  const hasChanges = useCallback((oldData, newData) => {
    if (!oldData && !newData) return false;
    if (!oldData || !newData) return true;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }, []);

  
  /**
   * 週を変更する(ローカルストレージにも保存)
   * @param {Date} newWeek - 新しい週の開始日
   */
  const setSelectedWeekWithStorage = useCallback((newWeek) => {
    // 週の開始日を正規化して保存
    const normalizedWeek = getWeekStartDate(newWeek);
    normalizedWeek.setHours(0, 0, 0, 0);
    setInternalSelectedWeek(normalizedWeek);
    
    // 外部の状態も同期更新
    if (onWeekChange) {
      onWeekChange(normalizedWeek);
    }
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('selectedWeek', normalizedWeek.toISOString());
      console.log('選択中の週を保存:', normalizedWeek.toISOString());
    } catch (error) {
      console.warn('週の保存エラー:', error);
    }
  }, [onWeekChange]);
  
  /**
   * スケジュールの構造を検証して修復する関数
   * @param {Object} inputSchedule - 入力スケジュール
   * @param {Date} startDate - 週の開始日
   * @returns {Object} 修復されたスケジュール
   */
  const validateAndFixScheduleStructure = (inputSchedule, startDate) => {
    const days = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
    const hours = Array.from({ length: 14 }, (_, i) => `hour${i + 9}`);
    
    // 安全な開始日を保証
    const safeStartDate = startDate ? new Date(startDate) : new Date();
    // 時間部分を確実にリセット
    safeStartDate.setHours(0, 0, 0, 0);
    
    const emptySchedule = generateEmptyWeekSchedule(safeStartDate);
    
    // 入力がオブジェクトでない場合は空のスケジュールを返す
    if (!inputSchedule || typeof inputSchedule !== 'object') {
      console.warn('無効なスケジュール構造を修復しています');
      return emptySchedule;
    }
    
    // 日付の検証と修正関数
    const fixDateTime = (date, dayIndex) => {
      if (!date) {
        // 日付が未設定の場合、週の開始日から計算
        const calculatedDate = new Date(safeStartDate);
        calculatedDate.setDate(safeStartDate.getDate() + dayIndex);
        calculatedDate.setHours(0, 0, 0, 0);
        return calculatedDate;
      }
      
      // 既存の日付を正規化
      let normalizedDate;
      try {
        if (typeof date === 'string') {
          normalizedDate = new Date(date);
        } else if (date instanceof Date) {
          normalizedDate = new Date(date.getTime());
        } else if (date && typeof date === 'object' && 'seconds' in date) {
          // FirestoreのTimestampからの変換
          normalizedDate = new Date(date.seconds * 1000);
        } else {
          throw new Error('無効な日付形式');
        }
        
        // 日付が有効か確認
        if (isNaN(normalizedDate.getTime())) {
          throw new Error('無効な日付値');
        }
      } catch (error) {
        console.warn(`日付のフォーマットエラー: ${error.message}. 週開始日から日付を再計算します。`);
        // エラーが発生した場合は週の開始日から計算
        normalizedDate = new Date(safeStartDate);
        normalizedDate.setDate(safeStartDate.getDate() + dayIndex);
      }
      
      // 年月日のみ保持し、時分秒をリセット
      normalizedDate.setHours(0, 0, 0, 0);
      return normalizedDate;
    };
    
    // 正しい構造を持つスケジュールを作成
    const fixedSchedule = { ...emptySchedule };
    
    // 各曜日と時間のデータを検証して修復
    days.forEach((day, dayIndex) => {
      if (inputSchedule[day] && typeof inputSchedule[day] === 'object') {
        if (!fixedSchedule[day]) {
          fixedSchedule[day] = {};
        }
        
        hours.forEach(hour => {
          // 元のスケジュールにアイテムがある場合
          if (inputSchedule[day][hour]) {
            // 既存のスケジュールアイテムを取得
            const item = {...inputSchedule[day][hour]};
            
            // 日付がない場合は適切な日付を設定
            if (!item.date) {
              item.date = fixDateTime(null, dayIndex);
              console.log(`日付修復: ${day}-${hour} に日付を設定しました`);
            } else {
              // 既存の日付を正規化
              item.date = fixDateTime(item.date, dayIndex);
            }
            
            fixedSchedule[day][hour] = item;
          } else {
            // アイテムがない場合は空のプレースホルダーを設定
            fixedSchedule[day][hour] = null;
          }
        });
      } else {
        // 曜日キーが存在しない場合は作成
        fixedSchedule[day] = {};
        
        // 時間帯を初期化
        hours.forEach(hour => {
          fixedSchedule[day][hour] = null;
        });
      }
    });
    
    return fixedSchedule;
  };
  
  /**
   * スケジュールデータの取得
   * @param {Date} weekStart - 週の開始日
   * @returns {Promise<Object>} 週間スケジュールデータ
   */
  const fetchSchedule = useCallback(async (weekStart) => {
    // 安全チェック - 引数が渡されない場合は現在の週を使用
    const normalizedStartDate = getWeekStartDate(weekStart || internalSelectedWeek);
    // 時間部分を確実にリセット
    normalizedStartDate.setHours(0, 0, 0, 0);
    // 週識別子を取得 - 常に同じ週には同じキーを使用
    const weekKey = getWeekIdentifier(normalizedStartDate);
    
    // デバッグ出力
    console.log(`正規化された週の開始日: ${weekKey}`, normalizedStartDate);
    
    setLoading(true);

    try {
      const dateStr = weekKey;
      
      if (currentUser) {
        // Firestoreから特定の週のスケジュールを取得
        try {
          const scheduleData = await getDateSpecificData('schedules', dateStr);
            
          // スケジュールが存在しない場合は空のスケジュールを生成
          if (!scheduleData) {
            // 空のスケジュールを生成
            const emptySchedule = generateEmptyWeekSchedule(normalizedStartDate);
            
            // 初期状態ではデータベースに保存しない
            // 実際に予定が追加された時に初めて保存する
            setSchedule(emptySchedule);
            return emptySchedule;
          }
          
          // スケジュールの構造を検証して修復
          const validatedSchedule = validateAndFixScheduleStructure(scheduleData, normalizedStartDate);

          // 変更があるか確認
          const hasDataChanged = hasChanges(scheduleData, validatedSchedule);

          // 修正が必要な場合のみ保存
          if (hasDataChanged) {
            console.log('スケジュールの構造を修正しました。修正を保存します。');
            await setDocument('schedules', dateStr, validatedSchedule);
          }
          
          setSchedule(validatedSchedule);
          return validatedSchedule;
        } catch (error) {
          console.error('スケジュール取得エラー:', error);
          const defaultSchedule = generateEmptyWeekSchedule(normalizedStartDate);
          setSchedule(defaultSchedule);
          return defaultSchedule;
        }
      } else {
        // ユーザーがログインしていない場合は空のスケジュールを返す
        const defaultSchedule = generateEmptyWeekSchedule(normalizedStartDate);
        setSchedule(defaultSchedule);
        return defaultSchedule;
      }
    } catch (error) {
      console.error('スケジュール取得エラー:', error);
      // エラー時はデフォルトの空スケジュールを返す
      const defaultSchedule = generateEmptyWeekSchedule(normalizedStartDate || new Date());
      setSchedule(defaultSchedule);
      return defaultSchedule;
    } finally {
      setLoading(false);
    }
  }, [currentUser, internalSelectedWeek, getDateSpecificData, setDocument, hasChanges]);

  // 初回ロード時のスケジュール取得
  useEffect(() => {
    // スケジュールを読み込み
    fetchSchedule(internalSelectedWeek);
  }, [internalSelectedWeek, fetchSchedule]);

  /**
   * スケジュールアイテムの追加
   * @param {string} dayKey - 曜日キー (day1-day7)
   * @param {string} hourKey - 時間キー (hour9-hour22)
   * @param {string} categoryId - カテゴリID
   * @returns {Promise<string>} 追加されたアイテムのID
   */
  const addScheduleItem = useCallback(async (dayKey, hourKey, categoryId) => {
    if (!dayKey || !hourKey || !categoryId) {
      throw new Error('曜日、時間、カテゴリIDは必須です');
    }

    try {
      setLoading(true);
      
      // 週の開始日を取得
      const weekStart = getWeekStartDate(internalSelectedWeek);
      // 時間部分を確実にリセット
      weekStart.setHours(0, 0, 0, 0);
      // 週識別子を取得してキーとして使用
      const weekKey = getWeekIdentifier(weekStart);
      
      // スケジュールアイテムの日付を計算
      const dayIndex = parseInt(dayKey.replace('day', '')) - 1;
      const itemDate = new Date(weekStart);
      itemDate.setDate(weekStart.getDate() + dayIndex);
      // 時間部分を確実にリセット
      itemDate.setHours(0, 0, 0, 0);
      console.log(`addScheduleItem - スケジュール日付計算: 週開始日 ${weekStart.toISOString()}, インデックス ${dayIndex}, 結果 ${itemDate.toISOString()}`);
      
      // 現在のスケジュールを再読み込み
      let currentSchedule;
      
      if (currentUser) {
        // オンラインモードの場合は最新データを取得
        try {
          const firestoreData = await getDateSpecificData('schedules', weekKey);
          if (firestoreData) {
            // 存在するデータを使用
            currentSchedule = firestoreData;
            console.log('オンラインモード: Firestoreから既存のスケジュールを読み込みました');
          } else {
            // 存在しない場合は新規作成
            // 完全に空のスケジュールを生成
            currentSchedule = generateEmptyWeekSchedule(weekStart);
            console.log('オンラインモード: 空のスケジュールを作成');
          }
        } catch (error) {
          console.error('Firestoreからのスケジュール取得エラー:', error);
          // エラー時は現在のスケジュールを利用
          currentSchedule = { ...schedule };
        }
      } else {
        // 現在の状態を使用
        currentSchedule = JSON.parse(JSON.stringify(schedule));
      }
      
      // スケジュールをディープコピー
      const newSchedule = JSON.parse(JSON.stringify(currentSchedule));
      
      // 日付が正しく設定されているか確認
      if (!newSchedule[dayKey]) {
        newSchedule[dayKey] = {};
      }
      
      // 既存のアイテムと同じカテゴリの場合は書き込みをスキップ
      const existingItem = newSchedule[dayKey][hourKey];
      if (existingItem && existingItem.categoryId === categoryId) {
        console.log('同じカテゴリのアイテムが既に存在します。更新をスキップします');
        setLoading(false);
        return existingItem.id;
      }
      
      // スケジュールアイテムを追加
      const itemId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // 正しい日付形式を確保
      const safeDate = new Date(itemDate);
      if (isNaN(safeDate.getTime())) {
        // 無効な日付の場合は現在の日付を使用
        console.warn('無効な日付が設定されました。現在の日付を使用します。');
        safeDate.setTime(new Date().getTime());
      }
      
      newSchedule[dayKey][hourKey] = { 
        id: itemId,
        categoryId,
        date: safeDate
      };
      
      // 変更があった場合のみ保存
      const hasDataChanged = hasChanges(currentSchedule, newSchedule);
      
      if (hasDataChanged) {
        console.log('変更を検出しました。データを保存します。');
        // データを更新
        console.log('Firestoreにスケジュールを保存します', weekKey);
        await setDocument('schedules', weekKey, newSchedule);
      } else {
        console.log('実質的な変更がありません。書き込みをスキップします。');
      }
      
      // スケジュール状態を更新
      setSchedule(newSchedule);
      
      return itemId;
    } catch (error) {
      console.error('スケジュールアイテム追加エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [schedule, internalSelectedWeek, setDocument, currentUser, getDateSpecificData, hasChanges]);

  /**
   * スケジュールアイテムの削除
   * @param {string} dayKey - 曜日キー (day1-day7)
   * @param {string} hourKey - 時間キー (hour9-hour22)
   * @returns {Promise<boolean>} 削除成功かどうか
   */
  const deleteScheduleItem = useCallback(async (dayKey, hourKey) => {
    if (!dayKey || !hourKey) {
      throw new Error('曜日と時間は必須です');
    }

    try {
      setLoading(true);
      
      // 週の開始日を取得
      const weekStart = getWeekStartDate(internalSelectedWeek);
      // 時間部分を確実にリセット
      weekStart.setHours(0, 0, 0, 0);
      // 週識別子を取得
      const weekKey = getWeekIdentifier(weekStart);
      
      // 現在のスケジュールを再読み込み
      let currentSchedule;
      
      if (currentUser) {
        const storageData = await getDateSpecificData('schedules', weekKey);
        
        if (storageData) {
          try {
            currentSchedule = storageData;
          } catch (error) {
            console.error('スケジュールデータの解析エラー:', error);
            currentSchedule = { ...schedule };
          }
        } else {
          currentSchedule = { ...schedule };
        }
      } else {
        currentSchedule = { ...schedule };
      }
      
      // スケジュールを複製
      const newSchedule = JSON.parse(JSON.stringify(currentSchedule));
      
      // 変更が必要か確認
      const itemExists = newSchedule[dayKey] && newSchedule[dayKey][hourKey] !== null;
      
      // 削除するアイテムが存在しない場合は何もしない
      if (!itemExists) {
        console.log('削除するアイテムが存在しません。スキップします。');
        setLoading(false);
        return true;
      }
      
      // スケジュールアイテムを削除
      if (newSchedule[dayKey] && hourKey in newSchedule[dayKey]) {
        newSchedule[dayKey][hourKey] = null;
      }
      
      // 変更があった場合のみ保存
      const hasDataChanged = hasChanges(currentSchedule, newSchedule);
      
      if (hasDataChanged) {
        console.log('変更を検出しました。データを保存します。');
        // Firestoreに保存
        await setDocument('schedules', weekKey, newSchedule);
      } else {
        console.log('実質的な変更がありません。書き込みをスキップします。');
      }
      
      // スケジュール状態を更新
      setSchedule(newSchedule);
      
      return true;
    } catch (error) {
      console.error('スケジュールアイテム削除エラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [schedule, internalSelectedWeek, setDocument, currentUser, getDateSpecificData, hasChanges]);

  /**
   * 週を変更する
   * @param {string} direction - 'next' または 'prev'
   */
  const changeWeek = useCallback((direction) => {
    const currentWeek = new Date(internalSelectedWeek);
    // 時間部分をリセット
    currentWeek.setHours(0, 0, 0, 0);
    
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    
    // 週の開始日を取得して正規化
    const normalizedDate = getWeekStartDate(newDate);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // 変更がある場合のみ更新
    if (normalizedDate.getTime() === internalSelectedWeek.getTime()) {
      console.log('週の変更がありません。変更をスキップします。');
      return;
    }
    
    // 内部状態を更新
    setInternalSelectedWeek(normalizedDate);
    
    // 外部のコールバックを実行してコンテキストを同期
    if (onWeekChange) {
      onWeekChange(normalizedDate);
    }
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('selectedWeek', normalizedDate.toISOString());
    } catch (error) {
      console.warn('週の保存エラー:', error);
    }
    
    // 新しい週のデータを取得
    fetchSchedule(normalizedDate);
  }, [internalSelectedWeek, fetchSchedule, onWeekChange]);

  return {
    schedule,
    selectedWeek: internalSelectedWeek,
    loading: loading || firestoreLoading,
    fetchSchedule,
    addScheduleItem,
    deleteScheduleItem,
    changeWeek,
    setSelectedWeek: setInternalSelectedWeek,
    setSelectedWeekWithStorage
  };
};
