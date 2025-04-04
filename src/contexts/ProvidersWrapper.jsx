// src/contexts/ProvidersWrapper.jsx

// すべてのコンテキストプロバイダーを適切な順序で統合するラッパーコンポーネント
// このコンポーネントはApp.jsで使用され、すべてのプロバイダーを効率的に提供します

import React from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { SyncProvider } from './SyncContext';
import { CategoryProvider } from './CategoryContext';
import { ScheduleProvider } from './ScheduleContext';
import { AchievementProvider } from './AchievementContext';
import { TemplateProvider } from './TemplateContext';
import { StudyStateProvider } from './StudyStateContext';
import { DateRangeProvider } from './DateRangeContext';
import { PokemonAchievementProvider } from './PokemonAchievementContext';
import { GoalsProvider } from './GoalsContext';

// 依存関係の順序を考慮したプロバイダーの配置
// AuthProvider: 認証状態を管理（最も上位）
// ToastProvider: 通知メッセージを管理
// SyncProvider: データ同期状態を管理
// CategoryProvider: カテゴリデータを管理
// ScheduleProvider: スケジュールデータを管理
// AchievementProvider: 実績データを管理（ScheduleProviderに依存）
// TemplateProvider: テンプレートデータを管理（ScheduleProviderに依存）
// StudyStateProvider: 共有状態を管理（他のすべてのプロバイダーに依存）

const ProvidersWrapper = ({ children }) => {
  // 全コンテキストが正しく初期化されるようにエラーハンドリングを追加
  try {
    return (
      <AuthProvider>
        <ToastProvider>
          <SyncProvider>
            <CategoryProvider>
              <ScheduleProvider>
                <AchievementProvider>
                  <TemplateProvider>
                    <DateRangeProvider>
                      <StudyStateProvider>
                        <GoalsProvider>
                          <PokemonAchievementProvider>
                            {children}
                          </PokemonAchievementProvider>
                        </GoalsProvider>
                      </StudyStateProvider>
                    </DateRangeProvider>
                  </TemplateProvider>
                </AchievementProvider>
              </ScheduleProvider>
            </CategoryProvider>
          </SyncProvider>
        </ToastProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('コンテキスト初期化エラー:', error);
    // エラー発生時のフォールバック表示
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">初期化エラー</h1>
          <p className="text-gray-700 mb-4">アプリケーションの初期化中に問題が発生しました。ページを再読み込みしてみてください。</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
};

export default ProvidersWrapper;