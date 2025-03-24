import React, { useState, useEffect } from 'react';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

const DateRangeSelector = ({ onRangeChange }) => {
  const [rangeType, setRangeType] = useState('week'); // 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 初期値の設定
  useEffect(() => {
    updateDateRange('week');
  }, []);

  // 日付範囲の更新
  const updateDateRange = (type) => {
    const today = new Date();
    let start = null;
    let end = null;

    switch (type) {
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 }); // 月曜始まり
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'last_week':
        start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case '30_days':
        start = subDays(today, 29);
        end = today;
        break;
      case '90_days':
        start = subDays(today, 89);
        end = today;
        break;
      case 'custom':
        // カスタム期間は別途処理
        return;
      default:
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
    }

    setRangeType(type);
    setStartDate(start);
    setEndDate(end);

    // 親コンポーネントに通知
    if (onRangeChange) {
      onRangeChange(start, end);
    }
  };

  // カスタム期間の適用
  const applyCustomRange = () => {
    if (customStartDate && customEndDate) {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        
        if (start > end) {
          alert('開始日は終了日より前の日付にしてください');
          return;
        }
        
        setStartDate(start);
        setEndDate(end);
        setRangeType('custom');

        // 親コンポーネントに通知
        if (onRangeChange) {
          onRangeChange(start, end);
        }
      } catch (e) {
        alert('無効な日付形式です');
      }
    } else {
      alert('開始日と終了日を入力してください');
    }
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">期間指定</h2>
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => updateDateRange('week')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          今週
        </button>
        <button
          onClick={() => updateDateRange('last_week')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'last_week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          先週
        </button>
        <button
          onClick={() => updateDateRange('month')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          今月
        </button>
        <button
          onClick={() => updateDateRange('last_month')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'last_month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          先月
        </button>
        <button
          onClick={() => updateDateRange('30_days')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === '30_days' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          過去30日
        </button>
        <button
          onClick={() => updateDateRange('90_days')}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === '90_days' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          過去90日
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">カスタム期間:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
            <span className="mx-2">〜</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
            <button
              onClick={applyCustomRange}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              適用
            </button>
          </div>
        </div>
      </div>
      
      {startDate && endDate && (
        <div className="text-sm text-gray-600">
          選択中の期間: {format(startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 {format(endDate, 'yyyy年MM月dd日', { locale: ja })}
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
