import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAchievementManagement } from '../useAchievementManagement';
import { AuthContext } from '../../../contexts/AuthContext';

// モックユーザーとデータ
const mockUser = { uid: 'test-user' };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ currentUser: mockUser }}>
    {children}
  </AuthContext.Provider>
);

const ACHIEVEMENT_STATUS = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed'
};

describe('useAchievementManagement Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('成果の保存と取得', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAchievementManagement(), { wrapper });

    const testDate = new Date();
    const achievementData = {
      description: 'テスト成果',
      hours: 2
    };

    // 成果を保存
    let savedAchievementId;
    await act(async () => {
      savedAchievementId = await result.current.saveAchievement(testDate, achievementData);
      
      expect(savedAchievementId).toBeTruthy();
    });

    // 成果を取得
    await act(async () => {
      const achievements = await result.current.fetchAchievements(testDate);
      const dateStr = testDate.toISOString().split('T')[0];
      
      expect(achievements[dateStr]).toBeTruthy();
      const savedAchievement = achievements[dateStr][savedAchievementId];
      
      expect(savedAchievement).toBeTruthy();
      expect(savedAchievement.description).toBe('テスト成果');
    });
  });

  test('成果のステータス更新', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAchievementManagement(), { wrapper });

    const testDate = new Date();
    const achievementData = {
      description: 'ステータス更新テスト',
      hours: 1
    };

    // 成果を保存
    let savedAchievementId;
    await act(async () => {
      savedAchievementId = await result.current.saveAchievement(testDate, achievementData);
    });

    // ステータスを更新
    await act(async () => {
      const updated = await result.current.updateAchievementStatus(
        savedAchievementId, 
        ACHIEVEMENT_STATUS.COMPLETED, 
        testDate
      );
      
      expect(updated).toBe(true);
    });

    // 更新の確認
    await act(async () => {
      const achievements = await result.current.fetchAchievements(testDate);
      const dateStr = testDate.toISOString().split('T')[0];
      const updatedAchievement = achievements[dateStr][savedAchievementId];
      
      expect(updatedAchievement.status).toBe(ACHIEVEMENT_STATUS.COMPLETED);
    });
  });

  test('成果の削除', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAchievementManagement(), { wrapper });

    const testDate = new Date();
    const achievementData = {
      description: '削除テスト',
      hours: 3
    };

    // 成果を保存
    let savedAchievementId;
    await act(async () => {
      savedAchievementId = await result.current.saveAchievement(testDate, achievementData);
    });

    // 成果を削除
    await act(async () => {
      const deleted = await result.current.deleteAchievement(savedAchievementId, testDate);
      
      expect(deleted).toBe(true);
    });

    // 削除の確認
    await act(async () => {
      const achievements = await result.current.fetchAchievements(testDate);
      const dateStr = testDate.toISOString().split('T')[0];
      
      expect(achievements[dateStr]?.[savedAchievementId]).toBeFalsy();
    });
  });

  test('実績統計設定の切り替え', () => {
    const { result } = renderHook(() => useAchievementManagement(), { wrapper });

    const initialState = result.current.includeAchievementsInStats;

    // 統計設定を切り替え
    act(() => {
      result.current.toggleIncludeAchievementsInStats();
    });

    expect(result.current.includeAchievementsInStats).toBe(!initialState);
  });
});
