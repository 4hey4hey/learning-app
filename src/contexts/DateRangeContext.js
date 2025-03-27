// src/contexts/DateRangeContext.js

import React, { createContext, useState, useContext, useCallback, useMemo, useRef } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';

// コンテキスト作成
const DateRangeContext = createContext();

// カスタムフック
export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

export const DateRangeProvider = ({ children }) => {
  // 初期値は今週
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // 月曜始まり
  });
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return endOfWeek(today, { weekStartsOn: 1 });
  });
  
  // 日付変更中フラグを追跡
  const isChangingRef = useRef(false);

  // 日付範囲の更新
  const setDateRange = useCallback((start, end) => {
    // 入力チェック
    if (!start || !end) {
      console.error('無効な日付範囲:', { start, end });
      return;
    }

    // 引数が日付オブジェクトでない場合、変換を試みる
    const newStartDate = start instanceof Date ? start : new Date(start);
    const newEndDate = end instanceof Date ? end : new Date(end);
    
    // 有効な日付か確認
    if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
      console.error('無効な日付形式:', { start, end });
      return;
    }
    
    // 現在の値と同じ場合は更新をスキップ
    if (
      startDate && endDate &&
      startDate.getTime() === newStartDate.getTime() && 
      endDate.getTime() === newEndDate.getTime()
    ) {
      console.log('日付範囲が同じため更新をスキップします');
      return;
    }
    
    console.log('日付範囲を更新します:', { 
      現在の開始日: startDate ? startDate.toISOString() : 'null',
      現在の終了日: endDate ? endDate.toISOString() : 'null',
      新しい開始日: newStartDate.toISOString(),
      新しい終了日: newEndDate.toISOString() 
    });
    
    // 状態を更新
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // 更新後の状態を確認するログ
    setTimeout(() => {
      console.log('日付範囲更新後の状態:', { 
        開始日: newStartDate.toISOString(),
        終了日: newEndDate.toISOString()
      });
    }, 0);
    
  }, []); // 依存配列から startDate, endDate を削除

  // 値をメモ化
  const value = useMemo(() => ({
    startDate,
    endDate,
    setDateRange
  }), [startDate, endDate, setDateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};
