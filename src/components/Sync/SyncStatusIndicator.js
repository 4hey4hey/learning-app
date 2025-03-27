import React, { useState } from 'react';
import { useSyncContext } from '../../contexts/SyncContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 同期状態インジケーターコンポーネント
 * アプリケーションのオンライン/オフライン状態と同期状態を表示
 */
const SyncStatusIndicator = () => {
  const { syncStatus, syncNow, toggleOfflineMode } = useSyncContext();
  const { online, pendingChanges, lastSynced, syncInProgress, error } = syncStatus;
  const [isExpanded, setIsExpanded] = useState(false);

  // 最終同期時間のフォーマット
  const formatLastSynced = () => {
    if (!lastSynced) return '未同期';
    
    return format(new Date(lastSynced), 'M月d日 HH:mm', { locale: ja });
  };

  // オフラインモード切り替えハンドラ
  const handleToggleOfflineMode = () => {
    toggleOfflineMode(!online);
  };

  // 手動同期ハンドラ
  const handleManualSync = () => {
    syncNow();
  };

  // 詳細表示の切り替え
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      {/* コンパクト表示 */}
      <div 
        className="flex items-center space-x-2 py-1 px-3 bg-white rounded-full shadow-sm border text-sm cursor-pointer"
        onClick={toggleExpanded}
      >
        {/* 同期状態アイコン */}
        <div className="flex items-center">
          {syncInProgress ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          ) : online ? (
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          )}
        </div>
        
        {/* 同期状態テキスト */}
        <div className="text-gray-700">
          {syncInProgress ? (
            <span>同期中...</span>
          ) : online ? (
            <span className="text-green-600">オンライン</span>
          ) : (
            <span className="text-yellow-600">オフライン</span>
          )}
        </div>
        
        {/* エラーアイコン */}
        {error && (
          <span className="text-red-500">⚠️</span>
        )}
        
        {/* 変更インジケーター */}
        {pendingChanges && !syncInProgress && (
          <span className="text-yellow-500">●</span>
        )}
      </div>
      
      {/* 展開時の詳細表示 */}
      {isExpanded && (
        <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-10 w-64">
          <div className="flex flex-col space-y-3">
            {/* 現在の状態 */}
            <div>
              <p className="font-medium">現在の状態</p>
              <p className={`text-sm ${online ? 'text-green-600' : 'text-yellow-600'}`}>
                {online ? 'オンライン' : 'オフライン'} {syncInProgress && '(同期中...)'}
              </p>
            </div>
            
            {/* 最終同期時間 */}
            {lastSynced && (
              <div>
                <p className="font-medium">最終同期</p>
                <p className="text-sm text-gray-600">{formatLastSynced()}</p>
              </div>
            )}
            
            {/* 変更状態 */}
            <div>
              <p className="font-medium">変更状態</p>
              <p className="text-sm text-gray-600">
                {pendingChanges 
                  ? <span className="text-yellow-600">未同期の変更があります</span> 
                  : <span className="text-green-600">同期済み</span>}
              </p>
            </div>
            
            {/* エラーメッセージ */}
            {error && (
              <div>
                <p className="font-medium text-red-600">エラー</p>
                <p className="text-sm text-red-600 break-words">{error}</p>
              </div>
            )}
            
            {/* アクションボタン */}
            <div className="flex space-x-2 pt-2">
              {/* 手動同期ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSync();
                }}
                disabled={syncInProgress || !online}
                className={`flex-1 text-xs px-2 py-1.5 rounded ${
                  syncInProgress || !online
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={!online ? 'オフラインモードでは同期できません' : '手動で同期を実行'}
              >
                同期
              </button>
              
              {/* オンライン/オフラインモード切り替えボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOfflineMode();
                }}
                disabled={syncInProgress}
                className={`flex-1 text-xs px-2 py-1.5 rounded ${
                  syncInProgress
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : online
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={online ? 'オフラインモードに切り替え' : 'オンラインモードに切り替え'}
              >
                {online ? 'オフラインに切替' : 'オンラインに切替'}
              </button>
            </div>
            
            {/* ヒント */}
            <div className="text-xs text-gray-500 pt-1">
              クリックすると閉じます
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
