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
  getWeekIdentifier
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
  // 実績登録後のコールバック関数のリスト
  const [achievementCallbacks, setAchievementCallbacks] = useState([]);
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
      } else {
        // 保存されていない場合はデフォルト値(true)を保存
        localStorage.setItem('includeAchievementsInStats', JSON.stringify(true));
      }
    } catch (error) {
      achievementLogger.error('設定の読み込みエラー:', error);
    }
  }, []);
  
  // 設定変更時にローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem('includeAchievementsInStats', JSON.stringify(includeAchievementsInStats));
    } catch (error) {
      achievementLogger.error('設定の保存エラー:', error);
    }
  }, [includeAchievementsInStats]);
  
  // スケジュールと実績データから統計値を計算
  useEffect(() => {
    if (schedule && achievements) {
      const stats = calculateAchievementStats(schedule, achievements, ACHIEVEMENT_STATUS);
      setAchievementStats(stats);
    }
  }, [schedule, achievements]);

  // 週の実績を取得する関数
  const fetchAchievements = useCallback(async (weekStart = null) => {
    const targetWeek = weekStart || selectedWeek;
    const normalizedStartDate = getWeekStartDate(targetWeek);
    const weekKey = getWeekIdentifier(normalizedStartDate);
    
    setLoading(true);
    setError(null);
    
    
    try {
      // デモモードの場合はローカルストレージから取得
      if (demoMode) {
        const storageKey = `demo_achievements_${weekKey}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsedAchievements = JSON.parse(storedData);
            setAchievements(parsedAchievements);
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
        
        // 実績をローカルストレージに保存
        
        // 実績登録完了イベントを発行
        window.dispatchEvent(new CustomEvent('achievementDataChanged', {
          detail: { achievement: newAchievement, type: 'save' }
        }));
        
        // コールバックを実行
        achievementCallbacks.forEach((callback) => {
          try {
            callback(newAchievement);
          } catch (callbackError) {
            achievementLogger.error('実績コールバック実行エラー:', callbackError);
          }
        });
        
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
        
        // 実績をFirestoreに保存
        
        // 実績登録完了イベントを発行
        window.dispatchEvent(new CustomEvent('achievementDataChanged', {
          detail: { achievement: newAchievement, type: 'save' }
        }));
        
        // コールバックを実行
        achievementCallbacks.forEach(callback => {
          try {
            callback(newAchievement);
          } catch (callbackError) {
            achievementLogger.error('実績コールバック実行エラー:', callbackError);
          }
        });
        
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
        
        // 実績データ変更イベントをディスパッチ
        window.dispatchEvent(new CustomEvent('achievementDataChanged', {
          detail: { type: 'delete', key: uniqueKey }
        }));
        
        // 実績をローカルストレージから削除
        return true;
      }
      
      // 認証済みユーザーの場合はFirestoreから削除
      if (currentUser) {
        // 現在の実績データを取得
        let currentAchievements = await getDateSpecificData('achievements', weekKey) || {};
        
        // 指定されたキーのデータが存在するか確認
        if (!currentAchievements[uniqueKey]) {
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
        
        // 実績データ変更イベントをディスパッチ
        window.dispatchEvent(new CustomEvent('achievementDataChanged', {
          detail: { type: 'delete', key: uniqueKey }
        }));
        
        // 実績をFirestoreから削除
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
  }, []);
  
  // コールバック登録関数
  const registerAchievementCallback = useCallback((callback) => {
    if (typeof callback !== 'function') {
      achievementLogger.error('コールバックは関数である必要があります');
      return () => {};
    }
    
    // コールバック関数を保存
    setAchievementCallbacks(prev => {
      const newCallbacks = [...prev, callback];
      return newCallbacks;
    });
    
    // クリーンアップ関数を返す
    return () => {
      // コールバックを削除
      setAchievementCallbacks(prev => {
        const filtered = prev.filter(cb => cb !== callback);
        return filtered;
      });
    };
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
    setIncludeAchievementsInStats,
    // コールバック登録関数
    registerAchievementCallback
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