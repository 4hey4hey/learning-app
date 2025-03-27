import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import CategoryDistributionChart from '../components/Analytics/CategoryDistributionChart';
import MonthlyStudyChart from '../components/Analytics/MonthlyStudyChart';
import SubjectSummary from '../components/Analytics/SubjectSummary';
import DateRangeSelector from '../components/Analytics/DateRange/DateRangeSelector';
import { DateRangeProvider } from '../contexts/DateRangeContext';
import { AnalyticsDataProvider, useAnalyticsData } from '../contexts/AnalyticsDataContext';

const AnalyticsDashboardContent = () => {
  const { isLoading, error } = useAnalyticsData();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">学習実績分析ダッシュボード</h1>
        <p className="text-gray-600">あなたの学習状況を分析します</p>
      </div>
      
      {/* 期間選択コンポーネント */}
      <DateRangeSelector />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
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
