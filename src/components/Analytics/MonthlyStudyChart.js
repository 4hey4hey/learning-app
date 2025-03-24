import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAchievement } from '../../contexts/AchievementContext';
import { useFirestore } from '../../hooks/useFirestore';
import { useCategory } from '../../contexts/CategoryContext';
import { 
  addDays, 
  addWeeks, 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  isBefore,
  isWithinInterval,
  isSameDay,
  parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';

const MonthlyStudyChart = ({ startDate, endDate }) => {
  const { schedule } = useSchedule();
  const { categories } = useCategory();
  const { achievements, ACHIEVEMENT_STATUS } = useAchievement();
  const { getSchedulesByDateRange, getAchievementsByDateRange } = useFirestore();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPeriodicData = async () => {
      if (!startDate || !endDate) return;
      
      setIsLoading(true);
      
      try {
        // 期間に基づいて適切な間隔でデータをグループ化
        const totalDays = differenceInDays(endDate, startDate) + 1;
        let interval;
        let intervalLabel;
        
        // 期間の長さに応じて適切な間隔を選択
        if (totalDays <= 14) {
          // 2週間以内: 日ごと
          interval = 'day';
          intervalLabel = '日別';
        } else if (totalDays <= 90) {
          // 3ヶ月以内: 週ごと
          interval = 'week';
          intervalLabel = '週別';
        } else {
          // それ以上: 月ごと
          interval = 'month';
          intervalLabel = '月別';
        }
        
        // 時間間隔に応じたデータポイントを生成
        let dataPoints = [];
        
        if (interval === 'day') {
          // 日ごとのデータポイント
          for (let date = new Date(startDate); isBefore(date, endDate) || date.getTime() === endDate.getTime(); date = addDays(date, 1)) {
            dataPoints.push({
              start: new Date(date),
              end: new Date(date),
              label: format(date, 'MM/dd (E)', { locale: ja })
            });
          }
        } else if (interval === 'week') {
          // 週ごとのデータポイント
          const weekStarts = eachWeekOfInterval(
            { start: startDate, end: endDate },
            { weekStartsOn: 1 } // 月曜始まり
          );
          
          weekStarts.forEach(weekStart => {
            const weekEnd = addDays(weekStart, 6);
            // 終了日が期間の終了日を超えないようにする
            const actualEnd = isBefore(weekEnd, endDate) ? weekEnd : endDate;
            
            dataPoints.push({
              start: weekStart,
              end: actualEnd,
              label: `${format(weekStart, 'MM/dd', { locale: ja })}週`
            });
          });
        } else {
          // 月ごとのデータポイント
          let currentMonth = startOfMonth(startDate);
          
          while (isBefore(currentMonth, endDate)) {
            const monthEnd = endOfMonth(currentMonth);
            // 終了日が期間の終了日を超えないようにする
            const actualEnd = isBefore(monthEnd, endDate) ? monthEnd : endDate;
            // 開始日が期間の開始日より前にならないようにする
            const actualStart = isBefore(startDate, currentMonth) ? currentMonth : startDate;
            
            dataPoints.push({
              start: actualStart,
              end: actualEnd,
              label: format(currentMonth, 'yyyy年MM月', { locale: ja })
            });
            
            // 次の月へ
            currentMonth = startOfMonth(addDays(endOfMonth(currentMonth), 1));
          }
        }
        
        // Firebaseから期間内のデータを取得
        const schedulesByDateRange = await getSchedulesByDateRange(startDate, endDate);
        const achievementsByDateRange = await getAchievementsByDateRange(startDate, endDate);
        
        console.log('取得したデータ:', { 
          schedulesByDateRange, 
          achievementsByDateRange,
          dataPoints
        });
        
        // 各期間の学習時間を計算する関数
        const calculateStudyHoursForPeriod = (period, scheduleData, achievementsData) => {
          let plannedHours = 0;
          let completedHours = 0;
          
          // スケジュールデータから学習時間を計算
          Object.values(scheduleData).forEach(weekData => {
            Object.entries(weekData).forEach(([dayKey, dayData]) => {
              if (!dayData) return;
              
              Object.entries(dayData).forEach(([hourKey, hourData]) => {
                if (!hourData || !hourData.date) return;
                
                try {
                  // 日付が期間内か確認
                  const itemDate = hourData.date instanceof Date ? hourData.date : 
                                   (typeof hourData.date === 'string' ? parseISO(hourData.date) : 
                                   (hourData.date.seconds ? new Date(hourData.date.seconds * 1000) : new Date()));
                  
                  if (isWithinInterval(itemDate, { start: period.start, end: period.end }) || 
                      isSameDay(itemDate, period.start) || 
                      isSameDay(itemDate, period.end)) {
                    // 計画時間をカウント
                    plannedHours += 1;
                    
                    // 実績を確認
                    const dateStr = format(itemDate, 'yyyy-MM-dd');
                    const uniqueKey = `${dateStr}_${dayKey}_${hourKey}`;
                    
                    if (achievementsData[uniqueKey]) {
                      const achievement = achievementsData[uniqueKey];
                      if (achievement.status === ACHIEVEMENT_STATUS.COMPLETED) {
                        completedHours += 1;
                      } else if (achievement.status === ACHIEVEMENT_STATUS.PARTIAL) {
                        completedHours += 0.5;
                      }
                    }
                  }
                } catch (error) {
                  console.error('日付処理中のエラー:', error, hourData);
                }
              });
            });
          });
          
          return { plannedHours, completedHours };
        };
        
        // 各期間の学習時間を計算
        const data = dataPoints.map(period => {
          const { plannedHours, completedHours } = calculateStudyHoursForPeriod(
            period, 
            schedulesByDateRange, 
            achievementsByDateRange
          );
          
          return {
            label: period.label,
            計画時間: plannedHours,
            完了時間: completedHours,
          };
        });
        
        setChartData(data);
      } catch (error) {
        console.error('データ取得中のエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodicData();
  }, [startDate, endDate, getSchedulesByDateRange, getAchievementsByDateRange, ACHIEVEMENT_STATUS]);

  return (
    <div className="w-full h-80">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
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
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          表示するデータがありません
        </div>
      )}
      <div className="text-sm text-gray-500 text-center mt-2">
        ※ 選択した期間に基づいて表示形式が変わります（日別/週別/月別）
      </div>
    </div>
  );
};

export default MonthlyStudyChart;