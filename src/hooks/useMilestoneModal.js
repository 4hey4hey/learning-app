import { useState, useEffect, useCallback, useRef } from 'react';
import { showMilestoneModal } from '../utils/modal/showMilestoneModal';
import { useStudyState } from '../contexts/StudyStateContext';
import { usePokemonCollection } from '../components/Collection/hooks/usePokemonCollection';
import { useAchievement } from '../contexts/AchievementContext';
import { useFirestore } from '../hooks/useFirestore';

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
  const [milestone, setMilestone] = useState(null);
  const [pokemonData, setPokemonData] = useState(POKEMON_MILESTONE_DATA);
  
  // コールバック登録を追跡するためのref
  const callbackRegisteredRef = useRef(false);

  // ローカルストレージキー
  const MILESTONE_STORAGE_KEY = 'shown_milestones';

  // Firebaseからポケモンデータを取得
  useEffect(() => {
    const fetchPokemonData = async () => {
      try {
        // Firebaseからポケモンデータを取得しようとする
        // 取得に失敗した場合はデフォルトデータを使用
        console.log('🔍 Firebaseからポケモンデータを取得します');
        const remoteData = await getDocument('pokemons', 'data');
        
        if (remoteData && remoteData.pokemonList && remoteData.pokemonList.length > 0) {
          console.log('✅ Firebaseからポケモンデータを取得しました', remoteData.pokemonList.length);
          setPokemonData(remoteData.pokemonList);
        } else {
          console.log('ℹ️ Firebaseにデータが存在しないため、デフォルトデータを使用します');
          // デフォルトでは元のデータをそのまま使用
        }
      } catch (error) {
        console.error('❗ ポケモンデータの取得エラー:', error);
        // エラー時は元のデータをそのまま使用
      }
    };
    
    fetchPokemonData();
  }, [getDocument]);

  // 手動でマイルストーンをチェックする関数
  const checkManually = useCallback(() => {
    console.log('💻 マイルストーン手動チェック開始');
    
    try {
      // 必要な依存関係の確認
      if (!checkNewPokemonAchievement) {
        console.error('❌ ポケモンチェック関数が存在しません');
        return null;
      }
      
      // 表示済みマイルストーンを取得
      const shownMilestones = 
        JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
      
      // 学習時間の取得
      const effectiveHours = allTimeData?.totalHours || totalStudyHours;
      console.log('⛳ 現在の学習時間(手動チェック):', effectiveHours);
      
      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = pokemonData.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        console.log(`⭐ ${highestPokemon.condition.value}時間達成しているので${highestPokemon.name}を表示します`);
        
        // まだ表示されていない場合のみ表示
        if (!shownMilestones.includes(highestPokemon.id)) {
          setMilestone(highestPokemon);
          
          // 直接モーダルを表示 (React レンダリングのバックアップとして)
          setTimeout(() => {
            // 最終モーダルを使用し、ポケモンデータを渡す
            if (window.showFinalModal) {
              console.log(`🔥 ${highestPokemon.name}モーダルを表示します`);
              window.showFinalModal(highestPokemon);
            } else {
              // フォールバックとして元のメソッドを使用
              showMilestoneModal(highestPokemon);
            }
          }, 100);
          
          // 表示済みマイルストーンを保存
          const updatedShownMilestones = [...shownMilestones, highestPokemon.id];
          localStorage.setItem(
            MILESTONE_STORAGE_KEY, 
            JSON.stringify(updatedShownMilestones)
          );
          
          console.log('🌟 マイルストーン表示:', highestPokemon.name);
          return highestPokemon;
        } else {
          console.log('ℹ️ このマイルストーンはすでに表示済みですが、強制的に再表示します');
          setMilestone(highestPokemon);
          
          // 直接モーダルを表示
          setTimeout(() => {
            if (window.showFinalModal) {
              window.showFinalModal(highestPokemon);
              return highestPokemon;
            }
          }, 100);
          
          return highestPokemon;
        }
      }
      
      // 通常のポケモンチェック関数を呼び出し
      const newMilestone = checkNewPokemonAchievement(effectiveHours);
      
      if (!newMilestone) {
        console.log('❌ 条件を満たすマイルストーンが見つかりません');
        return null;
      }
      
      console.log('🌟 マイルストーン発見:', newMilestone.name);
      
      // まだ表示されていない場合のみ表示
      if (!shownMilestones.includes(newMilestone.id)) {
        console.log('🎊 新しいマイルストーンを表示します:', newMilestone.name);
        setMilestone(newMilestone);
        
        // 直接モーダルを表示 (React レンダリングのバックアップとして)
        setTimeout(() => {
          // 最終モーダルを使用し、ポケモンデータを渡す
          if (window.showFinalModal) {
            console.log(`🔥 ${newMilestone.name}モーダルを表示します`);
            window.showFinalModal(newMilestone);
          } else {
            // フォールバックとして元のメソッドを使用
            showMilestoneModal(newMilestone);
          }
        }, 100);
        
        // 表示済みマイルストーンを保存
        const updatedShownMilestones = [...shownMilestones, newMilestone.id];
        localStorage.setItem(
          MILESTONE_STORAGE_KEY, 
          JSON.stringify(updatedShownMilestones)
        );
        
        return newMilestone;
      } else {
        console.log('ℹ️ このマイルストーンはすでに表示済みです:', newMilestone.name);
        return null;
      }
    } catch (error) {
      console.error('❌ マイルストーンチェックエラー:', error);
      return null;
    }
  }, [allTimeData, totalStudyHours, checkNewPokemonAchievement, pokemonData]);

  // すべての表示済みマイルストーンをクリア（デバッグ用）
  const clearShownMilestones = useCallback(() => {
    console.log('🧹 表示済みマイルストーンをクリアします');
    localStorage.removeItem(MILESTONE_STORAGE_KEY);
    return true;
  }, []);

  // 実績登録後のマイルストーンチェック関数
  const checkMilestoneAfterAchievement = useCallback((achievement) => {
    console.log('📋 実績登録後のマイルストーンチェック', achievement);
    try {
      console.log('⚠️ マイルストーンチェック関数が呼び出されました - デバッグ');
      console.log('🔍 dependencies:', { 
        totalStudyHours, 
        allTimeDataExists: !!allTimeData,
        checkNewPokemonAchievementExists: !!checkNewPokemonAchievement 
      });
      
      if (!checkNewPokemonAchievement) {
        console.error('❌ checkNewPokemonAchievement 関数が undefined です');
        return;
      }
      
      // すでに表示済みのマイルストーンを取得
      const shownMilestones = 
        JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');

      // 最新の学習時間を取得
      const effectiveHours = allTimeData?.totalHours || totalStudyHours;
      
      console.log('⏱ 現在の学習時間:', effectiveHours);
      
      // 学習時間に応じて適切なポケモンを選択
      const eligiblePokemons = pokemonData.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        // 条件を満たす最高レベルのポケモンを選択
        const highestPokemon = eligiblePokemons[0];
        
        if (!shownMilestones.includes(highestPokemon.id)) {
          console.log(`🎊 新しいマイルストーン達成 (コールバック): ${highestPokemon.name}`);
          setMilestone(highestPokemon);
  
          // 表示済みマイルストーンを保存
          const updatedShownMilestones = [...shownMilestones, highestPokemon.id];
          localStorage.setItem(
            MILESTONE_STORAGE_KEY, 
            JSON.stringify(updatedShownMilestones)
          );
          
          // モーダル表示
          setTimeout(() => {
            if (window.showFinalModal) {
              console.log(`🔥 ${highestPokemon.name}モーダルを表示します (コールバック)`);
              window.showFinalModal(highestPokemon);
            } else {
              showMilestoneModal(highestPokemon);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('⚠️ マイルストーンチェックエラー:', error);
    }
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, pokemonData]);

  // 実績登録コールバックの登録
  useEffect(() => {
    // すでに登録されている場合は重複登録しない
    if (callbackRegisteredRef.current) {
      console.log('ℹ️ コールバックはすでに登録済みです - スキップします');
      return;
    }
    
    console.log('📡 コールバック登録準備中...');
    
    // 必要な依存関係が揃っているか確認
    if (!registerAchievementCallback || !checkMilestoneAfterAchievement) {
      console.error('❌ 必要な依存関係がありません。コールバック登録をスキップします:', {
        registerCallbackExists: !!registerAchievementCallback,
        checkFunctionExists: !!checkMilestoneAfterAchievement
      });
      return;
    }
    
    console.log('📥 コールバック登録を実行します');
    
    // グローバル変数として登録状態を保存（コンポーネントの再マウントでも維持される）
    try {
      // コールバックの登録を試行
      const unregisterFn = registerAchievementCallback(checkMilestoneAfterAchievement);
      
      // 登録フラグを設定
      callbackRegisteredRef.current = true;
      console.log('✅ コールバック登録完了');
      
      // クリーンアップ関数
      return () => {
        console.log('🧹 コールバック登録解除処理を開始...');
        // 登録解除
        unregisterFn();
        // 登録フラグをリセット
        callbackRegisteredRef.current = false;
        console.log('✅ コールバック登録解除完了');
      };
    } catch (error) {
      console.error('❌ コールバック登録エラー:', error);
      return () => {};
    }
  // このuseEffectは初回マウント時のみ実行する
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // バックアップ: 学習時間の変更を監視してマイルストーンをチェック
  // このバックアップは問題の原因にならないように条件付きで実行する
  useEffect(() => {
    // コールバックが機能していれば、この監視は不要
    if (callbackRegisteredRef.current) {
      console.log('ℹ️ コールバック登録済みのため、自動チェックはスキップします');
      return;
    }
    
    console.log('🔄 学習時間監視による自動チェック発動');
    
    // 必要な依存関係のチェック
    if (!checkNewPokemonAchievement) {
      console.error('❌ checkNewPokemonAchievement 関数がありません');
      return;
    }
    
    try {
      // すでに表示済みのマイルストーンを取得
      const shownMilestones = 
        JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY) || '[]');
  
      const effectiveHours = allTimeData?.totalHours || totalStudyHours;
      console.log('📊 現在の学習時間 (自動チェック):', effectiveHours);
      
      // 条件を満たすポケモンを取得（最高レベルのものを優先）
      const eligiblePokemons = pokemonData.filter(
        pokemon => effectiveHours >= pokemon.condition.value
      ).sort((a, b) => b.condition.value - a.condition.value);
      
      if (eligiblePokemons.length > 0) {
        const highestPokemon = eligiblePokemons[0];
        
        if (!shownMilestones.includes(highestPokemon.id)) {
          console.log(`🎊 新しいマイルストーン達成 (自動チェック): ${highestPokemon.name}`);
          setMilestone(highestPokemon);
  
          // 表示済みマイルストーンを保存
          const updatedShownMilestones = [...shownMilestones, highestPokemon.id];
          localStorage.setItem(
            MILESTONE_STORAGE_KEY, 
            JSON.stringify(updatedShownMilestones)
          );
          
          // モーダル表示
          setTimeout(() => {
            if (window.showFinalModal) {
              console.log(`🔥 ${highestPokemon.name}モーダルを自動表示します`);
              window.showFinalModal(highestPokemon);
            } else {
              showMilestoneModal(highestPokemon);
            }
          }, 100);
        } else {
          console.log(`ℹ️ ${highestPokemon.name}はすでに表示済みです (自動チェック)`);
        }
      } else {
        console.log('⭕ 条件を満たす新しいマイルストーンはありません (自動チェック)');
      }
    } catch (error) {
      console.error('❌ 自動チェックエラー:', error);
    }
  }, [totalStudyHours, allTimeData, checkNewPokemonAchievement, pokemonData]);

  const closeMilestoneModal = () => {
    setMilestone(null);
  };

  // 代替表示機能: React コンポーネントでの表示に問題があった場合の回避策
  const showMilestoneDirectly = useCallback((milestoneData = null) => {
    // milestoneが指定されていない場合は、現在のmilestone状態を使用
    const dataToShow = milestoneData || milestone;
    if (dataToShow) {
      console.log('💫 直接DOMにモーダルを表示します:', dataToShow.name);
      if (window.showFinalModal) {
        window.showFinalModal(dataToShow);
      } else {
        showMilestoneModal(dataToShow);
      }
      return true;
    } else {
      console.log('❌ 表示できるマイルストーンがありません');
      return false;
    }
  }, [milestone]);

  return { 
    milestone, 
    closeMilestoneModal,
    checkMilestoneManually: checkManually, // 手動チェック関数を返す
    clearShownMilestones, // デバッグ用の表示済みマイルストーンクリア関数
    showMilestoneDirectly, // 直接モーダルを表示する関数
    pokemonData // 現在のポケモンデータを返す
  };
}