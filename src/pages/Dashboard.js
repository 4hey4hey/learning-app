import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import WeeklyCalendar from '../components/Calendar/WeeklyCalendar';
import CategoryManager from '../components/Categories/CategoryManager';
import StatsDashboard from '../components/Stats/StatsDashboard';
import TemplateManager from '../components/Templates/TemplateManager';
// AchievementManagerの参照を削除
import GoalPanel from '../components/Goals/GoalPanel';
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
import '../utils/modal/finalModal';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { isLoading } = useStudyState();
  const { selectedWeek } = useSchedule();
  const { clearWeekData } = useDataDeletion();
  const { newPokemon, closePokemonAchievementModal } = usePokemonAchievement();
  const { milestone, closeMilestoneModal, checkMilestoneManually } = useMilestoneModal();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // メッセージ一覧
  const welcomeMessages = [
    `ようこそ、${currentUser?.displayName || currentUser?.email}さん！今日も頑張りましょう！⚡`,
    `やっほー！${currentUser?.displayName || currentUser?.email}さん、学習の時間ですよ！⚡`,
    `今日は何を勉強しますか？${currentUser?.displayName || currentUser?.email}さん！⚡`,
    `${currentUser?.displayName || currentUser?.email}さん、目標に向かって一緒に頑張りましょう！⚡`,
    `おかえりなさい、${currentUser?.displayName || currentUser?.email}さん！今日も充実した一日にしましょう！⚡`,
    `${currentUser?.displayName || currentUser?.email}さんの学習をサポートします！⚡`,
    `今日の目標は達成できそうですか？${currentUser?.displayName || currentUser?.email}さん！⚡`,
    `集中力アップ！${currentUser?.displayName || currentUser?.email}さん、一緒に頑張りましょう！⚡`,
    `${currentUser?.displayName || currentUser?.email}さん、少しずつ前進しましょう！継続は力なり⚡`,
    `学習モード、スタート！${currentUser?.displayName || currentUser?.email}さん、今日も一緒に頑張りましょう！⚡`
  ];
  
  // ページ読み込み時にメッセージをランダムに選択
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setWelcomeMessage(welcomeMessages[randomIndex]);
  }, []);
  
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
        // 処理が失敗した場合
      }
    } catch (error) {
      // エラー処理
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
      <div className="mb-6 no-print">
        <div className="flex items-start">
          <div className="relative mr-4">
            <img src="/pokemon/magnemite.png" alt="マグネミテ" className="h-20 w-20 object-contain" />
          </div>
          <div className="relative bg-white rounded-lg p-3 shadow-sm inline-block">
            <div className="absolute w-4 h-4 bg-white transform rotate-45 left-[-8px] top-6"></div>
            <p className="relative text-lg font-bold text-gray-700 z-10 tracking-wide" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
              {welcomeMessage}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-grow"></div> {/* 左側の空白スペース */}
            
            <button
              onClick={handleClearWeek}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center text-sm no-print mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              今週のデータをクリア
            </button>
            
            {process.env.NODE_ENV !== 'production' && (
              <button
                onClick={() => checkMilestoneManually()}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center text-sm no-print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                </svg>
                マイルストーン確認
              </button>
            )}
          </div>
          
          <WeeklyCalendar />
          
          {/* 効率時間集計 */}
          <div className="mt-6">
            <StatsDashboard />
          </div>
        </div>
        
        <div className="space-y-6 categories-panel">
          <TemplateManager />
          <GoalPanel />
          <CategoryManager />
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