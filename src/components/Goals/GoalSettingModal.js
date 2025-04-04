// src/components/Goals/GoalSettingModal.js

import React, { useState, useEffect } from 'react';
import { useGoals } from '../../contexts/GoalsContext';
import { useToast } from '../../contexts/ToastContext';

const GoalSettingModal = ({ isOpen, onClose, initialGoal }) => {
  const { saveWeeklyGoal } = useGoals();
  const { showSuccess, showError } = useToast();
  
  const [totalGoal, setTotalGoal] = useState(20);
  const [copyToNextWeek, setCopyToNextWeek] = useState(true);
  
  // 初期値の設定
  useEffect(() => {
    if (initialGoal) {
      setTotalGoal(initialGoal.totalGoalHours);
      setCopyToNextWeek(initialGoal.copyToNextWeek !== false);
    } else {
      // デフォルト値
      setTotalGoal(20);
      setCopyToNextWeek(true);
    }
  }, [initialGoal, isOpen]);
  
  // 保存処理
  const handleSave = async () => {
    const goalData = {
      totalGoalHours: totalGoal,
      copyToNextWeek,
      createdAt: new Date()
    };
    
    try {
      const success = await saveWeeklyGoal(goalData);
      
      if (success) {
        showSuccess('目標を保存しました');
        onClose();
      } else {
        showError('目標の保存に失敗しました');
      }
    } catch (error) {
      console.error('目標保存エラー:', error);
      showError('目標の保存中にエラーが発生しました');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
        <div className="bg-gray-100 px-4 py-3 border-b rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium">週間目標の設定</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
        {/* 総学習時間目標 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            総学習時間目標
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="1"
              value={totalGoal}
              onChange={(e) => setTotalGoal(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-20 px-3 py-2 border rounded-md"
            />
            <span className="ml-2">時間/週</span>
          </div>
        </div>
        
        {/* 次週への引継ぎ設定 */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={copyToNextWeek}
              onChange={() => setCopyToNextWeek(!copyToNextWeek)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">
              次週も同じ目標を適用する
            </span>
          </label>
        </div>
        
        {/* ボタン群 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default GoalSettingModal;