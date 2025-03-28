import React, { useState, useEffect } from 'react';
import { useCategory } from '../../contexts/CategoryContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useAchievement, ACHIEVEMENT_STATUS, ACHIEVEMENT_ICONS } from '../../contexts/AchievementContext';
import { useToast } from '../../contexts/ToastContext';
import { usePokemonAchievement } from '../../contexts/PokemonAchievementContext';
import { useMilestoneModal } from '../../hooks/useMilestoneModal';
import { formatDateToString } from '../../utils/timeUtils';
import { uiLogger } from '../../utils/loggerUtils';

const ScheduleModal = ({ isOpen, onClose, selectedCell, date }) => {
  const { categories } = useCategory();
  const { schedule, addScheduleItem, deleteScheduleItem } = useSchedule();
  const {
    achievements,
    saveAchievement,
    deleteAchievement,
    fetchAchievements,
    generateUniqueKey
  } = useAchievement();
  
  const { showSuccess, showError } = useToast();
  const { checkNewAchievementForPokemon } = usePokemonAchievement();
  const { checkMilestoneManually } = useMilestoneModal();

  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [achievementStatus, setAchievementStatus] = useState(null);
  const [currentAchievementKey, setCurrentAchievementKey] = useState(null);
  
  // モーダルが開いた時に現在のセルのスケジュール情報を取得
  useEffect(() => {
    if (isOpen && selectedCell) {
      const { dayKey, hourKey } = selectedCell;
      const currentSchedule = schedule?.[dayKey]?.[hourKey];
      
      uiLogger.debug('モーダル初期化', { セル: selectedCell, 日付: date });
      
      // スケジュール情報が本当に存在するか確認
      if (currentSchedule && currentSchedule.categoryId) {
        uiLogger.debug('有効なスケジュールを検出', { カテゴリ: currentSchedule.categoryId });
        setScheduleInfo(currentSchedule);
        
        // 実績データがある場合、それを設定
        try {
          // 互換性対策: 日付がStringの場合はDateに変換
          let scheduleDate = null;
          
          if (typeof currentSchedule.date === 'string') {
            scheduleDate = new Date(currentSchedule.date);
          } else if (currentSchedule.date instanceof Date) {
            scheduleDate = new Date(currentSchedule.date);
          } else if (currentSchedule.date && typeof currentSchedule.date === 'object' && 'seconds' in currentSchedule.date) {
            // Firestoreタイムスタンプの場合
            scheduleDate = new Date(currentSchedule.date.seconds * 1000);
          } else {
            // 日付が有効でない場合は現在の日付を使用
            scheduleDate = date || new Date();
          }
          
          // 時刻部分をリセット
          scheduleDate.setHours(0, 0, 0, 0);
          
          // 一意のキーを生成して実績を取得
          const uniqueKey = generateUniqueKey(
            scheduleDate, 
            dayKey, 
            hourKey
          );
          
          setCurrentAchievementKey(uniqueKey);
          
          const achievement = achievements[uniqueKey];
          setAchievementStatus(achievement?.status || null);
          
          uiLogger.debug('実績状態確認', { 
            キー: uniqueKey, 
            状態: achievement?.status || '未記録',
            日付: scheduleDate.toISOString().split('T')[0]
          });
        } catch (error) {
          uiLogger.error('実績の読み込み中にエラーが発生しました', error);
          setAchievementStatus(null);
        }
        
        // 予定が存在する場合は実績タブを初期表示
        setActiveTab('achievement');
      } else {
        // スケジュールが存在しない場合はnullに設定
        uiLogger.debug('スケジュールが存在しません');
        setScheduleInfo(null);
        setCurrentAchievementKey(null);
        // 予定が存在しない場合は予定タブを初期表示
        setActiveTab('schedule');
      }
    } else if (!isOpen) {
      // モーダルを閉じる時に状態を初期化
      setScheduleInfo(null);
      setAchievementStatus(null);
      setCurrentAchievementKey(null);
    }
  }, [isOpen, selectedCell, schedule, achievements, generateUniqueKey, date]);

  // スケジュール追加処理
  const handleScheduleAdd = async (categoryId) => {
    if (!selectedCell) return;
    
    try {
      const { dayKey, hourKey } = selectedCell;
      
      uiLogger.info('スケジュール追加開始', { 
        曜日: dayKey, 
        時間: hourKey, 
        カテゴリ: categoryId 
      });
      
      await addScheduleItem(dayKey, hourKey, categoryId);
      
      // 成功メッセージを表示
      showSuccess('予定を登録しました');
      
      // 成功したらモーダルを閉じる
      onClose();
    } catch (error) {
      uiLogger.error('スケジュール追加エラー:', error);
      showError('スケジュールの追加に失敗しました');
    }
  };

  // スケジュール削除処理
  const handleScheduleDelete = async () => {
    if (!selectedCell || !scheduleInfo) return;
    
    try {
      const { dayKey, hourKey } = selectedCell;
      
      uiLogger.info('スケジュール削除開始', { 
        曜日: dayKey, 
        時間: hourKey
      });
      
      await deleteScheduleItem(dayKey, hourKey);
      
      // スケジュールに紐づく実績も削除
      if (currentAchievementKey && achievements[currentAchievementKey]) {
        uiLogger.info('関連する実績も削除します', { キー: currentAchievementKey });
        await deleteAchievement(currentAchievementKey);
        
        // 実績も削除された場合はカスタムイベントを発火
        window.dispatchEvent(new CustomEvent('achievementDataChanged'));
        uiLogger.info('実績データ変更イベントを発行');
      }
      
      // 成功メッセージを表示
      showSuccess('予定を削除しました');
      
      // 成功したらモーダルを閉じる
      onClose();
    } catch (error) {
      uiLogger.error('スケジュール削除エラー:', error);
      showError('スケジュールの削除に失敗しました');
    }
  };

  // 実績記録処理
  const handleAchievementSave = async (status) => {
    if (!selectedCell || !scheduleInfo || !currentAchievementKey) return;
    
    try {
      // 変更前の状態をログ出力
      uiLogger.info('実績記録開始', { 
        キー: currentAchievementKey,
        状態: status,
        現在の状態: achievementStatus || '未設定'
      });
      
      console.log('🔍 実績登録処理開始 - マイルストーンをチェックします');
      
      // 実績を保存
      const savedAchievement = await saveAchievement(currentAchievementKey, status, '');
      
      // 保存された実績の確認ログ
      console.log('✅ 実績が登録されました:', savedAchievement);
      console.log('👉 AchievementContext のコールバックが実行されるはずです');
      
      // 実績データを再取得
      await fetchAchievements();
      
      // 成功メッセージを表示
      showSuccess('実績を記録しました');
      
      // ポケモン獲得をチェック
      const achievedPokemon = checkNewAchievementForPokemon();
      
      // マイルストーンもチェック
      console.log('📈 実績記録後にマイルストーンを手動チェックします');
      setTimeout(() => {
        // 少し遅延させて実行し、学習時間の更新が反映されるようにする
        checkMilestoneManually();
      }, 500);
      
      // 成功したらモーダルを閉じる
      onClose();
    } catch (error) {
      uiLogger.error('実績記録エラー:', error);
      showError('実績の記録に失敗しました');
    }
  };
  
  // 実績削除処理（新規追加）
  const handleAchievementDelete = async () => {
    if (!currentAchievementKey) return;
    
    try {
      uiLogger.info('実績削除開始', { キー: currentAchievementKey });
      
      // 実績を削除
      await deleteAchievement(currentAchievementKey);
      
      // 実績データを再取得
      await fetchAchievements();
      
      // 全体を更新するためのカスタムイベントを発火
      window.dispatchEvent(new CustomEvent('achievementDataChanged'));
      uiLogger.info('実績データ変更イベントを発行');
      
      // 成功メッセージを表示
      showSuccess('実績を削除しました');
      
      // ステータスをリセット
      setAchievementStatus(null);
    } catch (error) {
      uiLogger.error('実績削除エラー:', error);
      showError('実績の削除に失敗しました');
    }
  };

  // カテゴリ名を取得
  const getCategoryName = (categoryId) => {
    if (!categoryId) return '未設定';
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      uiLogger.warn('カテゴリが見つかりません', { カテゴリID: categoryId });
      return '未設定';
    }
    return category.name;
  };
  
  // カテゴリの色を取得
  const getCategoryColor = (categoryId) => {
    if (!categoryId) return '#gray';
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      uiLogger.warn('カテゴリの色が見つかりません', { カテゴリID: categoryId });
      return '#gray';
    }
    return category.color;
  };

  if (!isOpen) return null;

  // 選択している時間と日付の表示用文字列
  const timeString = selectedCell ? `${selectedCell.hourKey.replace('hour', '')}:00` : '';
  const dateString = date ? `${date.getMonth() + 1}月${date.getDate()}日` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* モーダルヘッダー */}
        <div className="bg-gray-100 px-4 py-3 border-b rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {dateString} {timeString}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* タブメニュー */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'schedule' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('schedule')}
          >
            予定
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'achievement' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('achievement')}
            disabled={!scheduleInfo}
          >
            実績
          </button>
        </div>
        
        {/* モーダル内容 */}
        <div className="p-4">
          {activeTab === 'schedule' ? (
            // 予定タブ
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {scheduleInfo 
                  ? '登録済みの予定' 
                  : '新しい予定を登録'
                }
              </h4>
              
              {scheduleInfo && (
                <div 
                  className="p-3 rounded mb-3 text-white"
                  style={{ backgroundColor: getCategoryColor(scheduleInfo.categoryId) }}
                >
                  <p className="font-medium">{getCategoryName(scheduleInfo.categoryId)}</p>
                </div>
              )}
              
              <div className="space-y-3">
                {!scheduleInfo ? (
                  // 新規登録時はカテゴリ選択を表示
                  <>
                    <p className="text-sm text-gray-600 mb-2">科目を選択してください：</p>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleScheduleAdd(category.id)}
                          className="px-3 py-2 text-white rounded hover:opacity-90 text-sm"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  // 既存の予定があれば削除ボタンを表示
                  <button
                    onClick={handleScheduleDelete}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    この予定を削除
                  </button>
                )}
              </div>
            </div>
          ) : (
            // 実績タブ
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                実績を記録
              </h4>
              
              <div 
                className="p-3 rounded mb-3 text-white"
                style={{ backgroundColor: getCategoryColor(scheduleInfo?.categoryId) }}
              >
                <p className="font-medium">{getCategoryName(scheduleInfo?.categoryId)}</p>
                <p className="text-sm mt-1">
                  現在の状態: 
                  <span className={`ml-2 py-1 px-2 rounded-full text-sm ${
                    achievementStatus 
                      ? ACHIEVEMENT_ICONS[achievementStatus].color
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {achievementStatus 
                      ? ACHIEVEMENT_ICONS[achievementStatus].title
                      : '未記録'}
                    {achievementStatus && <span className="text-white ml-1">{ACHIEVEMENT_ICONS[achievementStatus].icon}</span>}
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">状態を選択してください：</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAchievementSave(ACHIEVEMENT_STATUS.COMPLETED)}
                    className={`px-3 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 flex items-center justify-center ${
                      achievementStatus === ACHIEVEMENT_STATUS.COMPLETED ? 'ring-2 ring-green-300' : ''
                    }`}
                  >
                    完了 <span className="text-white ml-1">{ACHIEVEMENT_ICONS[ACHIEVEMENT_STATUS.COMPLETED].icon}</span>
                  </button>
                  <button
                    onClick={() => handleAchievementSave(ACHIEVEMENT_STATUS.PARTIAL)}
                    className={`px-3 py-2 bg-yellow-600 text-white font-bold rounded hover:bg-yellow-700 flex items-center justify-center ${
                      achievementStatus === ACHIEVEMENT_STATUS.PARTIAL ? 'ring-2 ring-yellow-300' : ''
                    }`}
                  >
                    部分的 <span className="text-white ml-1">{ACHIEVEMENT_ICONS[ACHIEVEMENT_STATUS.PARTIAL].icon}</span>
                  </button>
                  <button
                    onClick={() => handleAchievementSave(ACHIEVEMENT_STATUS.FAILED)}
                    className={`px-3 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 flex items-center justify-center ${
                      achievementStatus === ACHIEVEMENT_STATUS.FAILED ? 'ring-2 ring-red-300' : ''
                    }`}
                  >
                    未達成 <span className="text-white ml-1">{ACHIEVEMENT_ICONS[ACHIEVEMENT_STATUS.FAILED].icon}</span>
                  </button>
                </div>
                
                {/* 実績削除ボタン（実績が存在する場合のみ表示） */}
                {achievementStatus && (
                  <button
                    onClick={handleAchievementDelete}
                    className="w-full mt-3 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    実績を削除
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* モーダルフッター */}
        <div className="bg-gray-50 px-4 py-3 border-t rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;