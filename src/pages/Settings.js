import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useStudyContext } from '../contexts/StudyContext';
import { useAuth } from '../hooks/useAuth';
import { useSyncContext } from '../contexts/SyncContext';
import { DataMigration } from '../utils/migrationUtils';
import { useDataDeletion } from '../hooks/useDataDeletion';
import { useToast } from '../contexts/ToastContext';

const Settings = () => {
  const { 
    currentUser, 
    demoMode
  } = useAuth();
  
  const { syncStatus, syncNow, toggleOfflineMode } = useSyncContext();
  // 正しい関数名を使用
  const { showSuccess, showError } = useToast();
  const { deleteScheduleData } = useDataDeletion();
  
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [migratableData, setMigratableData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [offlineEnabled, setOfflineEnabled] = useState(!syncStatus?.online);

  // コンポーネントマウント時にローカルデータを確認
  useEffect(() => {
    if (!demoMode && currentUser) {
      const localData = DataMigration.checkLocalData();
      setMigratableData(localData);
    }
  }, [demoMode, currentUser]);

  // オフラインモード切り替え時の処理
  useEffect(() => {
    setOfflineEnabled(!syncStatus?.online);
  }, [syncStatus?.online]);

  // ローカルデータリセット関数
  const handleDataReset = () => {
    if (window.confirm('ローカルに保存されたすべてのデータをリセットしてもよろしいですか？この操作は元に戻せません。')) {
      try {
        setIsResetting(true);

        // ローカルストレージのすべての学習関連データを削除
        const keysToRemove = [
          'studyCategories',
          'studySchedule_',
          'studyTemplates',
          'studyAchievements_'
        ];

        keysToRemove.forEach(prefix => {
          Object.keys(localStorage)
            .filter(key => key.startsWith(prefix))
            .forEach(key => localStorage.removeItem(key));
        });

        // 完了通知
        showSuccess('ローカルのデータをリセットしました。再読み込みします。');
        
        // ページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('データリセット中にエラーが発生しました:', error);
        showError('データのリセットに失敗しました。');
      } finally {
        setIsResetting(false);
      }
    }
  };

  // 予定データのみ削除する関数
  const handleScheduleDataDelete = async () => {
    if (demoMode) {
      showError('デモモードでは利用できません');
      return;
    }

    // 確認ダイアログを表示
    if (window.confirm('クラウド上の予定データ（スケジュール）のみを削除しますか？この操作は元に戻せません。')) {
      try {
        setIsDeleting(true);
        
        // 削除実行
        const result = await deleteScheduleData();
        
        if (result.success) {
          showSuccess(result.message);
          // ページをリロード
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showError(result.message);
        }
      } catch (error) {
        console.error('予定データ削除中にエラーが発生しました:', error);
        showError('予定データの削除に失敗しました。');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // データ移行関数
  const handleMigrateData = async () => {
    if (!currentUser || demoMode) return;
    
    try {
      setIsMigrating(true);
      setMigrationResult(null);
      
      // データ移行を実行
      const result = await DataMigration.migrateAllData(currentUser.uid);
      setMigrationResult(result);
      
      // 移行後にローカルデータを再確認
      const updatedLocalData = DataMigration.checkLocalData();
      setMigratableData(updatedLocalData);
      
      // 移行成功したら同期を実行
      if (result.success) {
        await syncNow();
      }
    } catch (error) {
      console.error('データ移行中にエラーが発生しました:', error);
      setMigrationResult({
        success: false,
        error: error.message || 'データの移行に失敗しました'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // オフラインモード切り替えハンドラ
  const handleOfflineModeToggle = async () => {
    if (demoMode) return;
    
    try {
      await toggleOfflineMode(!offlineEnabled);
    } catch (error) {
      console.error('オフラインモード切り替えエラー:', error);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">アカウント情報</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">ユーザー:</span>{' '}
              {demoMode ? 'デモユーザー' : (currentUser?.displayName || currentUser?.email)}
            </p>
            <p>
              <span className="font-medium">モード:</span>{' '}
              {demoMode ? 'デモモード' : '通常モード'}
            </p>
          </div>
        </div>

        {/* オフラインモード設定 */}
        {!demoMode && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">オフライン設定</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">オフラインモード</p>
                <p className="text-sm text-gray-600">
                  オフラインモードでは、インターネット接続なしで作業できますが、データの同期は手動で行う必要があります。
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={offlineEnabled}
                  onChange={handleOfflineModeToggle}
                  disabled={syncStatus?.syncInProgress}
                />
                <div className={`
                  w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                  peer-focus:ring-blue-300 rounded-full peer 
                  peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all 
                  ${offlineEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                  ${syncStatus?.syncInProgress ? 'opacity-50 cursor-not-allowed' : ''}
                `}></div>
              </label>
            </div>
            <div className="mt-2 text-sm">
              <p className={`${offlineEnabled ? 'text-yellow-600' : 'text-green-600'}`}>
                {offlineEnabled
                  ? '⚠️ オフラインモードが有効です。データはデバイスに保存され、手動で同期する必要があります。'
                  : '✅ オンラインモードが有効です。データは自動的に同期されます。'}
              </p>
            </div>
          </div>
        )}

        {/* データ移行セクション */}
        {!demoMode && currentUser && migratableData && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">データ移行</h2>
            
            <div className="mb-4">
              <p className="mb-2">
                ローカルに保存されたデータが見つかりました。クラウドに移行することができます。
              </p>
              
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-medium mb-2">移行可能なデータ:</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="font-medium">カテゴリ:</span>{' '}
                    {migratableData.categories ? '✅ あり' : '❌ なし'}
                  </li>
                  <li>
                    <span className="font-medium">スケジュール:</span>{' '}
                    {migratableData.schedules.length > 0 
                      ? `✅ ${migratableData.schedules.length}件` 
                      : '❌ なし'}
                  </li>
                  <li>
                    <span className="font-medium">テンプレート:</span>{' '}
                    {migratableData.templates ? '✅ あり' : '❌ なし'}
                  </li>
                  <li>
                    <span className="font-medium">実績データ:</span>{' '}
                    {migratableData.achievements.length > 0 
                      ? `✅ ${migratableData.achievements.length}件` 
                      : '❌ なし'}
                  </li>
                </ul>
              </div>
            </div>
            
            {/* 移行結果 */}
            {migrationResult && (
              <div className={`mb-4 p-4 rounded border ${
                migrationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="font-medium mb-2">
                  {migrationResult.success ? '✅ 移行完了' : '❌ 移行失敗'}
                </h3>
                
                {migrationResult.results && (
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-medium">カテゴリ:</span>{' '}
                      {migrationResult.results.categories ? '✅ 成功' : '❌ 失敗または未実行'}
                    </li>
                    <li>
                      <span className="font-medium">スケジュール:</span>{' '}
                      {`${migrationResult.results.schedules.migrated}件成功, ${migrationResult.results.schedules.failed}件失敗`}
                    </li>
                    <li>
                      <span className="font-medium">テンプレート:</span>{' '}
                      {migrationResult.results.templates ? '✅ 成功' : '❌ 失敗または未実行'}
                    </li>
                    <li>
                      <span className="font-medium">実績データ:</span>{' '}
                      {`${migrationResult.results.achievements.migrated}件成功, ${migrationResult.results.achievements.failed}件失敗`}
                    </li>
                  </ul>
                )}
                
                {migrationResult.error && (
                  <p className="text-red-600 mt-2">エラー: {migrationResult.error}</p>
                )}
              </div>
            )}
            
            <button
              onClick={handleMigrateData}
              disabled={isMigrating || !migratableData || (
                !migratableData.categories && 
                migratableData.schedules.length === 0 && 
                !migratableData.templates && 
                migratableData.achievements.length === 0
              )}
              className={`
                w-full py-2 rounded text-white
                ${isMigrating || !migratableData || (
                  !migratableData.categories && 
                  migratableData.schedules.length === 0 && 
                  !migratableData.templates && 
                  migratableData.achievements.length === 0
                )
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'}
              `}
            >
              {isMigrating ? '移行中...' : 'ローカルデータをクラウドに移行する'}
            </button>
          </div>
        )}

        {/* 予定データ削除セクション */}
        {!demoMode && currentUser && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">予定データの削除</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-700">
                <strong>注意:</strong> この操作を行うと、クラウド上に保存された予定データ（スケジュール）のみが削除されます。
                カテゴリ、実績データ、テンプレートは保持されます。この操作は元に戻せません。
              </p>
            </div>
            <button
              onClick={handleScheduleDataDelete}
              disabled={isDeleting || syncStatus?.syncInProgress}
              className={`
                w-full py-2 rounded text-white
                ${isDeleting || syncStatus?.syncInProgress
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600'}
              `}
            >
              {isDeleting 
                ? '削除中...' 
                : '予定データのみを削除'}
            </button>
            {syncStatus?.syncInProgress && (
              <p className="text-yellow-600 text-sm mt-2">
                ⚠️ 同期中はデータを削除できません。同期が完了するまでお待ちください。
              </p>
            )}
          </div>
        )}

        {/* ローカルデータリセット */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">ローカルデータリセット</h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">
              警告: この操作を行うと、ローカルに保存されたすべての学習データが完全に削除されます。
              この操作は元に戻せません。
            </p>
          </div>
          <button
            onClick={handleDataReset}
            disabled={isResetting}
            className={`
              w-full py-2 rounded 
              ${isResetting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'}
            `}
          >
            {isResetting ? 'リセット中...' : 'ローカルデータをリセット'}
          </button>
        </div>

        {/* デモモード説明 */}
        {demoMode && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-700">
              デモモードでは、データは一時的にローカルストレージに保存されます。
              ブラウザを閉じると、データは自動的に削除されます。
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Settings;
