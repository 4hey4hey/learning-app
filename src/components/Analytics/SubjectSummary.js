import React, { useState, useEffect, useMemo } from 'react';
import { useCategory } from '../../contexts/CategoryContext';
import { useFirestore } from '../../hooks/useFirestore';
import { calculateCategoryHoursByDateRange } from '../../utils/analyticsUtils';

const SubjectSummary = ({ startDate, endDate }) => {
  const { categories } = useCategory();
  const { getSchedulesByDateRange, getAchievementsByDateRange } = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      if (!startDate || !endDate || !categories.length) return;
      
      setIsLoading(true);
      
      try {
        // Firebaseから期間内のデータを取得
        const schedulesByDateRange = await getSchedulesByDateRange(startDate, endDate);
        
        // 共通関数を使用してカテゴリ別時間を計算
        const { categoryHours, totalHours } = calculateCategoryHoursByDateRange(
          schedulesByDateRange, 
          categories, 
          startDate, 
          endDate
        );
        
        // 時間が0より大きいカテゴリのみをフィルタし、時間降順でソート
        const sortedCategories = Object.values(categoryHours)
          .filter(cat => cat.hours > 0)
          .sort((a, b) => b.hours - a.hours);
        
        setCategoryData(sortedCategories);
        setTotalHours(totalHours);
      } catch (error) {
        console.error('教科別集計データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryStats();
  }, [startDate, endDate, categories, getSchedulesByDateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-md font-semibold mb-2">教科別学習時間</h3>
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