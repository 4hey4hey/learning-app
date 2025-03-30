import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useFirestore } from '../../../hooks/useFirestore';
import { useStudyState } from '../../../contexts/StudyStateContext';
// 循環参照を防ぐためにuseAchievementを一時的にコメントアウト
// import { useAchievement } from '../../../contexts/AchievementContext';
import { POKEMON_DATA } from '../../../constants/pokemonData';



export const usePokemonCollection = () => {
  const { currentUser, demoMode } = useAuth();
  const { getAllDocuments, setDocument } = useFirestore();
  const { totalStudyHours, allTimeData } = useStudyState();
  // const { achievements: contextAchievements } = useAchievement();
  // 循環参照回避のための仮の実装
  const contextAchievements = {};
  
  const [pokemonCollection, setPokemonCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 学習時間の取得と処理
  const [effectiveStudyHours, setEffectiveStudyHours] = useState(0);
  
  // 学習時間の値をデバッグ出力
  useEffect(() => {
    console.log('PokemonCollection - totalStudyHours:', totalStudyHours);
    console.log('PokemonCollection - allTimeData:', allTimeData);
  }, [totalStudyHours, allTimeData]);
  
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
      
      // 実績数のデバッグログを削除
      return flattenedAchievements;
    } catch (error) {
      console.error('Firestore実績データの処理エラー:', error);
      return {};
    }
  }, []);

  // 実績から直接学習時間を計算する関数
  const calculateStudyHoursFromAchievements = useCallback((achievements) => {
    try {
      let calculatedHours = 0;
      let completedCount = 0;
      let partialCount = 0;
      let failedCount = 0;
      
      // 実績オブジェクトの値を処理
      Object.values(achievements).forEach(achievement => {
        if (achievement && achievement.status === 'completed') {
          calculatedHours += 1;
          completedCount++;
        } else if (achievement && achievement.status === 'partial') {
          calculatedHours += 0.7;
          partialCount++;
        } else if (achievement && achievement.status === 'failed') {
          failedCount++;
        }
      });
      
      // 小数点以下はそのまま維持
      return calculatedHours;
    } catch (error) {
      console.error('学習時間計算エラー:', error);
      return 0;
    }
  }, []);
  
  // 全期間の学習時間を計算する関数
  const calculateDirectStudyHours = useCallback(async () => {
    try {
      // 全期間の学習時間計算開始ログを削除
      
      // allTimeDataがあればそれを優先して使用
      if (allTimeData && allTimeData.totalHours) {
        return allTimeData.totalHours;
      }
      
      // 非認証ユーザーまたはデモモードの場合は既存の値を使用
      if (!currentUser || demoMode) {
        const value = totalStudyHours || 0;
        // 非認証/デモモードの値ログを削除
        return value;
      }
      
      try {
        // Firestoreから全期間のデータを取得
        // Firestoreからの実績データ取得ログを削除
        const firestoreAchievements = await getAllDocuments('achievements');
        
        if (!firestoreAchievements || Object.keys(firestoreAchievements).length === 0) {
          // Firestoreから実績データが取得できなかった場合のログを削除
          return allTimeData?.totalHours || totalStudyHours || 0;
        }
        
        // 実績データを平坦化
        const flattenedAchievements = processFirestoreAchievements(firestoreAchievements);
        // 平坦化後の実績数ログを削除
        
        // 実績から学習時間を計算
        const hours = calculateStudyHoursFromAchievements(flattenedAchievements);
        // 全期間の学習時間計算結果ログを削除
        
        return hours;
      } catch (firestoreError) {
        console.error('Firestoreデータ取得エラー:', firestoreError);
        return allTimeData?.totalHours || totalStudyHours || 0;
      }
    } catch (error) {
      console.error('学習時間計算エラー:', error);
      return allTimeData?.totalHours || totalStudyHours || 0;
    }
  }, [
    currentUser, 
    demoMode, 
    allTimeData, 
    totalStudyHours, 
    getAllDocuments, 
    processFirestoreAchievements, 
    calculateStudyHoursFromAchievements
  ]);
  
  // 学習時間の更新
  useEffect(() => {
    const updateStudyHours = async () => {
      try {
        // もしallTimeDataが利用可能なら直接使用
        if (allTimeData && allTimeData.totalHours) {
          setEffectiveStudyHours(allTimeData.totalHours);
          return;
        }
        
        // 全期間の学習時間を計算
        const calculatedHours = await calculateDirectStudyHours();
        // 計算された学習時間ログを削除
        
        // 結果を設定
        setEffectiveStudyHours(calculatedHours);
      } catch (error) {
        console.error('学習時間更新エラー:', error);
        // エラー時は既存の値を使用
        setEffectiveStudyHours(allTimeData?.totalHours || totalStudyHours || 0);
      }
    };
    
    updateStudyHours();
  }, [
    allTimeData, 
    totalStudyHours, 
    contextAchievements, 
    calculateDirectStudyHours
  ]);
  
  // ポケモンデータにcollected状態を追加
  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        // ユーザーの獲得済みポケモンIDリストを取得
        let collectedPokemonIds = [];
        
        if (currentUser) {
          // Firestoreから取得したデータがあれば使用
          const pokemonsData = await getAllDocuments('pokemons');
          // 'collection'ドキュメントがあればそこから取得
          const collectionDoc = pokemonsData['collection'];
          collectedPokemonIds = collectionDoc?.collectedPokemons || [];
        }
        
        // ポケモンデータに獲得状態を追加
        const pokemonsWithStatus = POKEMON_DATA.map(pokemon => ({
          ...pokemon,
          // ポケモン獲得条件：
          // 1. すでに獲得済みリストに含まれている場合
          // 2. 学習時間が条件を満たしている場合
          collected: collectedPokemonIds.includes(pokemon.id) || 
                    (pokemon.condition.type === 'totalHours' && 
                     effectiveStudyHours >= pokemon.condition.value)
        }));
        
        // 獲得状態が変わった場合、データベースに保存
        const newCollectedIds = pokemonsWithStatus
          .filter(pokemon => pokemon.collected)
          .map(pokemon => pokemon.id);
          
        if (JSON.stringify(newCollectedIds) !== JSON.stringify(collectedPokemonIds) && currentUser) {
          // 新しいポケモン保存ログを削除
          saveCollectionToDatabase(pokemonsWithStatus);
        }
        
        setPokemonCollection(pokemonsWithStatus);
      } catch (err) {
        console.error('ポケモンコレクション取得エラー:', err);
        setError('ポケモンデータの読み込みに失敗しました');
        
        // エラー時は学習時間に基づいてローカルデータを表示
        const localPokemons = POKEMON_DATA.map(pokemon => ({
          ...pokemon,
          collected: pokemon.condition.type === 'totalHours' && 
                     effectiveStudyHours >= pokemon.condition.value
        }));
        setPokemonCollection(localPokemons);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [currentUser, getAllDocuments, effectiveStudyHours]);
  
  // 獲得状態をデータベースに保存
  const saveCollectionToDatabase = async (pokemons) => {
    const collectedIds = pokemons
      .filter(pokemon => pokemon.collected)
      .map(pokemon => pokemon.id);
    
    try {
      if (currentUser) {
        // 認証済みユーザーの場合はFirestoreに保存
        await setDocument('pokemons', 'collection', {
          collectedPokemons: collectedIds,
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('コレクション保存エラー:', err);
    }
  };
  
  // 新しいポケモン獲得判定（実績入力後に使用）
  const checkNewPokemonAchievement = async (hours = null) => {
    // ポケモン収集判定関数呼び出しログを削除
    
    // 時間が指定されていない場合は再計算
    let effectiveHours = hours;
    if (effectiveHours === null) {
      try {
        // 全期間の学習時間を計算
        effectiveHours = await calculateDirectStudyHours();
        // 再計算した学習時間ログを削除
      } catch (error) {
        console.error('学習時間計算エラー:', error);
        effectiveHours = effectiveStudyHours; // フォールバック
      }
    }
    
    // マイルストーンチェック時間ログを削除
    
    // 条件を満たすポケモンを探す
    const eligiblePokemons = POKEMON_DATA.filter(pokemon => 
      pokemon.condition.type === 'totalHours' && 
      pokemon.condition.value <= effectiveHours
    ).sort((a, b) => a.condition.value - b.condition.value);
    
    // 条件を満たすポケモン一覧ログを削除
    
    // 未獲得のポケモンを取得
    const unachievedPokemons = pokemonCollection.filter(pokemon => !pokemon.collected);
    // 未獲得ポケモン数ログを削除
    
    // 時間条件でソート（少ない順）
    const sortedPokemons = unachievedPokemons.sort(
      (a, b) => a.condition.value - b.condition.value
    );
    
    // ソート済み未獲得ポケモンリストログを削除
    
    // 条件を満たす最初のポケモンを見つける
    const achievedPokemon = sortedPokemons.find(
      pokemon => pokemon.condition.type === 'totalHours' && 
                 pokemon.condition.value <= effectiveHours
    );
    
    // sortedPokemonsとpokemonCollectionの不一致を検出
    if (eligiblePokemons.length > 0 && !achievedPokemon) {
      // 直接検索とコレクションの不一致ログを削除
      
      // 直接探索からポケモンを取得し、オーバーライドする
      return eligiblePokemons[0];
    }
    
    if (achievedPokemon) {
      // 新しいポケモン獲得条件達成ログを削除
    } else {
      // 獲得できるポケモンがない場合のログを削除
    }
    
    return achievedPokemon;
  };
  
  // 次に獲得できるポケモンを取得
  const getNextPokemon = () => {
    const unachievedPokemons = pokemonCollection.filter(pokemon => !pokemon.collected);
    if (unachievedPokemons.length === 0) return null;
    
    return unachievedPokemons.sort(
      (a, b) => a.condition.value - b.condition.value
    )[0];
  };
  
  return {
    pokemonCollection,
    loading,
    error,
    checkNewPokemonAchievement,
    getNextPokemon,
    effectiveStudyHours
  };
};