// src/contexts/GoalsContext.js

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useSchedule } from './ScheduleContext';
import { useStudyState } from './StudyStateContext';
import { getWeekIdentifier } from '../utils/timeUtils';

export const GoalsContext = createContext();

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

export const GoalsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { getDocument, setDocument } = useFirestore();
  const { selectedWeek } = useSchedule();
  const { weekTotalHours } = useStudyState();
  
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 週ごとの目標を取得
  const fetchWeeklyGoal = useCallback(async () => {
    if (!currentUser) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const weekId = getWeekIdentifier(selectedWeek);
      const goalData = await getDocument('weeklyGoals', weekId);
      
      // 前週の目標を引き継ぐ処理
      if (!goalData) {
        // 現在の週の前の週を計算
        const prevWeekDate = new Date(selectedWeek);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        const prevWeekId = getWeekIdentifier(prevWeekDate);
        
        // 前週のデータを取得
        const prevWeekGoal = await getDocument('weeklyGoals', prevWeekId);
        
        // 前週のデータが存在し、次週への引継ぎ設定が有効なら新たに保存
        if (prevWeekGoal && prevWeekGoal.copyToNextWeek) {
          const newGoal = {
            weekId,
            totalGoalHours: prevWeekGoal.totalGoalHours,
            copyToNextWeek: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDocument('weeklyGoals', weekId, newGoal);
          setWeeklyGoal(newGoal);
          return newGoal;
        }
      } else {
        setWeeklyGoal(goalData);
        return goalData;
      }
      
      setWeeklyGoal(null);
      return null;
    } catch (error) {
      console.error('目標取得エラー:', error);
      setError('週間目標の取得中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedWeek, getDocument, setDocument]);
  
  // 目標の保存
  const saveWeeklyGoal = useCallback(async (goalData) => {
    if (!currentUser) {
      setError('ユーザーが認証されていません');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const weekId = getWeekIdentifier(selectedWeek);
      const updatedGoal = {
        ...goalData,
        weekId,
        updatedAt: new Date()
      };
      
      await setDocument('weeklyGoals', weekId, updatedGoal);
      setWeeklyGoal(updatedGoal);
      return true;
    } catch (error) {
      console.error('目標保存エラー:', error);
      setError('週間目標の保存中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedWeek, setDocument]);
  
  // 目標達成率の計算
  const calculateGoalProgress = useCallback(() => {
    if (!weeklyGoal) return { total: 0, remainingHours: 0 };
    
    // 総時間の達成率
    const totalProgress = weeklyGoal.totalGoalHours 
      ? Math.min(100, Math.round((weekTotalHours / weeklyGoal.totalGoalHours) * 100)) 
      : 0;
    
    return {
      total: totalProgress,
      remainingHours: Math.max(0, weeklyGoal.totalGoalHours - weekTotalHours)
    };
  }, [weeklyGoal, weekTotalHours]);
  
  // 週が変わった時に目標を取得
  useEffect(() => {
    if (currentUser) {
      fetchWeeklyGoal();
    }
  }, [selectedWeek, currentUser, fetchWeeklyGoal]);
  
  const value = {
    weeklyGoal,
    loading,
    error,
    fetchWeeklyGoal,
    saveWeeklyGoal,
    calculateGoalProgress
  };
  
  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
};