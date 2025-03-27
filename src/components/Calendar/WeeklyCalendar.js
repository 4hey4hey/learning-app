import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCategory } from '../../contexts/CategoryContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAchievement, ACHIEVEMENT_ICONS } from '../../contexts/AchievementContext';
import { useStudyState } from '../../contexts/StudyStateContext';
import ScheduleModal from '../Modal/ScheduleModal';
import { formatDateToString, getWeekStartDate } from '../../utils/timeUtils';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9時から22時

const WeeklyCalendar = () => {
  const { categories } = useCategory();
  const { 
    schedule, 
    selectedWeek, 
    setSelectedWeek,
  } = useSchedule();
  const {
    achievements,
    generateUniqueKey,
    getAchievementIcon: getAchievementIconFromContext
  } = useAchievement();
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [localAchievements, setLocalAchievements] = useState({});

  // スケジュールの変更をログ出力
  useEffect(() => {
    console.log('スケジュール更新検出 -', new Date().toLocaleTimeString());
    
    // 入力チェック
    if (!schedule) {
      console.log('スケジュールがまだ読み込まれていません');
      return;
    }
    
    // スケジュールが存在するか確認
    const hasScheduleItems = Object.values(schedule).some(day => 
      day && Object.values(day).some(hour => hour !== null && hour.categoryId)
    );
    
    if (hasScheduleItems) {
      console.log('有効なスケジュールアイテムがあります');
    } else {
      console.log('この週はまだスケジュールが登録されていません');
    }
  }, [schedule]);
  
  // 実績の変更を監視
  useEffect(() => {
    setLocalAchievements(achievements || {});
  }, [achievements]);

  // 印刷処理
  const handlePrint = useCallback(() => {
    // 印刷前にクラスを追加
    const calendarElement = document.getElementById('weekly-calendar');
    if (calendarElement) {
      calendarElement.classList.add('weekly-calendar');
    }
    
    // ブラウザの印刷を実行
    window.print();
    
    // 印刷後にクラスを元に戻す
    setTimeout(() => {
      if (calendarElement) {
        calendarElement.classList.remove('weekly-calendar');
      }
    }, 500);
  }, []);

  // 当日かどうか確認する関数
  const isToday = (date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  // 週の日付を生成
  const weekDays = useMemo(() => {
    const baseDate = getWeekStartDate(selectedWeek || new Date());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(baseDate, i);
      return {
        date,
        dayName: format(date, 'E', { locale: ja }),
        fullDate: format(date, 'yyyy/MM/dd'),
        dayKey: `day${i+1}`
      };
    });
  }, [selectedWeek]);

  // カテゴリの色を取得
  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#gray';
  };

  // カテゴリ名を取得
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '未設定';
  };

  // 実績アイコンを取得
  const getAchievementIcon = (dayKey, hourKey) => {
    return getAchievementIconFromContext(dayKey, hourKey);
  };

  // セルクリック処理
  const handleCellClick = (dayKey, hourKey, date) => {
    setSelectedCell({ dayKey, hourKey });
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCell(null);
    setSelectedDate(null);
  };

  // 前の週・次の週に移動
  const handleChangeWeek = (direction) => {
    const baseDate = selectedWeek || new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + (direction === 'prev' ? -7 : 7));
    
    const normalizedDate = getWeekStartDate(newDate);
    setSelectedWeek(normalizedDate);
  };

  // 今週に移動する処理
  const handleTodayClick = () => {
    const today = new Date();
    const startOfWeek = getWeekStartDate(today);
    setSelectedWeek(startOfWeek);
  };

  // 現在日時の表示
  const weekRangeText = () => {
    const startDate = weekDays[0].fullDate;
    const endDate = weekDays[6].fullDate;
    return `${startDate} 〜 ${endDate}`;
  };

  return (
    <div id="weekly-calendar" className="bg-white rounded-lg shadow overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-gray-800 weekly-calendar-title">週間スケジュール</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleChangeWeek('prev')}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded no-print"
          >
            ← 前週
          </button>
          
          <button
            onClick={handleTodayClick}
            className="px-2 py-1 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded border border-blue-300 no-print"
          >
            今週
          </button>
          
          <span className="text-sm font-medium text-gray-600">{weekRangeText()}</span>
          
          <button 
            onClick={() => handleChangeWeek('next')}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded no-print"
          >
            次週 →
          </button>
          
          <button 
            onClick={handlePrint}
            className="px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-300 flex items-center no-print"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷
          </button>
        </div>
      </div>
      
      {/* カレンダーグリッド */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* 曜日ヘッダー */}
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-50 w-20"></th>
              {weekDays.map((day) => {
                // 当日かどうかチェック
                const isTodayHeader = isToday(day.date);
                return (
                  <th 
                    key={day.dayKey} 
                    className={`border px-2 py-1 ${isTodayHeader ? 'bg-blue-100 today-highlight' : 'bg-gray-50'}`}
                  >
                    <div className={`text-sm font-medium ${isTodayHeader ? 'text-blue-800' : 'text-gray-600'}`}>{day.dayName}</div>
                    <div className={`text-xs ${isTodayHeader ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                      {isTodayHeader ? `本日 (${day.fullDate})` : day.fullDate}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          
          {/* 時間ごとのセル */}
          <tbody>
            {HOURS.map((hour) => (
              <tr key={`hour-${hour}`}>
                <td className="border px-2 py-1 bg-gray-50 text-center text-sm">
                  {hour}:00
                </td>
                
                {weekDays.map((day) => {
                  const hourKey = `hour${hour}`;
                  const scheduleItem = schedule?.[day.dayKey]?.[hourKey];
                  const achievementIcon = getAchievementIcon(day.dayKey, hourKey);
                  
                  // 当日の場合は特別な背景色を適用
                  const isTodayCell = isToday(day.date);
                  
                  return (
                    <td
                      key={`${day.dayKey}-${hourKey}`}
                      className={`border px-2 py-1 h-14 cursor-pointer ${isTodayCell ? 'bg-blue-50 ring-2 ring-inset ring-blue-300 today-highlight' : ''}`}
                      onClick={() => handleCellClick(day.dayKey, hourKey, day.date)}
                    >
                      {scheduleItem ? (
                        <div
                          className="h-full flex flex-col justify-between cursor-pointer p-1 rounded text-white schedule-item"
                          style={{ backgroundColor: getCategoryColor(scheduleItem.categoryId) }}
                        >
                          <div className="text-sm font-medium truncate">
                            {getCategoryName(scheduleItem.categoryId)}
                          </div>
                          <div className={`text-right ${achievementIcon.color} text-lg achievement-icon`}>
                            {achievementIcon.icon}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full w-full"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* スケジュールモーダル */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedCell={selectedCell}
        date={selectedDate}
      />
    </div>
  );
};

export default WeeklyCalendar;