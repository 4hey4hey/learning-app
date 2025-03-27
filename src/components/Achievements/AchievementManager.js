import React, { useEffect } from 'react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAchievement, ACHIEVEMENT_STATUS } from '../../contexts/AchievementContext';
import { useStudyState } from '../../contexts/StudyStateContext';
import { calculateAchievementStats } from '../../utils/achievementUtils';
import { achievementLogger, uiLogger } from '../../utils/loggerUtils';

const AchievementManager = () => {
  const { 
    achievements,
    achievementStats,
    ACHIEVEMENT_STATUS
  } = useAchievement();
  
  const { setAchievementsInStats } = useStudyState();
  
  // StudyStateContextから値を取得するように変更
  const { includeAchievementsInStats } = useStudyState();
  
  const { schedule } = useSchedule();

  // データが変わったときのデバッグ出力
  useEffect(() => {
    // マウント時と設定変更時に実行
    uiLogger.debug('実績管理コンポーネント：設定確認', {
      includeAchievementsInStats,
      achievementsCount: Object.keys(achievements).length,
      timestamp: new Date().toISOString()
    });
  }, [includeAchievementsInStats, achievements]);

  // チェックボックスの変更ハンドラ
  const handleIncludeAchievementsToggle = () => {
    // 新しい値を明示的に指定してトグル
    const newValue = !includeAchievementsInStats;
    uiLogger.info('実績設定変更', { 
      変更前: includeAchievementsInStats,
      変更後: newValue
    });
    
    // StudyStateContextの直接設定関数を使用
    setAchievementsInStats(newValue);
  };

  // achievementStatsが利用できない場合には直接計算
  const stats = achievementStats.stats.totalPlanned 
    ? achievementStats 
    : calculateAchievementStats(schedule, achievements, ACHIEVEMENT_STATUS);
    
  const { recordRate, completionRate, totalRecorded } = stats;
  const { totalPlanned, totalCompleted, totalPartial, totalFailed } = stats.stats;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📝 実績管理</h2>
      </div>
      
      <div className="mb-4 text-center p-3 bg-yellow-50 rounded">
        <p className="text-sm text-gray-600">週間実績記録率</p>
        <p className="text-2xl font-bold text-yellow-600">{recordRate}%</p>
        <p className="text-xs text-gray-500 mt-1">
          記録済み: {totalRecorded} 件 / 全体: {totalPlanned} 件
        </p>
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700">達成率: {completionRate}%</p>
          <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-2 flex justify-center space-x-2">
          <span className="px-1 py-0.5 bg-green-100 rounded">完了: {totalCompleted}</span>
          <span className="px-1 py-0.5 bg-yellow-100 rounded">部分的: {totalPartial}</span>
          <span className="px-1 py-0.5 bg-red-100 rounded">未達成: {totalFailed}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <p>集計設定: {includeAchievementsInStats ? '実績のみ' : 'すべての予定'}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            checked={includeAchievementsInStats}
            onChange={handleIncludeAchievementsToggle}
          />
          <span className="ml-2 text-gray-700 font-medium">集計に実績のみを含める</span>
        </label>
        <div className="mt-2">
          <p className="text-xs text-gray-700 mb-1">
            {includeAchievementsInStats 
              ? '✔️ 実際に達成した勉強時間のみを集計に含めます。' 
              : '✔️ 計画された勉強時間をすべて集計に含めます。'}
          </p>
          <p className="text-xs text-gray-500">
            {includeAchievementsInStats 
              ? '未達成や未記録の予定は集計から除外されます。' 
              : '実績の有無は集計に影響しません。'}
          </p>
        </div>
      </div>
      
      {/* 実績アイコン説明 */}
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">実績アイコンの意味</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="inline-block w-8 h-8 flex items-center justify-center text-lg font-bold text-white bg-green-600 rounded-full mr-2">◎</span>
            <span>完了：計画通りに勉強を完了</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-8 h-8 flex items-center justify-center text-lg font-bold text-white bg-yellow-600 rounded-full mr-2">△</span>
            <span>部分的：一部のみ勉強を完了</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-8 h-8 flex items-center justify-center text-lg font-bold text-white bg-red-600 rounded-full mr-2">✗</span>
            <span>未達成：勉強できなかった</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-8 h-8 flex items-center justify-center text-lg text-white bg-gray-400 rounded-full mr-2">-</span>
            <span>未記録：実績が記録されていない</span>
          </div>
        </div>
      </div>
      
      {/* 使い方ガイド */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          各勉強予定をクリックすると、実績を記録できます。
          実績に応じて集計結果が変わります。
        </p>
      </div>
    </div>
  );
};

export default AchievementManager;