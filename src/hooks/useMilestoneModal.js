import { useState, useEffect, useCallback, useRef } from 'react';
import { showMilestoneModal } from '../utils/modal/showMilestoneModal';
import { useStudyState } from '../contexts/StudyStateContext';
import { usePokemonCollection } from '../components/Collection/hooks/usePokemonCollection';
import { useAchievement } from '../contexts/AchievementContext';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { useSchedule } from '../contexts/ScheduleContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { POKEMON_DATA } from '../constants/pokemonData';

export function useMilestoneModal() {
  const { totalStudyHours, allTimeData } = useStudyState();
  const { checkNewPokemonAchievement, pokemonCollection } = usePokemonCollection();
  const { registerAchievementCallback, achievements, fetchAchievements } = useAchievement();
  const { getDocument, getAllDocuments } = useFirestore();
  const { currentUser, demoMode } = useAuth();
  const { selectedWeek } = useSchedule();
  const [milestone, setMilestone] = useState(null);
  // 共通のポケモンデータファイルを使用
  // 元の状態管理を削除したが、互換性のためローカル変数として保持
  const pokemonData = POKEMON_DATA;
  const [shownMilestones, setShownMilestones] = useState([]);
  
  // 実績から直接学習時間を計算する関数
  const calculateDirectStudyHours = useCallback(async (latestAchievements = null) => {
    try {
      // 非認証ユーザーまたはデモモードの場合は既存の値を使用
      if (!currentUser || demoMode) {
        return allTimeData?.totalHours || totalStudyHours;
      }
      
      // 全週の実績データを取得する場合
      if (!latestAchievements) {
        try {
          // 全週の実績データを取得
          const achievementsData = await getAllDocuments('achievements');
          if (!achievementsData || Object.keys(achievementsData).length === 0) {
            return allTimeData?.totalHours || totalStudyHours;
          }
          
          // 実績データを平坦化
          const flattenedAchievements = processFirestoreAchievements(achievementsData);
          
          // 実績ステータスに基づいて学習時間を計算
          let calculatedHours = 0;
          let completedCount = 0;
          let partialCount = 0;
          let failedCount = 0;
          
          Object.values(flattenedAchievements).forEach(achievement => {
            if (achievement.status === 'completed') {
              // 完了: 1時間
              calculatedHours += 1;
              completedCount++;
            } else if (achievement.status === 'partial') {
              // 部分的: 0.7時間
              calculatedHours += 0.7;
              partialCount++;
            } else if (achievement.status === 'failed') {
              failedCount++;
            }
          });
          
          // 小数点以下を丸める（小数点第2位まで保持）
          calculatedHours = Math.round(calculatedHours * 100) / 100;
          
          // 計算結果を返す
          return calculatedHours;
        } catch (error) {
          return allTimeData?.totalHours || totalStudyHours;
        }
      }
      
      // 引数があれば簡易計算を実行
      const achievementsToUse = latestAchievements || {};
      
      // 実績ステータスに基づいて学習時間を計算
      let calculatedHours = 0;
      let completedCount = 0;
      let partialCount = 0;
      let failedCount = 0;
      
      Object.values(achievementsToUse).forEach(achievement => {
        if (achievement.status === 'completed') {
          // 完了: 1時間
          calculatedHours += 1;
          completedCount++;
        } else if (achievement.status === 'partial') {
          // 部分的: 0.7時間
          calculatedHours += 0.7;
          partialCount++;
        } else if (achievement.status === 'failed') {
          failedCount++;
        }
      });
      
      // 小数点以下を丸める（小数点第2位まで保持）
      calculatedHours = Math.round(calculatedHours * 100) / 100;
      
      return calculatedHours;
    } catch (error) {
      return allTimeData?.totalHours || totalStudyHours;
    }
  }, [currentUser, demoMode, allTimeData, totalStudyHours, achievements, getAllDocuments]);
  
  // Firestoreの実績データを平坦化する関数
  const processFirestoreAchievements = useCallback((achievementsData) => {
    try {
      const flattenedAchievements = {};
      
      // 各週のドキュメントを処理
      Object.entries(achievementsData).forEach(([weekId, weekData]) => {
        // 週IDが有効で、weekDataがオブジェクトの場合
        if (weekId && typeof weekData === 'object' && weekData !== null) {
          // updatedAt以外の各エントリを処理
          Object.entries(weekData).forEach(([key, achievement]) => {
            // updatedAt以外で、実績オブジェクトの場合
            if (key !== 'updatedAt' && achievement && achievement.status) {
              // 展開した実績に追加
              flattenedAchievements[`${weekId}_${key}`] = achievement;
            }
          });
        }
      });
      
      return flattenedAchievements;
    } catch (error) {
      return {};
    }
  }, []);
  
  // コールバック登録を追跡するためのref
  const callbackRegisteredRef = useRef(false);

  // ローカルストレージキー（フォールバック用）
  const MILESTONE_STORAGE_KEY = 'shown_milestones';
  
  // Firebaseから表示済みポケモンのリストを取得
  const fetchShownMilestones = useCallback(async () => {
    try {
      // 常にローカルストレージのデータを読み込んでおく（フォールバック用）
      let localMilestones = [];
      try {
        localMilestones = JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
      } catch (localStorageError) {
        localMilestones = [];
      }

      // 非Authenticatedユーザーの場合はローカルストレージを使用
      if (!currentUser || demoMode) {
        setShownMilestones(localMilestones);
        return localMilestones;
      }
      
      try {
        // Firebaseからデータを取得する試行
        const achievementsRef = doc(db, `users/${currentUser.uid}/pokemonAchievements/shown`);
        const achievementsDoc = await getDoc(achievementsRef);
        
        if (achievementsDoc.exists() && achievementsDoc.data().list) {
          const shownList = achievementsDoc.data().list;
          
          // ローカルストレージも更新して同期を維持
          try {
            localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(shownList));
          } catch (syncError) {
            // エラー処理
          }
          
          setShownMilestones(shownList);
          return shownList;
        } else {
          // 初期化の必要がある場合
          
          // ローカルストレージに既存のデータがあれば、それをFirestoreの初期値として使用
          try {
            await setDoc(achievementsRef, {
              list: localMilestones, // ローカルデータを初期値として使用
              updatedAt: serverTimestamp()
            });
            setShownMilestones(localMilestones);
            return localMilestones;
          } catch (innerError) {
            setShownMilestones(localMilestones);
            return localMilestones;
          }
        }
      } catch (firestoreError) {
        // Firestoreアクセス時のエラー: 権限不足など
        setShownMilestones(localMilestones);
        return localMilestones;
      }
    } catch (error) {
      // 最終手段としてデフォルト値を返す
      try {
        const localMilestones = JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
        setShownMilestones(localMilestones);
        return localMilestones;
      } catch (finalError) {
        setShownMilestones([]);
        return [];
      }
    }
  }, [currentUser, demoMode]);
  
  // 表示済みポケモンリストを保存
  const saveShownMilestones = useCallback(async (updatedList) => {
    try {
      // 連続するエラーを貴重なユーザーデータの喪失となるのを防ぐため、入力値を検証
      if (!Array.isArray(updatedList)) {
        // 古い値を取得して使用
        const existingList = await fetchShownMilestones();
        return existingList.length > 0; // 古い値が存在すれば成功とみなす
      }
      
      // セットに変換して重複除去後、配列に戻す
      const uniqueList = [...new Set(updatedList)];
      
      // まずは常にローカルストレージに保存する（フォールバック用）
      try {
        localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(uniqueList));
      } catch (localStorageError) {
        // ローカルストレージに保存できなくても続行
      }
      
      // 非Authenticatedユーザーの場合はローカルストレージのみを使用
      if (!currentUser || demoMode) {
        setShownMilestones(uniqueList);
        return true;
      }
      
      try {
        // Firestoreに保存する試行
        const achievementsRef = doc(db, `users/${currentUser.uid}/pokemonAchievements/shown`);
        await setDoc(achievementsRef, {
          list: uniqueList,
          updatedAt: serverTimestamp()
        });
        
        setShownMilestones(uniqueList);
        return true;
      } catch (firestoreError) {
        // Firestore保存エラー時はローカルストレージのみで成功とみなす
        
        setShownMilestones(uniqueList);
        // ローカルストレージには保存できたので成功扱い
        return true;
      }
    } catch (error) {
      try {
        // 最終手段としてローカルストレージへの保存を試行
        localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(updatedList));
        setShownMilestones(updatedList);
        return true;
      } catch (localStorageError) {
        return false;
      }
    }
  }, [currentUser, demoMode, fetchShownMilestones]);

  // 初回マウント時に表示済みマイルストーンを取得
  useEffect(() => {
    fetchShownMilestones();
  }, [fetchShownMilestones]);

  // 実績データが更新されたときにデバッグ情報を出力する
  useEffect(() => {
    // 実績データが変更されたときに計算を行う
    if (achievements) {
      // 実績数に基づいて学習時間を計算
      calculateDirectStudyHours();
    }
  }, [achievements, calculateDirectStudyHours]);
  

  // 注釈: 共通のポケモンデータファイルを使用するため、Firebaseからの取得処理を削除

  // 手動でマイルストーンをチェックする関数
  const checkManually = useCallback(async () => {
    try {
      // 必要な依存関係の確認
      if (!checkNewPokemonAchievement) {
        console.log('❗ ポケモンチェック関数が使用できません');
        return null;
      }
      
      // 表示済みマイルストーンを取得（Firestoreから最新の状態を取得）
      const currentShownMilestones = await fetchShownMilestones();
      
      // 全期間の実績データを取得して学習時間を計算
      const manualCalculatedHours = await calculateDirectStudyHours();
      
      // 他のソースからの学習時間と比較
      // 実績から直接計算した値を優先し、それがない場合は他ソースから取得
      const effectiveHours = manualCalculatedHours > 0 ? manualCalculatedHours : (allTimeData?.totalHours || totalStudyHours);

      console.log('マイルストーンチェック中', {
        累計学習時間: effectiveHours,
        表示済み: currentShownMilestones
      });

      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = POKEMON_DATA.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        console.log('条件を満たすポケモン', {
          id: highestPokemon.id,
          name: highestPokemon.name,
          必要時間: highestPokemon.condition.value,
          表示済みか: currentShownMilestones.includes(highestPokemon.id)
        });
        
        // 新しいマイルストーンかどうか
        const isNewMilestone = !currentShownMilestones.includes(highestPokemon.id);
        
        if (isNewMilestone) {
          // 表示済みマイルストーンを先に保存
          const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
          await saveShownMilestones(updatedShownMilestones);

          // 最後にモーダル表示用の状態を設定
          setMilestone(highestPokemon);
          console.log('マイルストーンを設定しました', highestPokemon.name);
          
          return highestPokemon;
        } else {
          // 表示済みの場合は何も表示しない（開発環境も含む）
          console.log('表示済みのためスキップ', highestPokemon.name);
          return null;
        }
      }
      
      console.log('表示可能なマイルストーンはありません');
      return null;
    } catch (error) {
      console.error('マイルストーンチェックエラー', error);
      return null;
    }
  }, [allTimeData, totalStudyHours, checkNewPokemonAchievement, fetchShownMilestones, saveShownMilestones, calculateDirectStudyHours]); // pokemonDataをPOKEMON_DATAに変更したため依存配列から削除

  // すべての表示済みマイルストーンをクリア
  const clearShownMilestones = useCallback(async () => {
    try {
      // まずローカルストレージからクリア
      try {
        localStorage.removeItem(MILESTONE_STORAGE_KEY);
        // デバッグ用に他の関連キーもクリア
        localStorage.removeItem('last_checked_study_hours');
      } catch (localStorageError) {
        // ローカルストレージのクリアに失敗しても続行
      }
      
      // 内部状態をクリア
      setShownMilestones([]);
      
      // 非Authenticatedユーザーの場合はローカルストレージのクリアのみ
      if (!currentUser || demoMode) {
        return true;
      }
      
      try {
        // Firestoreのデータもクリアする試行
        const achievementsRef = doc(db, `users/${currentUser.uid}/pokemonAchievements/shown`);
        await setDoc(achievementsRef, {
          list: [],
          updatedAt: serverTimestamp()
        });
        return true;
      } catch (firestoreError) {
        // ローカルストレージは既にクリア済みなので成功とみなす
        return true;
      }
    } catch (error) {
      return false;
    }
  }, [currentUser, demoMode]);

  // 実績登録後のマイルストーンチェック関数
  const checkMilestoneAfterAchievement = useCallback(async (achievement) => {
    try {
      if (!checkNewPokemonAchievement) {
        console.log('❗ ポケモンチェック関数が使用できません');
        return;
      }
      
      // すでに表示済みのマイルストーンを取得（Firestoreから最新の状態を取得）
      const currentShownMilestones = await fetchShownMilestones();

      // 全期間の実績データを取得して学習時間を計算
      const manualCalculatedHours = await calculateDirectStudyHours();
      
      // 最適な学習時間を選択（全期間計算を優先）
      // 実績登録直後は、全期間計算結果を必ず優先する
      const effectiveHours = manualCalculatedHours > 0 ? manualCalculatedHours : (allTimeData?.totalHours || totalStudyHours);
      
      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = POKEMON_DATA.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        
        // 新しいマイルストーンかどうかをチェック
        const isNewMilestone = !currentShownMilestones.includes(highestPokemon.id);
        
        // 条件を達成していてまだ表示されていないなら表示
        if (isNewMilestone) {
          try {
            // Reactコンポーネントによる表示のためにモーダル状態を設定
            setMilestone(highestPokemon);
            
            // 表示済みマイルストーンを保存
            const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
            await saveShownMilestones(updatedShownMilestones);
          } catch (showError) {
            console.error('マイルストーン表示エラー:', showError);
            // エラーが発生してもユーザー体験を妨げないように例外を閉じ込む
          }
        } else {
          // 既に獲得済みの場合はログのみ出力
          console.log('ℹ️ マイルストーンは既に獲得済みです:', highestPokemon.name);
        }
      }
    } catch (error) {
      // エラー処理
      console.error('ポケモン獲得チェックエラー:', error);
      // エラーが発生しても例外を上位に伝えない
    }
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, fetchShownMilestones, saveShownMilestones, calculateDirectStudyHours]); // pokemonDataをPOKEMON_DATAに変更したため依存配列から削除

  // 実績登録コールバックの登録
  useEffect(() => {
    // すでに登録されている場合は重複登録しない
    if (callbackRegisteredRef.current) {
      return;
    }
    
    // 必要な依存関係が揃っているか確認
    if (!registerAchievementCallback || !checkMilestoneAfterAchievement) {
      return;
    }
    
    // グローバル変数として登録状態を保存（コンポーネントの再マウントでも維持される）
    try {
      // コールバックの登録を試行
      const unregisterFn = registerAchievementCallback(checkMilestoneAfterAchievement);
      
      // 登録フラグを設定
      callbackRegisteredRef.current = true;
      
      // クリーンアップ関数
      return () => {
        // 登録解除
        unregisterFn();
        // 登録フラグをリセット
        callbackRegisteredRef.current = false;
      };
    } catch (error) {
      return () => {};
    }
  // このuseEffectは初回マウント時のみ実行する
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // バックアップ: 学習時間の変更を監視してマイルストーンをチェック
  useEffect(() => {
    // コールバックが機能していれば、この監視は不要
    if (callbackRegisteredRef.current) {
      return;
    }
    
    // 必要な依存関係のチェック
    if (!checkNewPokemonAchievement) {
      return;
    }
    
    const checkMilestones = async () => {
      try {
        // すでに表示済みのマイルストーンを取得
        const currentShownMilestones = await fetchShownMilestones();
        
        // 全期間の実績から学習時間を計算
        const manualCalculatedHours = await calculateDirectStudyHours();
        
        // 他のソースからの学習時間と比較し、最適な値を選択
        const effectiveHours = manualCalculatedHours > 0 ? manualCalculatedHours : (allTimeData?.totalHours || totalStudyHours);
        
        // 条件を満たすポケモンを取得（最高レベルのものを優先）
        const eligiblePokemons = POKEMON_DATA.filter(
          pokemon => effectiveHours >= pokemon.condition.value
        ).sort((a, b) => b.condition.value - a.condition.value);
        
        if (eligiblePokemons.length > 0) {
          const highestPokemon = eligiblePokemons[0];
          
          // 新しいマイルストーンかどうかをチェック
          const isNewMilestone = !currentShownMilestones.includes(highestPokemon.id);
          
          if (isNewMilestone) {
            setMilestone(highestPokemon);
    
            // 表示済みマイルストーンを保存
            const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
            await saveShownMilestones(updatedShownMilestones);
            
            // Reactコンポーネントによる表示のための状態は既に設定済み
          }
        }
      } catch (error) {
        // エラー処理
      }
    };
    
    checkMilestones();
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, fetchShownMilestones, saveShownMilestones, calculateDirectStudyHours]); // pokemonDataをPOKEMON_DATAに変更したため依存配列から削除

  const closeMilestoneModal = () => {
    setMilestone(null);
  };

  // 代替表示機能: Reactコンポーネントを優先的に使用するように修正、ただし緊急時のバックアップとして直接表示も可能
  const showMilestoneDirectly = useCallback((milestoneData = null) => {
    // milestoneが指定されていない場合は、現在のmilestone状態を使用
    const dataToShow = milestoneData || milestone;
    if (dataToShow) {
      // React状態を更新してコンポーネントで表示
      setMilestone(dataToShow);
      console.log('showMilestoneDirectly: Reactコンポーネントで表示します');
      return true;
    } else {
      return false;
    }
  }, [milestone]);

  return { 
    milestone, 
    closeMilestoneModal,
    // 開発環境でのみ使用可能なデバッグ関数
    ...(process.env.NODE_ENV !== 'production' ? {
      checkMilestoneManually: checkManually, // 手動チェック関数を返す
      clearShownMilestones, // 表示済みマイルストーンクリア関数
    } : {}),
    showMilestoneDirectly, // 直接モーダルを表示する関数
    pokemonData // 共通のポケモンデータを返す
  };
}