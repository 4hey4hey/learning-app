import React, { createContext, useState, useContext, useEffect } from 'react';
import { useStudyState } from './StudyStateContext';
import { usePokemonCollection } from '../components/Collection/hooks/usePokemonCollection';

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
  const { pokemonCollection, checkNewPokemonAchievement } = usePokemonCollection();
  
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
