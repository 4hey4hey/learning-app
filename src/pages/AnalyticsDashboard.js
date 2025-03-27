import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import CategoryDistributionChart from '../components/Analytics/CategoryDistributionChart';
import MonthlyStudyChart from '../components/Analytics/MonthlyStudyChart';
import SubjectSummary from '../components/Analytics/SubjectSummary';
import DateRangeSelector from '../components/Analytics/DateRange/DateRangeSelector';
import { DateRangeProvider } from '../contexts/DateRangeContext';
import { AnalyticsDataProvider, useAnalyticsData } from '../contexts/AnalyticsDataContext';

const AnalyticsDashboardContent = () => {
  const { isLoading, error, refreshData, lastUpdated } = useAnalyticsData();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ダッシュボードがマウントされたらデータを更新
  useEffect(() => {
    console.log('分析ダッシュボード: マウント時にデータを更新します');
    refreshData();
  }, [refreshData]);

  // lastUpdatedの変更を監視
  useEffect(() => {
    console.log('最終更新時刻が変更されました:', lastUpdated);
  }, [lastUpdated]);

  // 手動更新ハンドラー
  const handleRefresh = () => {
    console.log('手動更新を実行します');
    setLastRefresh(new Date());
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 最終更新時刻を整形
  const formatLastUpdated = () => {
    if (lastUpdated) {
      return lastUpdated.toLocaleString();
    } else {
      return '未更新';
    }
  };

  return (
    <>
      {/* ヘッダーと更新ボタン */}
      <div className="mb-6">
        <div className="flex flex-col mb-4">
          <h1 className="text-2xl font-bold text-gray-800">学習実績分析ダッシュボード</h1>
          <p className="text-gray-600">あなたの学習状況を分析します</p>
        </div>
        
        {/* 更新ボタン - シンプルな実装 */}
        <div className="mb-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">最終更新: {formatLastUpdated()}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              最新データに更新
            </button>
          </div>
        </div>
      </div>

      {/* 期間選択コンポーネント */}
      <DateRangeSelector />

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* チャートと統計 */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">期間別学習推移</h2>
          <MonthlyStudyChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">教科別実績集計</h2>
          <SubjectSummary />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">カテゴリ別学習実績</h2>
          <CategoryDistributionChart />
        </div>
      </div>
    </>
  );
};

// ラッパーコンポーネント
const AnalyticsDashboard = () => {
  return (
    <MainLayout>
      <DateRangeProvider>
        <AnalyticsDataProvider>
          <AnalyticsDashboardContent />
        </AnalyticsDataProvider>
      </DateRangeProvider>
    </MainLayout>
  );
};

export default AnalyticsDashboard;