import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import CategoryDistributionChart from '../components/Analytics/CategoryDistributionChart';
import MonthlyStudyChart from '../components/Analytics/MonthlyStudyChart';
import SubjectSummary from '../components/Analytics/SubjectSummary';
import DateRangeSelector from '../components/Analytics/DateRange/DateRangeSelector';
import { useAuth } from '../hooks/useAuth';
import { useStudyState } from '../contexts/StudyStateContext';
import { useDateRange } from '../contexts/DateRangeContext';

const AnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const { isLoading } = useStudyState();
  const { startDate, endDate, setDateRange } = useDateRange();
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // 日付範囲が変更されたときの処理
  const handleDateRangeChange = (start, end) => {
    setDateRange(start, end);
    // ここで必要に応じてデータ再取得などの処理を実装
    setIsDataLoading(true);
    // データ取得を模擬（実際のアプリではFirebaseからデータ取得など）
    setTimeout(() => {
      setIsDataLoading(false);
    }, 500);
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">学習分析ダッシュボード</h1>
        <p className="text-gray-600">あなたの学習状況を分析します</p>
      </div>
      
      {/* 期間選択コンポーネント */}
      <DateRangeSelector onRangeChange={handleDateRangeChange} />
      
      {isDataLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">データを読み込み中...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">期間別学習推移</h2>
              <MonthlyStudyChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">教科別集計</h2>
              <SubjectSummary startDate={startDate} endDate={endDate} />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">カテゴリ別学習時間</h2>
              <CategoryDistributionChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default AnalyticsDashboard;