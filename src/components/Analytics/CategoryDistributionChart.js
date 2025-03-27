import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalyticsData } from '../../contexts/AnalyticsDataContext';

const CategoryDistributionChart = () => {
  const { categoryStats, achievementData } = useAnalyticsData();
  const { categoryHours } = categoryStats;
  
  // デバッグ用
  console.log('カテゴリ別学習実績データ:', {
    categoryHours,
    achievements: Object.keys(achievementData).length
  });

  // グラフデータの準備
  const chartData = useMemo(() => {
    if (!categoryHours) return [];
    
    // デバッグ用
    const values = Object.values(categoryHours);
    console.log('チャートデータ準備:', {
      categoryHours: Object.keys(categoryHours),
      値ありカテゴリ数: values.filter(category => category && category.hours > 0).length,
      achievements: Object.keys(achievementData).length
    });
    
    return Object.values(categoryHours)
      .filter(category => category && category.hours > 0)
      .map(category => ({
        name: category.name,
        value: category.hours,
        color: category.color
      }));
  }, [categoryHours, achievementData]);

  if (!chartData || chartData.length === 0) {
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