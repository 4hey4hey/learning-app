import React, { useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useStudyState } from '../../contexts/StudyStateContext';
import { useCategory } from '../../contexts/CategoryContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAchievement, ACHIEVEMENT_STATUS } from '../../contexts/AchievementContext';
import { 
  getDayKeyFromDate, 
  calculateCategoryHours, 
  calculateWeekStudyHours,
  formatDateToString,
  generateScheduleKey
} from '../../utils/timeUtils';

const StatsDashboard = () => {
  const { 
    includeAchievementsInStats,
    categoryHours, 
    weekTotalHours,
    totalStudyHours,
    allTimeData
  } = useStudyState();
  const { categories } = useCategory();
  const { schedule } = useSchedule();
  const { achievements, ACHIEVEMENT_STATUS } = useAchievement();
  
  // 今日の日付
  const today = new Date();
  const todayKey = getDayKeyFromDate(today);
  
  // 実績に基づいて計算するかどうかを考慮した時間計算
  // 実績のフィルタリングを適用するかどうかに基づいてスケジュールを取得
  const getEffectiveSchedule = useMemo(() => {
    if (!schedule) return {};
    
    // includeAchievementsInStats=false: すべての計画を含む（デフォルト）
    // includeAchievementsInStats=true: 実績のある項目のみを含む
    if (!includeAchievementsInStats) {
      return schedule; // 実績を考慮しない場合はそのまま予定を使用
    }
    
    // 実績を考慮する場合は、実績が「完了」または「部分的」のもののみをカウント
    const effectiveSchedule = {};
    const validAchievements = achievements || {};
    
    // 全ての曜日を適切に処理
    for (const day in schedule) {
      if (!schedule[day]) continue;
      effectiveSchedule[day] = {};
      
      for (const hour in schedule[day]) {
        const scheduleItem = schedule[day][hour];
        if (!scheduleItem) {
          effectiveSchedule[day][hour] = null;
          continue;
        }
        
        try {
          // スケジュールの日付からuniqueKeyを生成
          const itemDate = scheduleItem.date instanceof Date ? scheduleItem.date : new Date(scheduleItem.date || 0);
          const uniqueKey = generateScheduleKey(itemDate, day, hour);
          const achievement = validAchievements[uniqueKey];
          
          if (achievement && (
            achievement.status === ACHIEVEMENT_STATUS.COMPLETED || 
            achievement.status === ACHIEVEMENT_STATUS.PARTIAL
          )) {
            effectiveSchedule[day][hour] = scheduleItem;
          } else {
            effectiveSchedule[day][hour] = null;
          }
        } catch (error) {
          console.error('実績データ処理中のエラー:', error, scheduleItem);
          effectiveSchedule[day][hour] = null; // エラー時はヌルとして処理
        }
      }
    }
    
    return effectiveSchedule;
  }, [schedule, achievements, includeAchievementsInStats]);
  
  // 各教科の勉強時間を計算
  const calculatedCategoryHours = useMemo(() => {
    return calculateCategoryHours(getEffectiveSchedule, categories, achievements, includeAchievementsInStats);
  }, [getEffectiveSchedule, categories, achievements, includeAchievementsInStats]);
  
  // 合計時間
  const todayTotal = useMemo(() => {
    return Object.values(getEffectiveSchedule[todayKey] || {}).filter(item => item !== null).length;
  }, [getEffectiveSchedule, todayKey]);
  
  const weekTotal = useMemo(() => {
    return calculateWeekStudyHours(getEffectiveSchedule, achievements, includeAchievementsInStats);
  }, [getEffectiveSchedule, achievements, includeAchievementsInStats]);
  
  // 月間集計は削除
  
  // グラフ用データの変換
  const chartData = useMemo(() => {
    return categories.map(category => {
      // 時間を時間単位に変換（分から時間へ）
      const minutesValue = calculatedCategoryHours[category.id] || 0;
      const hoursValue = Math.round(minutesValue / 60 * 10) / 10; // 小数点第1位まで
      
      return {
        name: category.name,
        value: hoursValue,
        color: category.color
      };
    }).filter(item => item.value > 0);
  }, [categories, calculatedCategoryHours]);
  
  // 実績記録率の計算
  const calculateRecordRate = () => {
    try {
      // ACHIEVEMENT_STATUSが存在しない場合のフォールバック
      const STATUS = ACHIEVEMENT_STATUS || {
        COMPLETED: 'completed',
        PARTIAL: 'partial',
        FAILED: 'failed'
      };

      let totalPlanned = 0;
      let totalWithAnyRecord = 0;
      
      if (!schedule) return 0;
      
      for (const day in schedule) {
        if (!schedule[day]) continue;
        for (const hour in schedule[day]) {
          const scheduleItem = schedule[day][hour];
          if (scheduleItem && scheduleItem.categoryId) {
            totalPlanned++;
            
            // スケジュールの日付からuniqueKeyを生成
            try {
              const date = scheduleItem.date instanceof Date ? scheduleItem.date : new Date(scheduleItem.date || 0);
              const uniqueKey = generateScheduleKey(date, day, hour);
              const achievement = achievements && achievements[uniqueKey];
              
              if (achievement) {
                totalWithAnyRecord++;
              }
            } catch (err) {
              console.error('日付処理エラー:', err);
              // エラーが発生しても処理を継続
            }
          }
        }
      }
      
      return totalPlanned > 0 ? Math.round((totalWithAnyRecord / totalPlanned) * 100) : 0;
    } catch (error) {
      console.error('実績記録率計算エラー:', error);
      return 0; // エラー時は0を返す
    }
  };
  
  const recordRate = calculateRecordRate();
  
  // 学習時間の変更を監視
  useEffect(() => {
    // データの変更を監視するのみ
  }, [totalStudyHours, allTimeData]);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 print:hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📊 勉強時間集計</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 左側：基本統計と達成率 */}
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">今日</p>
              <p className="text-2xl font-bold text-blue-600">{todayTotal}時間</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">今週</p>
              <p className="text-2xl font-bold text-green-600">{weekTotal}時間</p>
            </div>
          </div>
          
          {/* 累計学習時間カード */}
          <div className="mb-4 text-center p-3 bg-purple-50 rounded">
            <p className="text-sm text-gray-600">累計学習時間</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((allTimeData?.totalHours || 0) * 10) / 10} 時間
            </p>
            <p className="text-xs text-gray-500 mt-1">
              これまでの総学習時間
            </p>
          </div>
          
          <div className="mb-4 text-center p-3 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600">週間実績記録率</p>
            <p className="text-2xl font-bold text-yellow-600">{recordRate}%</p>
            <div className="mt-1 flex flex-col">
              <p className="text-xs text-gray-700 font-medium">
                {includeAchievementsInStats 
                  ? "実績ありの予定のみを集計に含んでいます" 
                  : "すべての予定を集計に含んでいます"}
              </p>
              <p className="text-xs text-gray-500 italic">
                設定変更は「実績管理」パネルで行えます
              </p>
            </div>
          </div>
          
          {/* 教科別集計 - 横スクロール可能なリスト */}
          <div>
            <h3 className="text-md font-semibold mb-2">教科別集計</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {categories.map(category => {
                // 時間を時間単位に変換（分から時間へ）
                const minutesValue = calculatedCategoryHours[category.id] || 0;
                const hours = Math.round(minutesValue / 60 * 10) / 10; // 小数点第1位まで
                const percentage = weekTotal > 0 ? (hours / weekTotal) * 100 : 0;
                
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
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium">{hours}時間</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 右側：円グラフ */}
        <div>
          <h3 className="text-md font-semibold mb-2">教科別時間分布</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}時間`, '勉強時間']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">データが不足しています</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;