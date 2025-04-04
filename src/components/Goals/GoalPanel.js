// src/components/Goals/GoalPanel.js

import React, { useState, useEffect } from 'react';
import { useGoals } from '../../contexts/GoalsContext';
import { useStudyState } from '../../contexts/StudyStateContext';
import GoalSettingModal from './GoalSettingModal';

const GoalPanel = () => {
  const { weeklyGoal, calculateGoalProgress } = useGoals();
  const { weekTotalHours } = useStudyState();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState({ total: 0, remainingHours: 0 });
  
  // 進捗状況の更新
  useEffect(() => {
    if (weeklyGoal) {
      const calculatedProgress = calculateGoalProgress();
      setProgress(calculatedProgress);
    }
  }, [weeklyGoal, weekTotalHours, calculateGoalProgress]);
  
  // 目標が設定されていない場合
  if (!weeklyGoal) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">📝 今週の目標</h2>
        </div>
        
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">今週の学習目標が設定されていません。</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            目標を設定する
          </button>
        </div>
        
        <GoalSettingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialGoal={null}
        />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 no-print">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📝 今週の目標</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          編集
        </button>
      </div>
      
      {/* 総目標の進捗 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">総学習時間目標</span>
          <span className="text-sm font-medium">
            {weekTotalHours.toFixed(1)}時間 / {weeklyGoal.totalGoalHours}時間 ({progress.total}%)
          </span>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded-full mt-1">
          <div
            className={`h-4 rounded-full ${
              progress.total >= 100 
                ? 'bg-green-500' 
                : progress.total >= 70 
                  ? 'bg-blue-500' 
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${progress.total}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          残り: <span className="font-medium">{progress.remainingHours.toFixed(1)}時間</span>
        </p>
      </div>
      
      {/* 達成状況に応じたメッセージ */}
      <div className="text-center mt-4">
        {progress.total >= 100 ? (
          <div className="text-green-600 font-medium py-2 bg-green-50 rounded">
            🎉 目標達成おめでとうございます！
          </div>
        ) : progress.total >= 80 ? (
          <div className="text-blue-600 py-2 bg-blue-50 rounded">
            👍 あと少しで目標達成です！
          </div>
        ) : (
          <div className="text-gray-600">
            今週も頑張りましょう！
          </div>
        )}
      </div>
      
      <GoalSettingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialGoal={weeklyGoal}
      />
    </div>
  );
};

export default GoalPanel;