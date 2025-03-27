import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import PokemonCollection from '../components/Collection/PokemonCollection';
import { useStudyState } from '../contexts/StudyStateContext';

const PokemonCollectionPage = () => {
  const { isLoading, totalStudyHours } = useStudyState();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">ポケモンコレクション</h1>
        <p className="text-gray-600">学習の進捗に応じてポケモンをコレクションしよう！</p>
      </div>
      
      <PokemonCollection />
    </MainLayout>
  );
};

export default PokemonCollectionPage;
