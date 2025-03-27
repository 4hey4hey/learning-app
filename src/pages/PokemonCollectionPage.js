import React, { useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import PokemonCollection from '../components/Collection/PokemonCollection';
import AllTimeStats from '../components/Collection/AllTimeStats';
import { useStudyState } from '../contexts/StudyStateContext';

const PokemonCollectionPage = () => {
  const { isLoading, totalStudyHours, allTimeData, allTimeLoading, refreshAllTimeData } = useStudyState();
  
  // ページ読み込み時に全期間データを確認
  useEffect(() => {
    console.log('ポケモンコレクションページ: 全期間データロード状態 =', allTimeLoading);
    console.log('ポケモンコレクションページ: 全期間データ =', allTimeData);
    console.log('ポケモンコレクションページ: 総学習時間 =', totalStudyHours);
    console.log('ポケモンコレクションページ: 全期間学習時間 =', allTimeData?.totalHours);
    
    // データがない場合は再取得
    if ((!allTimeData?.totalHours || allTimeData.totalHours === 0) && !allTimeLoading && refreshAllTimeData) {
      console.log('ポケモンコレクションページ: 全期間データを再取得します');
      refreshAllTimeData();
    }
  }, [allTimeData, allTimeLoading, refreshAllTimeData, totalStudyHours]);
  
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
        <h1 className="text-2xl font-bold text-gray-800">ポケモンコレクション</h1>
        <p className="text-gray-600">学習の進捗に応じてポケモンをコレクションしよう！</p>
      </div>
      
      {/* 全期間統計を追加 */}
      <AllTimeStats />
      
      <PokemonCollection />
    </MainLayout>
  );
};

export default PokemonCollectionPage;
