import { useState, useEffect, useCallback, useRef } from 'react';
import { showMilestoneModal } from '../utils/modal/showMilestoneModal';
import { useStudyState } from '../contexts/StudyStateContext';
import { usePokemonCollection } from '../components/Collection/hooks/usePokemonCollection';
import { useAchievement } from '../contexts/AchievementContext';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// ポケモンマイルストーンデータ
const POKEMON_MILESTONE_DATA = [
  {
    id: "hitokage",
    name: "ヒトカゲ",
    description: "15時間の学習達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！",
    condition: { value: 15 },
    element: "fire",
    message: "学習の炎が燃え上がった！",
    imageUrl: "/pokemonimage/ヒトカゲ01.gif"
  },
  {
    id: "zenigame",
    name: "ゼニガメ",
    description: "30時間の学習達成！冷静沈着な思考力を持つゼニガメをゲット！",
    condition: { value: 30 },
    element: "water",
    message: "知識の水流が巡り始めた！",
    imageUrl: "/pokemonimage/ゼニガメ01.gif"
  },
  {
    id: "fushigidane",
    name: "フシギダネ",
    description: "50時間の学習達成！知識の種を育てるフシギダネをゲット！",
    condition: { value: 50 },
    element: "grass",
    message: "学びの種が芽生えた！",
    imageUrl: "/pokemonimage/フシギダネ01.gif"
  },
  {
    id: "pikachu",
    name: "ピカチュウ",
    description: "100時間の学習達成！閃きの電気を操るピカチュウをゲット！",
    condition: { value: 100 },
    element: "electric",
    message: "ひらめきの電撃が走った！",
    imageUrl: "/pokemonimage/ピカチュウ_お祝い.gif"
  },
  {
    id: "nyoromo",
    name: "ニョロモ",
    description: "150時間の学習達成！じっくりと学びを深めるニョロモをゲット！",
    condition: { value: 150 },
    element: "water",
    message: "学びの深さを知った！",
    imageUrl: "/pokemonimage/ニョロモ.gif"
  },
  {
    id: "kodakku",
    name: "コダック",
    description: "200時間の学習達成！頭を抱えながらも問題を解決するコダックをゲット！",
    condition: { value: 200 },
    element: "water",
    message: "頭の中が整理された！",
    imageUrl: "/pokemonimage/コダック01.gif"
  },
  {
    id: "poppo",
    name: "ポッポ",
    description: "250時間の学習達成！どこへでも知識を運ぶポッポをゲット！",
    condition: { value: 250 },
    element: "flying",
    message: "視野が広がった！",
    imageUrl: "/pokemonimage/ポッポ.gif"
  },
  {
    id: "koiking",
    name: "コイキング",
    description: "300時間の学習達成！努力の先に大きな成長があるコイキングをゲット！",
    condition: { value: 300 },
    element: "water",
    message: "継続は力なり！",
    imageUrl: "/pokemonimage/コイキング01.gif"
  }
];

export function useMilestoneModal() {
  const { totalStudyHours, allTimeData } = useStudyState();
  const { checkNewPokemonAchievement, pokemonCollection } = usePokemonCollection();
  const { registerAchievementCallback } = useAchievement();
  const { getDocument } = useFirestore();
  const { currentUser, demoMode } = useAuth();
  const [milestone, setMilestone] = useState(null);
  const [pokemonData, setPokemonData] = useState(POKEMON_MILESTONE_DATA);
  const [shownMilestones, setShownMilestones] = useState([]);
  
  // コールバック登録を追跡するためのref
  const callbackRegisteredRef = useRef(false);

  // ローカルストレージキー（フォールバック用）
  const MILESTONE_STORAGE_KEY = 'shown_milestones';
  
  // Firebaseから表示済みポケモンのリストを取得
  const fetchShownMilestones = useCallback(async () => {
    try {
      // 非Authenticatedユーザーの場合はローカルストレージを使用
      if (!currentUser || demoMode) {
        const localMilestones = JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
        console.log('ローカルストレージから表示済みマイルストーンを取得:', localMilestones);
        setShownMilestones(localMilestones);
        return localMilestones;
      }
      
      try {
        // Firebaseからデータを取得する試行
        const achievementsRef = doc(db, `users/${currentUser.uid}/pokemonAchievements/shown`);
        const achievementsDoc = await getDoc(achievementsRef);
        
        if (achievementsDoc.exists() && achievementsDoc.data().list) {
          const shownList = achievementsDoc.data().list;
          console.log('Firestoreから表示済みマイルストーンを取得:', shownList);
          setShownMilestones(shownList);
          return shownList;
        } else {
          // 初期化の必要がある場合
          console.log('表示済みマイルストーンが存在しないため、初期化します');
          try {
            await setDoc(achievementsRef, {
              list: [],
              updatedAt: serverTimestamp()
            });
          } catch (innerError) {
            console.error('Firestore初期化エラー:', innerError);
          }
          setShownMilestones([]);
          return [];
        }
      } catch (firestoreError) {
        // Firestoreアクセス時のエラー: 権限不足など
        console.error('Firestoreアクセスエラー - ローカルストレージにフォールバック:', firestoreError);
        
        // ローカルストレージからのフォールバック
        const localMilestones = JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
        setShownMilestones(localMilestones);
        return localMilestones;
      }
    } catch (error) {
      console.error('表示済みマイルストーン取得エラー:', error);
      
      // エラー時はローカルストレージにフォールバック
      const localMilestones = JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
      setShownMilestones(localMilestones);
      return localMilestones;
    }
  }, [currentUser, demoMode]);
  
  // 表示済みポケモンリストを保存
  const saveShownMilestones = useCallback(async (updatedList) => {
    try {
      // セットに変換して重複除去後、配列に戻す
      const uniqueList = [...new Set(updatedList)];
      
      // 非Authenticatedユーザーの場合はローカルストレージを使用
      if (!currentUser || demoMode) {
        localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(uniqueList));
        console.log('ローカルストレージに表示済みマイルストーンを保存:', uniqueList);
        setShownMilestones(uniqueList);
        return true;
      }
      
      // Firebaseに保存
      const achievementsRef = doc(db, `users/${currentUser.uid}/pokemonAchievements/shown`);
      await setDoc(achievementsRef, {
        list: uniqueList,
        updatedAt: serverTimestamp()
      });
      
      console.log('Firestoreに表示済みマイルストーンを保存:', uniqueList);
      setShownMilestones(uniqueList);
      return true;
    } catch (error) {
      console.error('表示済みマイルストーン保存エラー:', error);
      
      // エラー時はローカルストレージにフォールバック
      localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(updatedList));
      setShownMilestones(updatedList);
      return false;
    }
  }, [currentUser, demoMode]);

  // 初回マウント時に表示済みマイルストーンを取得
  useEffect(() => {
    fetchShownMilestones();
  }, [fetchShownMilestones]);

  // Firebaseからポケモンデータを取得
  useEffect(() => {
    const fetchPokemonData = async () => {
      try {
        // Firebaseからポケモンデータを取得しようとする
        // 取得に失敗した場合はデフォルトデータを使用
        const remoteData = await getDocument('pokemons', 'data');
        
        if (remoteData && remoteData.pokemonList && remoteData.pokemonList.length > 0) {
          setPokemonData(remoteData.pokemonList);
        }
        // デフォルトでは元のデータをそのまま使用
      } catch (error) {
        // エラー時は元のデータをそのまま使用
      }
    };
    
    fetchPokemonData();
  }, [getDocument]);

  // 手動でマイルストーンをチェックする関数
  const checkManually = useCallback(async () => {
    try {
      // 必要な依存関係の確認
      if (!checkNewPokemonAchievement) {
        return null;
      }
      
      // 表示済みマイルストーンを取得（Firestoreから最新の状態を取得）
      const currentShownMilestones = await fetchShownMilestones();
      
      console.log('手動チェック: 表示済みマイルストーン', currentShownMilestones);
      
      // 学習時間の取得
      const effectiveHours = allTimeData?.totalHours || totalStudyHours;
      console.log('手動チェック: 現在の学習時間', effectiveHours);
      
      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = pokemonData.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        console.log('手動チェック: 最高レベルポケモン', highestPokemon.name, '条件値', highestPokemon.condition.value);
        
        // 手動チェックの場合は、表示済みかどうかだけで判断
        if (!currentShownMilestones.includes(highestPokemon.id)) {
          console.log('手動チェック: 新規マイルストーン表示します');
          setMilestone(highestPokemon);
          
          // 直接モーダルを表示 (React レンダリングのバックアップとして)
          setTimeout(() => {
            // 最終モーダルを使用し、ポケモンデータを渡す
            if (window.showFinalModal) {
              window.showFinalModal(highestPokemon);
            } else {
              // フォールバックとして元のメソッドを使用
              showMilestoneModal(highestPokemon);
            }
          }, 100);
          
          // 表示済みマイルストーンを保存
          const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
          await saveShownMilestones(updatedShownMilestones);
          
          return highestPokemon;
        } else {
          // 以前に表示済みの場合
          console.log('手動チェック: すでに表示済みのマイルストーン');
          setMilestone(highestPokemon);
          
          return highestPokemon;
        }
      } else {
        console.log('手動チェック: 条件を満たすポケモンがありません');
      }
      
      return null;
    } catch (error) {
      console.error('マイルストーン手動チェックエラー:', error);
      return null;
    }
  }, [allTimeData, totalStudyHours, checkNewPokemonAchievement, pokemonData, fetchShownMilestones, saveShownMilestones]);

  // すべての表示済みマイルストーンをクリア
  const clearShownMilestones = useCallback(async () => {
    try {
      // 表示済みリストをクリア
      await saveShownMilestones([]);
      
      // ローカルストレージからも念のためクリア（フォールバック用）
      localStorage.removeItem(MILESTONE_STORAGE_KEY);
      // デバッグ用に他の関連キーもクリア
      localStorage.removeItem('last_checked_study_hours');
      
      console.log('マイルストーン表示履歴をクリアしました');
      return true;
    } catch (error) {
      console.error('マイルストーンクリアエラー:', error);
      return false;
    }
  }, [saveShownMilestones]);

  // 実績登録後のマイルストーンチェック関数
  const checkMilestoneAfterAchievement = useCallback(async (achievement) => {
    try {
      console.log('=== 実績登録後マイルストーンチェック開始 ===');
      console.log('実績情報:', achievement);
      
      if (!checkNewPokemonAchievement) {
        console.log('ポケモンチェック関数が利用できません');
        return;
      }
      
      // すでに表示済みのマイルストーンを取得（Firestoreから最新の状態を取得）
      const currentShownMilestones = await fetchShownMilestones();
      console.log('現在の表示済みマイルストーン:', currentShownMilestones);

      // 最新の学習時間を取得
      const rawTimeData = allTimeData;
      const directTotalHours = totalStudyHours;
      
      console.log('学習時間データ:', rawTimeData);
      console.log('直接取得した学習時間:', directTotalHours);
      
      const effectiveHours = rawTimeData?.totalHours || directTotalHours;
      console.log('実績登録後チェック: 使用する学習時間値', effectiveHours);
      
      // デバッグ用にすべてのポケモンを表示
      console.log('存在する全ポケモン:', pokemonData.map(p => `${p.name} (${p.condition.value}時間)`).join(', '));
      
      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = pokemonData.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      console.log('条件を満たすポケモン数:', eligiblePokemons.length);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        console.log('適格ポケモン:', highestPokemon.name, '条件値:', highestPokemon.condition.value);
        
        // 新しいマイルストーンかどうかをチェック
        const isNewMilestone = !currentShownMilestones.includes(highestPokemon.id);
        console.log('新規マイルストーンか:', isNewMilestone);
        
        // 条件を達成していてまだ表示されていないなら表示
        if (isNewMilestone) {
          console.log('マイルストーン表示条件満たす: 表示します');  
          setMilestone(highestPokemon);
  
          // 表示済みマイルストーンを保存
          const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
          await saveShownMilestones(updatedShownMilestones);
          
          // モーダル表示
          setTimeout(() => {
            console.log('ポケモンモーダルを表示します:', highestPokemon.name);
            if (window.showFinalModal) {
              window.showFinalModal(highestPokemon);
            } else {
              showMilestoneModal(highestPokemon);
            }
          }, 100);
        } else {
          console.log('すでに表示済みのマイルストーンなのでスキップ');
        }
      } else {
        console.log('適格ポケモンが見つかりません');
      }
      
      console.log('=== 実績登録後マイルストーンチェック終了 ===');
    } catch (error) {
      console.error('マイルストーンチェックエラー:', error);
    }
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, pokemonData, fetchShownMilestones, saveShownMilestones]);

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
        
        console.log('useEffectバックアップチェック: 表示済みマイルストーン', currentShownMilestones);
    
        const effectiveHours = allTimeData?.totalHours || totalStudyHours;
        console.log('useEffectバックアップチェック: 学習時間', effectiveHours);
        
        // 条件を満たすポケモンを取得（最高レベルのものを優先）
        const eligiblePokemons = pokemonData.filter(
          pokemon => effectiveHours >= pokemon.condition.value
        ).sort((a, b) => b.condition.value - a.condition.value);
        
        if (eligiblePokemons.length > 0) {
          const highestPokemon = eligiblePokemons[0];
          console.log('useEffectチェック: 最高レベルポケモン', highestPokemon.name, '条件値', highestPokemon.condition.value);
          
          // 新しいマイルストーンかどうかをチェック
          const isNewMilestone = !currentShownMilestones.includes(highestPokemon.id);
          
          if (isNewMilestone) {
            console.log('useEffectチェック: 新規マイルストーンを表示します');
            setMilestone(highestPokemon);
    
            // 表示済みマイルストーンを保存
            const updatedShownMilestones = [...currentShownMilestones, highestPokemon.id];
            await saveShownMilestones(updatedShownMilestones);
            
            // モーダル表示
            setTimeout(() => {
              if (window.showFinalModal) {
                window.showFinalModal(highestPokemon);
              } else {
                showMilestoneModal(highestPokemon);
              }
            }, 100);
          } else {
            console.log('useEffectチェック: すでに表示済みです');
          }
        } else {
          console.log('useEffectチェック: 適格ポケモンがありません');
        }
      } catch (error) {
        console.error('useEffectマイルストーンチェックエラー:', error);
      }
    };
    
    checkMilestones();
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, pokemonData, fetchShownMilestones, saveShownMilestones]);

  const closeMilestoneModal = () => {
    setMilestone(null);
  };

  // 代替表示機能: React コンポーネントでの表示に問題があった場合の回避策
  const showMilestoneDirectly = useCallback((milestoneData = null) => {
    // milestoneが指定されていない場合は、現在のmilestone状態を使用
    const dataToShow = milestoneData || milestone;
    if (dataToShow) {
      if (window.showFinalModal) {
        window.showFinalModal(dataToShow);
      } else {
        showMilestoneModal(dataToShow);
      }
      return true;
    } else {
      return false;
    }
  }, [milestone]);

  return { 
    milestone, 
    closeMilestoneModal,
    checkMilestoneManually: checkManually, // 手動チェック関数を返す
    clearShownMilestones, // 表示済みマイルストーンクリア関数
    showMilestoneDirectly, // 直接モーダルを表示する関数
    pokemonData // 現在のポケモンデータを返す
  };
}