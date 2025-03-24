import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useCategory } from '../../contexts/CategoryContext';
import { useFirestore } from '../../hooks/useFirestore';
import { calculateCategoryHoursByDateRange } from '../../utils/analyticsUtils';

const CategoryDistributionChart = ({ startDate, endDate }) => {
  const { schedule } = useSchedule();
  const { categories } = useCategory();
  const { getSchedulesByDateRange } = useFirestore();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!startDate || !endDate) return;
      
      setIsLoading(true);
      
      try {
        // Firebaseから期間内のデータを取得
        const schedulesByDateRange = await getSchedulesByDateRange(startDate, endDate);
        
        // 共通関数を使用してカテゴリ別時間を計算
        const { categoryHours } = calculateCategoryHoursByDateRange(
          schedulesByDateRange, 
          categories, 
          startDate, 
          endDate
        );
        
        // チャート用データに変換（時間が0のカテゴリを除外）
        const pieData = Object.values(categoryHours)
          .filter(category => category.hours > 0)
          .map(category => ({
            name: category.name,
            value: category.hours,
            color: category.color
          }));
        
        setChartData(pieData);
      } catch (error) {
        console.error('データ処理中のエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryData();
  }, [startDate, endDate, categories, getSchedulesByDateRange]);

  // データがない場合やロード中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
        <p className="text-gray-500">選択期間内に学習データがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}時間`, '学習時間']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryDistributionChart;