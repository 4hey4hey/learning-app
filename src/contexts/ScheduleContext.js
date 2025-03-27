// src/contexts/ScheduleContext.js

// スケジュール管理のための専用コンテキスト
// このコンテキストは週間スケジュールの追加・削除・取得・操作を管理します
// StudyContextから分割されたコンポーネントの一部です

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { generateEmptyWeekSchedule, getWeekStartDate, formatDateToString, getWeekIdentifier } from '../utils/timeUtils';
import { serverTimestamp } from 'firebase/firestore';

// コンテキスト作成
const ScheduleContext = createContext();

// スケジュールコンテキストを使用するためのカスタムフック
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider = ({ children }) => {
  const { currentUser, demoMode } = useAuth();
  const { getDateSpecificData, setDocument } = useFirestore();
  
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 選択された週の状態管理
  const [selectedWeek, setSelectedWeek] = useState(() => {
    try {
      // ローカルストレージから週の取得を試みる
      const storedWeek = localStorage.getItem('selectedWeek');
      if (storedWeek) {
        const parsedDate = new Date(storedWeek);
        if (!isNaN(parsedDate.getTime())) {
          return getWeekStartDate(parsedDate);
        }
      }
    } catch (error) {
      console.warn('保存された週の読み込みエラー:', error);
    }
    
    // デフォルトは現在の週
    return getWeekStartDate(new Date());
  });

  // 変更を検出するヘルパー関数
  const hasChanges = useCallback((oldData, newData) => {
    if (!oldData && !newData) return false;
    if (!oldData || !newData) return true;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }, []);

  // 週を選択し、ローカルストレージにも保存する
  const setSelectedWeekWithStorage = useCallback((newWeek) => {
    const normalizedWeek = getWeekStartDate(newWeek);
    setSelectedWeek(normalizedWeek);
    
    try {
      localStorage.setItem('selectedWeek', normalizedWeek.toISOString());
    } catch (error) {
      console.warn('週の保存エラー:', error);
    }
  }, []);

  // スケジュールデータの取得
  const fetchSchedule = useCallback(async (weekStart = null) => {
    const targetWeek = weekStart || selectedWeek;
    const normalizedStartDate = getWeekStartDate(targetWeek);
    const weekKey = getWeekIdentifier(normalizedStartDate);
    
    console.log('スケジュール取得開始:', {
      対象週: targetWeek,
      正規化開始日: normalizedStartDate,
      週キー: weekKey
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const storageKey = `demo_schedule_${weekKey}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsedSchedule = JSON.parse(storedData);
            console.log('ローカルストレージからスケジュールを読み込みました:', {
              週キー: weekKey,
              スケジュールキー数: Object.keys(parsedSchedule).length,
              day1例: parsedSchedule.day1 ? Object.keys(parsedSchedule.day1).filter(k => parsedSchedule.day1[k]).length + '個のアイテム' : 'なし'
            });
            
            // 日付データの正規化
            const processedSchedule = {};
            
            // 各曜日のデータを処理
            for (let i = 1; i <= 7; i++) {
              const dayKey = `day${i}`;
              processedSchedule[dayKey] = {};
              
              if (parsedSchedule[dayKey]) {
                // この曜日の各時間枠を処理
                for (let hour = 9; hour <= 22; hour++) {
                  const hourKey = `hour${hour}`;
                  const item = parsedSchedule[dayKey][hourKey];
                  
                  if (item && item.categoryId) {
                    // 日付を正規化
                    let itemDate;
                    try {
                      // 日付が文字列の場合は変換
                      if (typeof item.date === 'string') {
                        itemDate = new Date(item.date);
                      } 
                      // Dateオブジェクトの場合はコピー
                      else if (item.date instanceof Date) {
                        itemDate = new Date(item.date);
                      }
                      // Firestoreのタイムスタンプオブジェクトなどの場合
                      else if (item.date && typeof item.date === 'object' && 'seconds' in item.date) {
                        itemDate = new Date(item.date.seconds * 1000);
                      }
                      // 日付が存在しない場合は当日の日付を生成
                      else {
                        // 週の開始日から当日の日付を計算
                        itemDate = new Date(normalizedStartDate);
                        itemDate.setDate(normalizedStartDate.getDate() + (i - 1));
                      }
                      
                      // 時刻部分をリセット
                      itemDate.setHours(0, 0, 0, 0);
                      
                      // 日付が有効か確認
                      if (isNaN(itemDate.getTime())) {
                        throw new Error('無効な日付');
                      }
                    } catch (dateError) {
                      console.warn('日付変換エラー:', dateError, item);
                      // エラー時は当日の日付を計算
                      itemDate = new Date(normalizedStartDate);
                      itemDate.setDate(normalizedStartDate.getDate() + (i - 1));
                      itemDate.setHours(0, 0, 0, 0);
                    }
                    
                    // なぜか ID が指定されていない場合は生成する
                    const itemId = item.id || `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    
                    // 正規化したスケジュールアイテム
                    processedSchedule[dayKey][hourKey] = {
                      id: itemId,
                      categoryId: item.categoryId,
                      date: itemDate
                    };
                  } else {
                    processedSchedule[dayKey][hourKey] = null;
                  }
                }
              }
            }
            
            // デバッグ用に一部の日付を表示
            for (let i = 1; i <= 3; i++) {
              const dayKey = `day${i}`;
              if (processedSchedule[dayKey] && processedSchedule[dayKey].hour9) {
                const item = processedSchedule[dayKey].hour9;
                if (item) {
                  console.log(`${dayKey}-hour9 の日付:`, item.date);
                }
              }
            }
            
            setSchedule(processedSchedule);
            return processedSchedule;
          } catch (parseError) {
            console.error('スケジュールのパースエラー:', parseError);
          }
        }
        
        // データがない場合は空のスケジュールを生成
        const emptySchedule = generateEmptyWeekSchedule(normalizedStartDate);
        setSchedule(emptySchedule);
        return emptySchedule;
      }
      
      // 認証済みユーザーの場合はFirestoreから取得
      if (currentUser) {
        const scheduleData = await getDateSpecificData('schedules', weekKey);
        
        if (!scheduleData) {
          // スケジュールが存在しない場合は空のスケジュールを生成
          const emptySchedule = generateEmptyWeekSchedule(normalizedStartDate);
          setSchedule(emptySchedule);
          return emptySchedule;
        }
        
        // スケジュールデータのバリデーションと修正
        const validatedSchedule = validateSchedule(scheduleData, normalizedStartDate);
        
        // 変更がある場合のみFirestoreに保存
        if (hasChanges(scheduleData, validatedSchedule)) {
          await setDocument('schedules', weekKey, validatedSchedule);
        }
        
        // デバッグ用に一部の日付を表示
        for (let i = 1; i <= 3; i++) {
          const dayKey = `day${i}`;
          if (validatedSchedule[dayKey] && validatedSchedule[dayKey].hour9) {
            const item = validatedSchedule[dayKey].hour9;
            if (item) {
              console.log(`Firestore ${dayKey}-hour9 の日付:`, item.date);
            }
          }
        }
        
        setSchedule(validatedSchedule);
        return validatedSchedule;
      }
      
      // 未認証かつデモモードでない場合は空のスケジュールを返す
      const emptySchedule = generateEmptyWeekSchedule(normalizedStartDate);
      setSchedule(emptySchedule);
      return emptySchedule;
    } catch (error) {
      console.error('スケジュール取得エラー:', error);
      setError('スケジュールの取得中にエラーが発生しました。');
      
      // エラー時は空のスケジュールを返す
      const emptySchedule = generateEmptyWeekSchedule(normalizedStartDate);
      setSchedule(emptySchedule);
      return emptySchedule;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, selectedWeek, getDateSpecificData, setDocument, hasChanges]);

  // スケジュールのバリデーションと修正
  const validateSchedule = useCallback((scheduleData, weekStart) => {
    if (!scheduleData) return generateEmptyWeekSchedule(weekStart);
    
    const validatedSchedule = { ...scheduleData };
    
    console.log('スケジュールバリデーション開始', {
      weekStart,
      日数: Object.keys(scheduleData).length
    });
    
    // 各日と時間枠をチェック
    for (let i = 1; i <= 7; i++) {
      const dayKey = `day${i}`;
      
      if (!validatedSchedule[dayKey]) {
        validatedSchedule[dayKey] = {};
      }
      
      // その日の日付を計算
      const dayDate = new Date(weekStart.getTime());
      dayDate.setDate(weekStart.getDate() + (i - 1));
      dayDate.setHours(0, 0, 0, 0); // 時刻部分をリセット
      
      // 各時間枠をチェック
      for (let hour = 9; hour <= 22; hour++) {
        const hourKey = `hour${hour}`;
        
        // 時間枠が存在し、かつカテゴリIDがある場合は日付を確認
        if (validatedSchedule[dayKey][hourKey] && validatedSchedule[dayKey][hourKey].categoryId) {
          const item = validatedSchedule[dayKey][hourKey];
          
          // 日付が正しく設定されているか確認
          let validDate = dayDate;
          
          try {
            // 日付が存在する場合はそれを使う
            if (item.date) {
              // 日付が文字列の場合はDateオブジェクトに変換
              if (typeof item.date === 'string') {
                validDate = new Date(item.date);
              }
              // 日付がDateオブジェクトの場合はコピー
              else if (item.date instanceof Date) {
                validDate = new Date(item.date);
              }
              // Firestoreのタイムスタンプなどの場合
              else if (typeof item.date === 'object' && 'seconds' in item.date) {
                validDate = new Date(item.date.seconds * 1000);
              }
              
              // 日付が有効か確認
              if (isNaN(validDate.getTime())) {
                console.warn('無効な日付が見つかりました。曜日から日付を生成します:', { dayKey, hourKey, date: item.date });
                validDate = dayDate; // 無効な場合は当日の日付を使用
              }
            } else {
              // 日付が存在しない場合は曜日から計算した日付を使用
              console.warn('日付が設定されていません。曜日から日付を生成します:', { dayKey, hourKey });
              validDate = dayDate;
            }
            
            // 時間部分を確実にリセット
            validDate.setHours(0, 0, 0, 0);
          } catch (error) {
            console.error('日付検証中のエラー:', error, { dayKey, hourKey });
            validDate = dayDate; // エラー時は当日の日付を使用
          }
          
          // IDがない場合は生成
          const itemId = item.id || `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // 日付を含む修正アイテムを設定
          validatedSchedule[dayKey][hourKey] = {
            id: itemId,
            categoryId: item.categoryId,
            date: validDate
          };
          
          // デバッグ用
          if (dayKey === 'day1' && hourKey === 'hour9') {
            console.log('検証後のday1-hour9の日付:', validDate);
          }
        } else {
          // 時間枠がない場合はnullを設定
          validatedSchedule[dayKey][hourKey] = null;
        }
      }
    }
    
    return validatedSchedule;
  }, []);

  // スケジュールアイテムの追加
  const addScheduleItem = useCallback(async (dayKey, hourKey, categoryId) => {
    if (!dayKey || !hourKey || !categoryId) {
      setError('曜日、時間、カテゴリIDは必須です。');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const weekKey = getWeekIdentifier(selectedWeek);
      
      // 日付の計算
      const dayIndex = parseInt(dayKey.replace('day', '')) - 1;
      const itemDate = new Date(selectedWeek);
      itemDate.setDate(selectedWeek.getDate() + dayIndex);
      
      // アイテムID生成
      const itemId = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // 新しいスケジュールアイテム
      const newItem = {
        id: itemId,
        categoryId,
        date: itemDate
      };
      
      // 現在のスケジュールをコピー
      const updatedSchedule = { ...schedule };
      
      // 曜日キーがなければ作成
      if (!updatedSchedule[dayKey]) {
        updatedSchedule[dayKey] = {};
      }
      
      // スケジュールアイテムを設定
      updatedSchedule[dayKey][hourKey] = newItem;
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        localStorage.setItem(`demo_schedule_${weekKey}`, JSON.stringify(updatedSchedule));
        setSchedule(updatedSchedule);
        return newItem;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        await setDocument('schedules', weekKey, updatedSchedule);
        setSchedule(updatedSchedule);
        return newItem;
      }
      
      return null;
    } catch (error) {
      console.error('スケジュールアイテム追加エラー:', error);
      setError('スケジュールアイテムの追加中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, schedule, selectedWeek, setDocument]);

  // スケジュールアイテムの削除
  const deleteScheduleItem = useCallback(async (dayKey, hourKey) => {
    if (!dayKey || !hourKey) {
      setError('曜日と時間は必須です。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const weekKey = getWeekIdentifier(selectedWeek);
      
      // 現在のスケジュールをコピー
      const updatedSchedule = { ...schedule };
      
      // スケジュールアイテムが存在するか確認
      if (!updatedSchedule[dayKey] || !updatedSchedule[dayKey][hourKey]) {
        return true; // すでに削除されている場合は成功とみなす
      }
      
      // スケジュールアイテムを削除（nullを設定）
      updatedSchedule[dayKey][hourKey] = null;
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        localStorage.setItem(`demo_schedule_${weekKey}`, JSON.stringify(updatedSchedule));
        setSchedule(updatedSchedule);
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        await setDocument('schedules', weekKey, updatedSchedule);
        setSchedule(updatedSchedule);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('スケジュールアイテム削除エラー:', error);
      setError('スケジュールアイテムの削除中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, schedule, selectedWeek, setDocument]);

  // 前の週へ移動
  const goToPreviousWeek = useCallback(() => {
    const prevWeek = new Date(selectedWeek);
    prevWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeekWithStorage(prevWeek);
  }, [selectedWeek, setSelectedWeekWithStorage]);

  // 次の週へ移動
  const goToNextWeek = useCallback(() => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeekWithStorage(nextWeek);
  }, [selectedWeek, setSelectedWeekWithStorage]);

  // 今週へ移動
  const goToCurrentWeek = useCallback(() => {
    setSelectedWeekWithStorage(new Date());
  }, [setSelectedWeekWithStorage]);

  // 週が変更されたときにスケジュールを取得
  useEffect(() => {
    fetchSchedule(selectedWeek);
  }, [selectedWeek, fetchSchedule]);

  // コンテキスト値
  const value = {
    schedule,
    selectedWeek,
    loading,
    error,
    setSelectedWeek: setSelectedWeekWithStorage,
    fetchSchedule,
    addScheduleItem,
    deleteScheduleItem,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};