import React from 'react';
import { useStudyState } from '../../contexts/StudyStateContext';

const AllTimeStats = () => {
  const { allTimeData, allTimeLoading, allTimeError } = useStudyState();
  
  if (allTimeLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (allTimeError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">
        <p>データの読み込み中にエラーが発生しました。</p>
      </div>
    );
  }
  
  const { totalHours, completedCount, partialCount, totalCount } = allTimeData;
  
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold text-gray-800 mb-2">🏆 全期間の実績</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">累計学習時間</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours} 時間</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">完了した学習</p>
          <p className="text-2xl font-bold text-green-600">{completedCount} 回</p>
          <p className="text-xs text-gray-500">(通常評価)</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">部分的に完了</p>
          <p className="text-2xl font-bold text-orange-500">{partialCount} 回</p>
          <p className="text-xs text-gray-500">(頑張ったね)</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">達成率</p>
          <p className="text-2xl font-bold text-purple-600">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500">({totalCount}回中)</p>
        </div>
      </div>
    </div>
  );
};

export default AllTimeStats;