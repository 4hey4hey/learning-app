import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import WeeklyCalendar from '../components/Calendar/WeeklyCalendar';
import CategoryManager from '../components/Categories/CategoryManager';
import StatsDashboard from '../components/Stats/StatsDashboard';
import TemplateManager from '../components/Templates/TemplateManager';
import AchievementManager from '../components/Achievements/AchievementManager';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import PokemonAchievementModal from '../components/Collection/PokemonAchievementModal';
import MilestoneModal from '../components/Modal/MilestoneModal';
import { useAuth } from '../hooks/useAuth';
import { useStudyState } from '../contexts/StudyStateContext';
import { useDataDeletion } from '../hooks/useDataDeletion';
import { useSchedule } from '../contexts/ScheduleContext';
import { usePokemonAchievement } from '../contexts/PokemonAchievementContext';
import { useMilestoneModal } from '../hooks/useMilestoneModal';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { showSimpleModal } from '../utils/modal/simpleModal';
import '../utils/modal/superSimpleModal';
import '../utils/modal/basicModal';
import '../utils/modal/pngModal';
import '../utils/modal/finalModal';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { isLoading } = useStudyState();
  const { selectedWeek } = useSchedule();
  const { clearWeekData } = useDataDeletion();
  const { newPokemon, closePokemonAchievementModal } = usePokemonAchievement();
  const { milestone, closeMilestoneModal, checkMilestoneManually, clearShownMilestones, showMilestoneDirectly } = useMilestoneModal();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // 週の範囲を表示するための関数
  const getWeekRangeText = () => {
    if (!selectedWeek) return "";
    const startDate = selectedWeek;
    const endDate = addDays(startDate, 6);
    const startText = format(startDate, 'M月d日', { locale: ja });
    const endText = format(endDate, 'M月d日', { locale: ja });
    return `${startText}〜${endText}`;
  };
  
  /**
   * データクリアの確認ダイアログを表示
   */
  const handleClearWeek = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);
  
  /**
   * 週間データのクリアを実行
   */
  const executeWeekClear = useCallback(async () => {
    try {
      const result = await clearWeekData(selectedWeek);
      if (!result) {
        console.warn('データクリアに失敗しました');
      }
    } catch (error) {
      console.error('データクリアエラー:', error);
    } finally {
      setIsConfirmOpen(false);
    }
  }, [clearWeekData, selectedWeek]);
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-4 no-print">
        <h1 className="text-2xl font-bold text-gray-800">
          ようこそ、{currentUser?.displayName || currentUser?.email}さん
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              {/* マイルストーン手動チェックボタン */}
              <button
                onClick={checkMilestoneManually}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                マイルストーンチェック
              </button>
              
              {/* 最終モーダル表示ボタン */}
              <button
                onClick={() => window.showFinalModal()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                ヒトカゲモーダル
              </button>


              {/* 基本モーダル表示ボタン */}
              <button
                onClick={() => window.showBasicModal()}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                基本モーダル
              </button>
              
              {/* SVGモーダル表示ボタン */}
              <button
                onClick={() => window.showPngModal()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                SVGモーダル
              </button>
              
              {/* スーパーシンプルモーダル表示ボタン */}
              <button
                onClick={() => window.showSuperSimpleModal('ヒトカゲ', '15時間達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                アラート表示
              </button>
              
              <button
                onClick={clearShownMilestones}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                マイルストーンリセット
              </button>
              
              {/* 直接モーダル表示ボタン */}
              <button
                onClick={() => showMilestoneDirectly()}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                モーダル直接表示
              </button>
              
              {/* シンプルモーダル表示ボタン */}
              <button
                onClick={() => showSimpleModal('ヒトカゲ', '15時間達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="50" fill="orange"/><circle cx="55" cy="65" r="5" fill="black"/><circle cx="95" cy="65" r="5" fill="black"/><path d="M 60 90 Q 75 100 90 90" stroke="black" stroke-width="2" fill="none"/></svg>')}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                シンプルモーダル
              </button>
            </div>
            
            <button
              onClick={handleClearWeek}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              今週のデータをクリア
            </button>
          </div>
          
          <WeeklyCalendar />
          
          {/* 効率時間集計をカレンダーの下に配置 */}
          <div className="mt-6">
            <StatsDashboard />
          </div>
        </div>
        
        <div className="space-y-6 categories-panel">
          <CategoryManager />
          <TemplateManager />
          <AchievementManager />
        </div>
      </div>
      
      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeWeekClear}
        title="データクリアの確認"
        message={
          <>
            <p className="mb-2 font-medium">今週 <span className="text-red-600 font-bold">{getWeekRangeText()}</span> のデータを全て削除します。</p>
            <ul className="list-disc pl-5 mb-2 text-sm">
              <li>スケジュールデータ</li>
              <li>実績データ</li>
            </ul>
            <p className="text-sm text-red-500">この操作は元に戻せません。続行しますか？</p>
          </>
        }
        confirmText="削除する"
        cancelText="キャンセル"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      
      {/* ポケモン獲得モーダル */}
      {newPokemon && (
        <PokemonAchievementModal
          pokemon={newPokemon}
          onClose={closePokemonAchievementModal}
        />
      )}
      
      {/* マイルストーンモーダル */}
      {milestone && (
        <MilestoneModal
          milestone={milestone}
          onClose={closeMilestoneModal}
        />
      )}
    </MainLayout>
  );
};

export default Dashboard;
