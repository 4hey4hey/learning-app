import React, { createContext, useState, useContext, useEffect } from 'react';
import { useStudyState } from './StudyStateContext';

// 循環参照を防ぐために、直接インポートではなく別の方法でusePokemonCollectionを取得

// コンテキスト作成
const PokemonAchievementContext = createContext();

// カスタムフック
export const usePokemonAchievement = () => {
  const context = useContext(PokemonAchievementContext);
  if (!context) {
    throw new Error('usePokemonAchievement must be used within a PokemonAchievementProvider');
  }
  return context;
};

// プロバイダーコンポーネント
export const PokemonAchievementProvider = ({ children }) => {
  const { totalStudyHours } = useStudyState();
  
  // usePokemonCollectionの代わりに直接実装
  const pokemonCollection = [];
  
  // ポケモン獲得チェック関数の仮実装
  const checkNewPokemonAchievement = () => null;
  
  const [newPokemon, setNewPokemon] = useState(null);
  
  // ポケモン獲得モーダルを表示する関数
  const showPokemonAchievementModal = (pokemon) => {
    setNewPokemon(pokemon);
  };
  
  // モーダルを閉じる関数
  const closePokemonAchievementModal = () => {
    setNewPokemon(null);
  };
  
  // 新しい実績入力後にポケモン獲得チェックを行う
  const checkNewAchievementForPokemon = () => {
    if (!totalStudyHours) return null;
    
    const newlyAchievedPokemon = checkNewPokemonAchievement(totalStudyHours);
    if (newlyAchievedPokemon) {
      showPokemonAchievementModal(newlyAchievedPokemon);
      return newlyAchievedPokemon;
    }
    
    return null;
  };

  // 実績登録完了時のイベントリスナー
  useEffect(() => {
    const handleAchievementDataChanged = async (event) => {
      console.log('ポケモン：実績データ変更イベント検出', event?.detail);
      
      // 追加された実績の情報
      const achievementData = event?.detail?.achievement;
      const changeType = event?.detail?.type;
      
      // 実績が保存された場合のみポケモン獲得チェックを行う
      if (changeType === 'save') {
        console.log('ポケモン獲得チェックを開始');
        // 少し遅延させてStudyStateContextの更新が完了するのを待つ
        setTimeout(() => {
          const newlyAchievedPokemon = checkNewAchievementForPokemon();
          if (newlyAchievedPokemon) {
            console.log('新しいポケモンを獲得しました:', newlyAchievedPokemon);
          }
        }, 500);
      }
    };
    
    // イベントリスナーを追加
    window.addEventListener('achievementDataChanged', handleAchievementDataChanged);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('achievementDataChanged', handleAchievementDataChanged);
    };
  }, [totalStudyHours]);
  
  return (
    <PokemonAchievementContext.Provider
      value={{
        pokemonCollection,
        newPokemon,
        showPokemonAchievementModal,
        closePokemonAchievementModal,
        checkNewAchievementForPokemon
      }}
    >
      {children}
    </PokemonAchievementContext.Provider>
  );
};