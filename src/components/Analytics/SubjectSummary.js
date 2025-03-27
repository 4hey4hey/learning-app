import React, { useMemo } from 'react';
import { useAnalyticsData } from '../../contexts/AnalyticsDataContext';

const SubjectSummary = () => {
  const { categoryStats, achievementData } = useAnalyticsData();
  const { categoryHours, totalHours } = categoryStats;
  
  // デバッグ用
  console.log('教科別集計データ取得:', {
    totalHours,
    categoryHours,
    achievements: Object.keys(achievementData).length
  });

  // カテゴリデータの処理（時間が0より大きいカテゴリのみ、時間降順でソート）
  const categoryData = useMemo(() => {
    return Object.values(categoryHours || {})
      .filter(cat => cat && cat.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [categoryHours, achievementData]); // achievementDataを依存に追加

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-md font-semibold mb-2">教科別実績時間</h3>
        <div className="text-sm text-gray-500 mb-2">合計: {totalHours}時間</div>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {categoryData.map(category => {
          const percentage = totalHours > 0 ? (category.hours / totalHours) * 100 : 0;
          
          return (
            <div key={category.id} className="flex items-center">
              <div className="w-24 flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm truncate">{category.name}</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: category.color }}
                  ></div>
                </div>
              </div>
              <div className="w-24 text-right">
                <span className="text-sm font-medium">{category.hours}時間</span>
                <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectSummary;
