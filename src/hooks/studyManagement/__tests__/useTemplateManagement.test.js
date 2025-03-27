import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useTemplateManagement } from '../useTemplateManagement';
import { AuthContext } from '../../../contexts/AuthContext';
import { generateEmptyWeekSchedule } from '../../../utils/timeUtils';

// モック関数
const mockFetchSchedule = jest.fn();

// モックユーザーとデータ
const mockUser = { uid: 'test-user' };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ currentUser: mockUser }}>
    {children}
  </AuthContext.Provider>
);

describe('useTemplateManagement Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetchSchedule.mockClear();
  });

  test('テンプレートの保存と取得', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useTemplateManagement(mockFetchSchedule), 
      { wrapper }
    );

    // テンプレートを保存
    await act(async () => {
      const schedule = generateEmptyWeekSchedule();
      const templateId = await result.current.saveTemplate('テストテンプレート', schedule);
      
      expect(templateId).toBeTruthy();
    });

    // テンプレートを取得
    await act(async () => {
      const templates = await result.current.fetchTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      const lastTemplate = templates[templates.length - 1];
      expect(lastTemplate.name).toBe('テストテンプレート');
    });
  });

  test('テンプレートの適用', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useTemplateManagement(mockFetchSchedule), 
      { wrapper }
    );

    // テンプレートを保存
    let savedTemplateId;
    await act(async () => {
      const schedule = generateEmptyWeekSchedule();
      schedule.day1.hour10 = { categoryId: 'test-category' };
      savedTemplateId = await result.current.saveTemplate('適用テスト', schedule);
    });

    // テンプレートを適用
    await act(async () => {
      const selectedWeek = new Date();
      const applied = result.current.applyTemplate(savedTemplateId, selectedWeek);
      
      expect(applied).toBe(true);
      expect(mockFetchSchedule).toHaveBeenCalledWith(selectedWeek, true);
    });
  });

  test('テンプレートの削除', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useTemplateManagement(mockFetchSchedule), 
      { wrapper }
    );

    // テンプレートを保存
    let savedTemplateId;
    await act(async () => {
      const schedule = generateEmptyWeekSchedule();
      savedTemplateId = await result.current.saveTemplate('削除テスト', schedule);
    });

    // テンプレートを削除
    await act(async () => {
      const deleted = await result.current.deleteTemplate(savedTemplateId);
      
      expect(deleted).toBe(true);
    });

    // 削除後のテンプレート確認
    await act(async () => {
      const templates = await result.current.fetchTemplates();
      
      const deletedTemplate = templates.find(t => t.id === savedTemplateId);
      expect(deletedTemplate).toBeFalsy();
    });
  });

  test('ログイン状態の確認', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useTemplateManagement(mockFetchSchedule), 
      { wrapper: ({ children }) => (
        <AuthContext.Provider value={{ currentUser: null }}>
          {children}
        </AuthContext.Provider>
      )}
    );

    // テンプレートを取得
    await act(async () => {
      const templates = await result.current.fetchTemplates();
      
      // ログインしていない場合は空配列が返される
      expect(templates).toEqual([]);
    });
  });
});
