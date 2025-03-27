import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAnalyticsData } from '../../contexts/AnalyticsDataContext';

const MonthlyStudyChart = () => {
  const { dailyData, achievementData } = useAnalyticsData();
  
  // データ変更ログ
  useMemo(() => {
    console.log('日別学習時間データ更新:', {
      日数: dailyData?.length || 0,
      実績数: Object.keys(achievementData || {}).length
    });
    
    return dailyData;
  }, [dailyData, achievementData]);

  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={dailyData}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis label={{ value: '合計時間', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value}時間`, '']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="計画時間" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            name="計画学習時間"
          />
          <Line 
            type="monotone" 
            dataKey="完了時間" 
            stroke="#82ca9d" 
            name="実際の学習時間"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-sm text-gray-500 text-center mt-2">
        ※ 選択した期間の日別学習時間を表示しています
      </div>
    </div>
  );
};

export default MonthlyStudyChart;
