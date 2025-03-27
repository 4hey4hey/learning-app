import React, { createContext, useState, useContext, useEffect } from 'react';
import { useStudyState } from './StudyStateContext';

// コンテキスト作成
const PokemonContext = createContext();

// カスタムフック
export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemon must be used within a PokemonProvider');
  }
  return context;
};

// プロバイダーコンポーネント
export const PokemonProvider = ({ children }) => {
  const { totalStudyHours } = useStudyState();
  const [newPokemon, setNewPokemon] = useState(null);
  
  // ポケモン獲得モーダルを表示する関数
  const showPokemonAchievementModal = (pokemon) => {
    setNewPokemon(pokemon);
  };
  
  // モーダルを閉じる関数
  const closePokemonAchievementModal = () => {
    setNewPokemon(null);
  };
  
  // 学習時間の変化を監視してポケモン獲得判定を行う
  // 注: 実際の実装では実績入力完了時に呼び出されるように調整が必要
  
  return (
    <PokemonContext.Provider
      value={{
        newPokemon,
        showPokemonAchievementModal,
        closePokemonAchievementModal
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
};
