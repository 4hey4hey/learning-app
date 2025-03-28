import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useFirestore } from '../../../hooks/useFirestore';
import { useStudyState } from '../../../contexts/StudyStateContext';

// ポケモンバッジデータ
const POKEMON_DATA = [
  {
    id: "hitokage",
    name: "ヒトカゲ",
    imageUrl: "/pokemonimage/hitokake゙01.gif", 
    description: "15時間の学習達成！炎のように熱い学習意欲を持ったヒトカゲをゲット！",
    condition: {
      type: "totalHours",
      value: 15
    },
    element: "fire",
    message: "学習の炎が燃え上がった！",
  },
  {
    id: "zenigame",
    name: "ゼニガメ",
    imageUrl: "/pokemonimage/se゙nika゙me01.gif",
    description: "30時間の学習達成！冷静沈着な思考力を持つゼニガメをゲット！",
    condition: {
      type: "totalHours",
      value: 30
    },
    element: "water",
    message: "知識の水流が巡り始めた！",
  },
  {
    id: "fushigidane",
    name: "フシギダネ",
    imageUrl: "/pokemonimage/fushiki゙ta゙ne01.gif",
    description: "50時間の学習達成！知識の種を育てるフシギダネをゲット！",
    condition: {
      type: "totalHours",
      value: 50
    },
    element: "grass",
    message: "学びの種が芽生えた！",
  },
  {
    id: "pikachu",
    name: "ピカチュウ",
    imageUrl: "/pokemonimage/hi゚kachuu_oiwai.gif",
    description: "100時間の学習達成！閃きの電気を操るピカチュウをゲット！",
    condition: {
      type: "totalHours",
      value: 100
    },
    element: "electric",
    message: "ひらめきの電撃が走った！",
  },
  {
    id: "nyoromo",
    name: "ニョロモ",
    imageUrl: "/pokemonimage/nyoromo.gif",
    description: "150時間の学習達成！じっくりと学びを深めるニョロモをゲット！",
    condition: {
      type: "totalHours",
      value: 150
    },
    element: "water",
    message: "学びの深さを知った！",
  },
  {
    id: "kodakku",
    name: "コダック",
    imageUrl: "/pokemonimage/kota゙kku01.gif",
    description: "200時間の学習達成！頭を抱えながらも問題を解決するコダックをゲット！",
    condition: {
      type: "totalHours",
      value: 200
    },
    element: "water",
    message: "頭の中が整理された！",
  },
  {
    id: "poppo",
    name: "ポッポ",
    imageUrl: "/pokemonimage/hi゚hhi゚01.gif",
    description: "250時間の学習達成！どこへでも知識を運ぶポッポをゲット！",
    condition: {
      type: "totalHours",
      value: 250
    },
    element: "flying",
    message: "視野が広がった！",
  },
  {
    id: "koiking",
    name: "コイキング",
    imageUrl: "/pokemonimage/koikinku゙01.gif",
    description: "300時間の学習達成！努力の先に大きな成長があるコイキングをゲット！",
    condition: {
      type: "totalHours",
      value: 300
    },
    element: "water",
    message: "継続は力なり！",
  }
];

export const usePokemonCollection = () => {
  const { currentUser } = useAuth();
  const { getDocument, setDocument } = useFirestore();
  const { totalStudyHours, allTimeData } = useStudyState();
  
  const [pokemonCollection, setPokemonCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 学習時間の取得と処理
  const [localTotalHours, setLocalTotalHours] = useState(totalStudyHours || 0);
  
  // StudyStateContextからの学習時間が更新された場合に反映
  useEffect(() => {
    if (totalStudyHours !== localTotalHours) {
      setLocalTotalHours(totalStudyHours);
    }
  }, [totalStudyHours, localTotalHours]);
  
  // 実際の学習時間を使用 - allTimeDataから取得した値を優先的に使用
  const effectiveStudyHours = allTimeData?.totalHours > 0 ? allTimeData.totalHours : localTotalHours;
  
  // ポケモンデータにcollected状態を追加
  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        // ユーザーの獲得済みポケモンIDリストを取得
        let collectedPokemonIds = [];
        
        if (currentUser) {
          // 認証済みユーザーの場合はFirestoreから取得
          const userData = await getDocument('pokemons', 'collection');
          collectedPokemonIds = userData?.collectedPokemons || [];
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
          console.log('新しいポケモンを保存します');
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
  }, [currentUser, getDocument, totalStudyHours, effectiveStudyHours, allTimeData?.totalHours]);
  
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
  const checkNewPokemonAchievement = (hours) => {
    console.log('🔍 checkNewPokemonAchievement 呼び出し - 学習時間:', hours);
    
    // 原因調査のためのデバッグログ
    console.log('📑 POKEMON_DATA 元データ:', POKEMON_DATA.map(p => ({ 
      name: p.name, 
      requiredHours: p.condition.value
    })));
    
    // すべてのポケモンの中で条件を満たすものを手動で探す
    // 過去のポケモン収集状態に関係なく検索
    const eligiblePokemons = POKEMON_DATA.filter(pokemon => 
      pokemon.condition.type === 'totalHours' && 
      pokemon.condition.value <= hours
    ).sort((a, b) => a.condition.value - b.condition.value);
    
    console.log('❗ 条件を満たすポケモン(生データから直接検索):', 
      eligiblePokemons.map(p => ({ 
        name: p.name, 
        requiredHours: p.condition.value 
      }))
    );
    
    if (eligiblePokemons.length > 0) {
      // 原因調査用に最初のポケモンを取得
      const firstEligible = eligiblePokemons[0];
      console.log('✅ 条件を満たすポケモン発見(直接検索):', firstEligible.name);
      
      // デバッグ用にポケモンの収集状態を確認
      const pokemonInCollection = pokemonCollection.find(p => p.id === firstEligible.id);
      console.log('⏰ 収集状態確認:', { 
        名前: firstEligible.name, 
        ID: firstEligible.id,
        コレクションに存在: !!pokemonInCollection,
        収集済み: pokemonInCollection ? pokemonInCollection.collected : false
      });
    }
    
    // ------------- 以下、元のロジック -------------
    
    // まだ獲得していないポケモンを取得
    const unachievedPokemons = pokemonCollection.filter(pokemon => !pokemon.collected);
    console.log('🔍 獲得していないポケモン数:', unachievedPokemons.length);
    
    // 時間条件でソート（少ない順）
    const sortedPokemons = unachievedPokemons.sort(
      (a, b) => a.condition.value - b.condition.value
    );
    
    console.log('🔍 ソート済み未獲得ポケモン:', 
      sortedPokemons.map(p => ({ 
        name: p.name, 
        requiredHours: p.condition.value,
        currentHours: hours,
        meetsCondition: p.condition.value <= hours
      }))
    );
    
    // 条件を満たす最初のポケモンを見つける
    const achievedPokemon = sortedPokemons.find(
      pokemon => pokemon.condition.type === 'totalHours' && 
                 pokemon.condition.value <= hours
    );
    
    // 補正推奨: 上記の直接検索でポケモンが見つかっていて、ここで見つからない場合は、
    // pokemonCollectionが正しく更新されていない可能性がある
    if (eligiblePokemons.length > 0 && !achievedPokemon) {
      console.log('⚠️ 直接検索ではポケモンが見つかったが、コレクションに存在しないか収集済みと認識されています');
      
      // 直接探索からポケモンを取得し、オーバーライドする
      return eligiblePokemons[0];
    }
    
    if (achievedPokemon) {
      console.log('✅ 新しいポケモン獲得条件達成!', {
        name: achievedPokemon.name,
        requiredHours: achievedPokemon.condition.value,
        currentHours: hours
      });
    } else {
      console.log('❌ 獲得できるポケモンはありません - 現在の学習時間:', hours);
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