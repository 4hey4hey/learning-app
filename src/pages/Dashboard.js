import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import WeeklyCalendar from '../components/Calendar/WeeklyCalendar';
import CategoryManager from '../components/Categories/CategoryManager';
import StatsDashboard from '../components/Stats/StatsDashboard';
import TemplateManager from '../components/Templates/TemplateManager';
import AchievementManager from '../components/Achievements/AchievementManager';
import { useAuth } from '../hooks/useAuth';
import { useStudyState } from '../contexts/StudyStateContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { isLoading } = useStudyState();
  
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
      <div className="mb-4 no-print">
        <h1 className="text-2xl font-bold text-gray-800">
          ようこそ、{currentUser?.displayName || currentUser?.email}さん
        </h1>
        <p className="text-gray-600">効率的に学習を管理しましょう！</p>

        
        <div className="mt-3 mb-2">
          <Link to="/analytics" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            学習分析を見る
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <WeeklyCalendar />
          
          {/* 効率時間集計をカレンダーの下に配置 */}
          <div className="mt-6">
            <StatsDashboard />
          </div>
        </div>
        
        <div className="space-y-6 categories-panel">
          <CategoryManager />
          <TemplateManager />
          <AchievementManager />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
