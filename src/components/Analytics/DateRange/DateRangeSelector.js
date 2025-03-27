import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDateRange } from '../../../contexts/DateRangeContext';

const DateRangeSelector = () => {
  // useDateRangeフックから直接データを取得
  const { startDate, endDate, setDateRange } = useDateRange();
  
  const [rangeType, setRangeType] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // 初期化フラグ
  const initializedRef = useRef(false);
  // クリック防止のためのタイマー参照
  const clickTimerRef = useRef(null);

  // 初期値の設定（一度だけ実行）
  useEffect(() => {
    if (!initializedRef.current) {
      updateDateRange('week');
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 日付範囲の更新
  const updateDateRange = useCallback((type, event) => {
    // ブラウザのデフォルト動作を防止
    if (event) {
      event.preventDefault();
    }
    
    console.log(`${type} ボタンがクリックされました`);
    
    // 既に同じボタンが選択されているか確認
    if (type === rangeType) {
      console.log(`同じ期間タイプ (${type}) を強制的に更新します`);
      // 同じボタンでもデータを強制更新するためスキップしない
    }
    
    // デバウンス処理（連続クリック防止）
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    clickTimerRef.current = setTimeout(() => {
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

      console.log(`期間を変更: ${type}`, {
        開始日: start.toISOString(),
        終了日: end.toISOString()
      });
      
      // UIの状態を先に更新
      setRangeType(type);
      
      // 日付範囲を更新
      setDateRange(start, end);
      
      // デバッグ用出力を追加
      console.log('ボタンクリック後の期間状態:', {
        rangeType: type,
        開始日: start.toISOString(),
        終了日: end.toISOString()
      });
      
      clickTimerRef.current = null;
    }, 400); // 400ms間隔でデバウンス時間を少し長く
  }, [setDateRange, rangeType]);

  // カスタム期間の適用
  const applyCustomRange = useCallback((event) => {
    // デフォルト動作を防止
    if (event) {
      event.preventDefault();
    }
    
    if (customStartDate && customEndDate) {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        
        if (start > end) {
          alert('開始日は終了日より前の日付にしてください');
          return;
        }
        
        console.log('カスタム期間を適用:', {
          開始日: start,
          終了日: end
        });
        
        setRangeType('custom');
        setDateRange(start, end);
      } catch (e) {
        console.error('カスタム期間エラー:', e);
        alert('無効な日付形式です');
      }
    } else {
      alert('開始日と終了日を入力してください');
    }
  }, [customStartDate, customEndDate, setDateRange]);

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">期間指定</h2>
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={(e) => updateDateRange('week', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
        >
          今週
        </button>
        <button
          onClick={(e) => updateDateRange('last_week', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'last_week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
        >
          先週
        </button>
        <button
          onClick={(e) => updateDateRange('month', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
        >
          今月
        </button>
        <button
          onClick={(e) => updateDateRange('last_month', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === 'last_month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
        >
          先月
        </button>
        <button
          onClick={(e) => updateDateRange('30_days', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === '30_days' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
        >
          過去30日
        </button>
        <button
          onClick={(e) => updateDateRange('90_days', e)}
          className={`px-3 py-1.5 rounded text-sm ${
            rangeType === '90_days' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          type="button"
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
              onClick={(e) => applyCustomRange(e)}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              type="button"
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
