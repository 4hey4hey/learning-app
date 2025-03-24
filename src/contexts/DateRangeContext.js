// src/contexts/DateRangeContext.js

import React, { createContext, useState, useContext, useCallback } from 'react';
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

  // 日付範囲の更新
  const setDateRange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  // 値をメモ化
  const value = {
    startDate,
    endDate,
    setDateRange
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};
