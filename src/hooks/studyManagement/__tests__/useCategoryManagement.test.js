import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCategoryManagement } from '../useCategoryManagement';
import { AuthContext } from '../../../contexts/AuthContext';

// モック関数とデータ
const mockUser = { uid: 'test-user' };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ currentUser: mockUser }}>
    {children}
  </AuthContext.Provider>
);

describe('useCategoryManagement Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('カテゴリの追加と取得', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCategoryManagement(), { wrapper });

    // カテゴリ追加
    await act(async () => {
      const categoryId = await result.current.addCategory('新しい教科', '#FF0000');
      expect(categoryId).toBeTruthy();
    });

    // カテゴリ取得
    await act(async () => {
      const categories = await result.current.fetchCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[categories.length - 1].name).toBe('新しい教科');
      expect(categories[categories.length - 1].color).toBe('#FF0000');
    });
  });

  test('カテゴリの初期値', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCategoryManagement(), { wrapper });

    const categories = await result.current.fetchCategories();
    expect(categories.length).toBeGreaterThan(0);
  });
});
