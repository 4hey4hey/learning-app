import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useScheduleManagement } from '../useScheduleManagement';
import { AuthContext } from '../../../contexts/AuthContext';
import { generateEmptyWeekSchedule } from '../../../utils/timeUtils';

// モック関数とデータ
const mockUser = { uid: 'test-user' };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ currentUser: mockUser }}>
    {children}
  </AuthContext.Provider>
);

describe('useScheduleManagement Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('初期スケジュールの生成', () => {
    const { result } = renderHook(() => useScheduleManagement(), { wrapper });
    
    expect(result.current.schedule).toEqual(generateEmptyWeekSchedule());
  });

  test('スケジュールアイテムの追加', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduleManagement(), { wrapper });

    // スケジュールアイテムを追加
    await act(async () => {
      const categoryId = 'test-category';
      const itemId = await result.current.addScheduleItem('day1', 'hour10', categoryId);
      
      expect(itemId).toBeTruthy();
      expect(result.current.schedule.day1.hour10).toBeTruthy();
      expect(result.current.schedule.day1.hour10.categoryId).toBe(categoryId);
    });
  });

  test('スケジュールアイテムの削除', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduleManagement(), { wrapper });

    // スケジュールアイテムを追加
    await act(async () => {
      const categoryId = 'test-category';
      await result.current.addScheduleItem('day1', 'hour10', categoryId);
    });

    // スケジュールアイテムを削除
    await act(async () => {
      const deleted = await result.current.deleteScheduleItem('day1', 'hour10');
      
      expect(deleted).toBe(true);
      expect(result.current.schedule.day1.hour10).toBeFalsy();
    });
  });

  test('週の変更', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduleManagement(), { wrapper });

    const initialWeek = result.current.selectedWeek;

    // 次の週に変更
    await act(() => {
      result.current.changeWeek('next');
    });

    const nextWeek = result.current.selectedWeek;
    expect(nextWeek).not.toEqual(initialWeek);
    
    // 前の週に変更
    await act(() => {
      result.current.changeWeek('prev');
    });

    const prevWeek = result.current.selectedWeek;
    expect(prevWeek).toEqual(initialWeek);
  });
});
