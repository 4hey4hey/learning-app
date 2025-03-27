import React, { 
  createContext, 
  useState, 
  useContext, 
  useCallback, 
  useEffect 
} from 'react';
import { 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { 
  getWeekStartDate, 
  getWeekIdentifier,
  generateScheduleKey
} from '../utils/timeUtils';
import { 
  ACHIEVEMENT_STATUS, 
  ACHIEVEMENT_ICONS,
  generateAchievementKey,
  calculateAchievementStats
} from '../utils/achievementUtils';
import { achievementLogger } from '../utils/loggerUtils';
import { useSchedule } from './ScheduleContext';
// StudyStateContext は循環参照になるため直接インポートしない

// コンテキスト作成
const AchievementContext = createContext();

// カスタムフック定義
function useAchievement() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementはAchievementProviderの内部で使用してください');
  }
  return context;
}

// プロバイダーコンポーネント
function AchievementProvider({ children }) {
  const { currentUser, demoMode } = useAuth();
  const { getDateSpecificData, setDocument } = useFirestore();
  const { schedule, selectedWeek } = useSchedule();
  // カスタムイベントを使用して実績データ変更を通知
  
  const [achievements, setAchievements] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 実績のみを集計に含めるかどうかの状態
  // デフォルトで true に設定し、実績ベースの集計を有効化
  const [includeAchievementsInStats, setIncludeAchievementsInStats] = useState(true);
  
  // 各種状態の統計値
  const [achievementStats, setAchievementStats] = useState({
    recordRate: 0,
    completionRate: 0,
    successRate: 0,
    totalRecorded: 0,
    stats: {}
  });
  
  // ローカルストレージからの設定読み込み
  useEffect(() => {
    try {
      const savedSetting = localStorage.getItem('includeAchievementsInStats');
      if (savedSetting !== null) {
        const parsedValue = JSON.parse(savedSetting);
        setIncludeAchievementsInStats(parsedValue);
        achievementLogger.info('実績設定を読み込みました', { includeAchievementsInStats: parsedValue });
      } else {
        // 保存されていない場合はデフォルト値(true)を保存
        localStorage.setItem('includeAchievementsInStats', JSON.stringify(true));
        achievementLogger.info('実績設定のデフォルト値(true)を保存しました');
      }
    } catch (error) {
      achievementLogger.error('設定の読み込みエラー:', error);
    }
  }, []);
  
  // 設定変更時にローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem('includeAchievementsInStats', JSON.stringify(includeAchievementsInStats));
      achievementLogger.debug('実績設定を保存しました', { includeAchievementsInStats });
    } catch (error) {
      achievementLogger.error('設定の保存エラー:', error);
    }
  }, [includeAchievementsInStats]);
  
  // スケジュールと実績データから統計値を計算
  useEffect(() => {
    if (schedule && achievements) {
      const stats = calculateAchievementStats(schedule, achievements, ACHIEVEMENT_STATUS);
      setAchievementStats(stats);
      
      achievementLogger.debug('実績統計を更新しました', { 
        recordRate: stats.recordRate,
        completionRate: stats.completionRate,
        totalItems: stats.stats.totalPlanned
      });
    }
  }, [schedule, achievements]);

  // 週の実績を取得する関数
  const fetchAchievements = useCallback(async (weekStart = null) => {
    const targetWeek = weekStart || selectedWeek;
    const normalizedStartDate = getWeekStartDate(targetWeek);
    const weekKey = getWeekIdentifier(normalizedStartDate);
    
    setLoading(true);
    setError(null);
    
    achievementLogger.info('実績データ取得開始', { 週: weekKey });
    
    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsedAchievements = JSON.parse(storedData);
            setAchievements(parsedAchievements);
            achievementLogger.info('ローカルストレージから実績データを取得しました', {
              実績数: Object.keys(parsedAchievements).length
            });
            return parsedAchievements;
          } catch (parseError) {
            achievementLogger.error('実績データのパースエラー:', parseError);
          }
        }
        
        // データがない場合は空のオブジェクトを設定
        setAchievements({});
        return {};
      }
      
      // 認証済みユーザーの場合はFirestoreから取得
      if (currentUser) {
        const achievementsData = await getDateSpecificData('achievements', weekKey);
        
        if (!achievementsData) {
          setAchievements({});
          achievementLogger.info('実績データはありません', { 週: weekKey });
          return {};
        }
        
        // 日付データを正規化
        const processedAchievements = {};
        
        // オブジェクトをループして処理
        Object.entries(achievementsData).forEach(([key, achievement]) => {
          if (!achievement) return;
          
          // 日付をDateオブジェクトに変換
          if (achievement.date) {
            if (typeof achievement.date === 'string') {
              achievement.date = new Date(achievement.date);
            } else if (achievement.date.toDate) {
              // Firestoreのタイムスタンプの場合
              achievement.date = achievement.date.toDate();
            }
          }
          
          processedAchievements[key] = achievement;
        });
        
        setAchievements(processedAchievements);
        achievementLogger.info('Firestoreから実績データを取得しました', {
          実績数: Object.keys(processedAchievements).length
        });
        return processedAchievements;
      }
      
      // 未認証かつデモモードでない場合は空のオブジェクトを返す
      setAchievements({});
      return {};
    } catch (error) {
      achievementLogger.error('実績データ取得エラー:', error);
      setError('実績データの取得中にエラーが発生しました。');
      setAchievements({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, selectedWeek, getDateSpecificData]);

  // 週が変更されたときに実績を取得
  useEffect(() => {
    fetchAchievements(selectedWeek);
  }, [selectedWeek, fetchAchievements]);

  // 実績アイコンを取得する関数
  const getAchievementIcon = useCallback((dayKey, hourKey) => {
    try {
      const scheduleItem = schedule?.[dayKey]?.[hourKey];
      if (!scheduleItem) return ACHIEVEMENT_ICONS.default;
      
      // スケジュールアイテムから日付を取得
      const itemDate = scheduleItem.date;
      if (!itemDate) return ACHIEVEMENT_ICONS.default;
      
      // 実績を検索するためのユニークキーを生成
      const uniqueKey = generateAchievementKey(itemDate, dayKey, hourKey);
      
      // 実績を取得
      const achievement = achievements[uniqueKey];
      
      // 実績のステータスに応じたアイコンを返す
      if (achievement && achievement.status && ACHIEVEMENT_ICONS[achievement.status]) {
        return ACHIEVEMENT_ICONS[achievement.status];
      }
      
      return ACHIEVEMENT_ICONS.default;
    } catch (error) {
      achievementLogger.error('実績アイコン取得エラー:', error);
      return ACHIEVEMENT_ICONS.default;
    }
  }, [schedule, achievements]);

  // ユニークキーを生成する関数
  const generateUniqueKey = useCallback((date, dayKey, hourKey) => {
    return generateAchievementKey(date, dayKey, hourKey);
  }, []);

  // 実績を保存する関数
  const saveAchievement = useCallback(async (uniqueKey, status, comment = '') => {
    if (!uniqueKey || !status) {
      setError('実績の保存に必要なデータが不足しています。');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    achievementLogger.info('実績保存開始', { キー: uniqueKey, 状態: status });
    
    try {
      // キーから日付情報を抽出
      const [dateStr, dayKey, hourKey] = uniqueKey.split('_');
      if (!dateStr || !dayKey || !hourKey) {
        throw new Error('無効な実績キー形式です: ' + uniqueKey);
      }
      
      // 週の開始日を取得
      const itemDate = new Date(dateStr);
      const weekStart = getWeekStartDate(itemDate);
      const weekKey = getWeekIdentifier(weekStart);
      
      // 新しい実績データ
      const newAchievement = {
        id: `achievement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status,
        comment,
        dayKey,
        hourKey,
        date: Timestamp.fromDate(itemDate),
        createdAt: serverTimestamp()
      };
      
      // デモモードの場合はローカルストレージに保存
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        
        // 現在の実績データを取得
        const storedAchievements = localStorage.getItem(storageKey);
        let currentAchievements = storedAchievements ? JSON.parse(storedAchievements) : {};
        
        // 実績データを更新
        currentAchievements[uniqueKey] = newAchievement;
        
        // ローカルストレージに保存
        localStorage.setItem(storageKey, JSON.stringify(currentAchievements));
        
        // ステートの更新
        setAchievements(prev => ({
          ...prev,
          [uniqueKey]: newAchievement
        }));
        
        achievementLogger.info('実績をローカルストレージに保存しました', { キー: uniqueKey });
        return newAchievement;
      }
      
      // 認証済みユーザーの場合はFirestoreに保存
      if (currentUser) {
        // 現在の実績データを取得
        let currentAchievements = await getDateSpecificData('achievements', weekKey) || {};
        
        // 実績データを更新
        currentAchievements[uniqueKey] = newAchievement;
        
        // Firestoreに保存
        await setDocument('achievements', weekKey, currentAchievements);
        
        // ステートの更新
        setAchievements(prev => ({
          ...prev,
          [uniqueKey]: newAchievement
        }));
        
        achievementLogger.info('実績をFirestoreに保存しました', { キー: uniqueKey });
        return newAchievement;
      }
      
      return null;
    } catch (error) {
      achievementLogger.error('実績保存エラー:', error);
      setError('実績の保存中にエラーが発生しました。');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, getDateSpecificData, setDocument]);

  // 実績データを削除する関数
  const deleteAchievement = useCallback(async (uniqueKey) => {
    if (!uniqueKey) {
      setError('削除する実績のキーが指定されていません。');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    achievementLogger.info('実績削除開始', { キー: uniqueKey });
    
    try {
      // キーから日付情報を抽出
      const [dateStr, dayKey, hourKey] = uniqueKey.split('_');
      if (!dateStr || !dayKey || !hourKey) {
        throw new Error('無効な実績キー形式です: ' + uniqueKey);
      }
      
      // 週の開始日を取得
      const itemDate = new Date(dateStr);
      const weekStart = getWeekStartDate(itemDate);
      const weekKey = getWeekIdentifier(weekStart);
      
      // デモモードの場合はローカルストレージから削除
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        
        // 現在の実績データを取得
        const storedAchievements = localStorage.getItem(storageKey);
        if (!storedAchievements) return true;
        
        // JSONとしてパース
        let currentAchievements = JSON.parse(storedAchievements);
        
        // 指定されたキーのデータが存在するか確認
        if (!currentAchievements[uniqueKey]) {
          achievementLogger.warn('削除する実績が見つかりません', { キー: uniqueKey });
          return true;
        }
        
        // 実績データを削除
        delete currentAchievements[uniqueKey];
        
        // ローカルストレージに保存
        localStorage.setItem(storageKey, JSON.stringify(currentAchievements));
        
        // ステートの更新
        setAchievements(prev => {
          const newAchievements = { ...prev };
          delete newAchievements[uniqueKey];
          return newAchievements;
        });
        
        // 実績データ変更イベントをディスパッチ - イベントを即座に発行
        window.dispatchEvent(new CustomEvent('achievementDataChanged'));
        achievementLogger.info('実績データ変更イベントを発行');
        
        achievementLogger.info('実績をローカルストレージから削除しました', { キー: uniqueKey });
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreから削除
      if (currentUser) {
        // 現在の実績データを取得
        let currentAchievements = await getDateSpecificData('achievements', weekKey) || {};
        
        // 指定されたキーのデータが存在するか確認
        if (!currentAchievements[uniqueKey]) {
          achievementLogger.warn('削除する実績が見つかりません', { キー: uniqueKey });
          return true;
        }
        
        // 実績データを削除
        delete currentAchievements[uniqueKey];
        
        // Firestoreに保存
        await setDocument('achievements', weekKey, currentAchievements);
        
        // ステートの更新
        setAchievements(prev => {
          const newAchievements = { ...prev };
          delete newAchievements[uniqueKey];
          return newAchievements;
        });
        
        // 実績データ変更イベントをディスパッチ - イベントを即座に発行
        window.dispatchEvent(new CustomEvent('achievementDataChanged'));
        achievementLogger.info('実績データ変更イベントを発行');
        
        achievementLogger.info('実績をFirestoreから削除しました', { キー: uniqueKey });
        return true;
      }
      
      return false;
    } catch (error) {
      achievementLogger.error('実績削除エラー:', error);
      setError('実績の削除中にエラーが発生しました。');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, demoMode, getDateSpecificData, setDocument]);

  // 実績データをリセットする関数
  const resetAchievements = useCallback(() => {
    setAchievements({});
    achievementLogger.info('実績データをリセットしました');
  }, []);
  
  // プロバイダーのコンテキスト値
  const value = {
    achievements,
    achievementStats,
    loading,
    error,
    fetchAchievements,
    saveAchievement,
    deleteAchievement,
    getAchievementIcon,
    generateUniqueKey,
    resetAchievements,
    ACHIEVEMENT_STATUS,
    ACHIEVEMENT_ICONS,
    // 実績のみを集計に含めるかどうかの設定
    includeAchievementsInStats,
    setIncludeAchievementsInStats
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

// エクスポート
export { 
  useAchievement, 
  AchievementProvider
}; 

// 定数は個別にエクスポート
export { ACHIEVEMENT_STATUS, ACHIEVEMENT_ICONS };